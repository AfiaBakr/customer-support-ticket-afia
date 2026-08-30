import { Types } from 'mongoose';
import {
  type Category,
  type Priority,
  type Status,
  STATUS_TRANSITIONS,
} from '../constants';
import { Ticket, type TicketDocument } from '../models/Ticket';
import { User } from '../models/User';
import { AiUnavailableError, triageTicket } from '../services/ai.service';
import { createMessage } from '../services/message.service';
import { nextTicketNumber } from '../services/ticketNumber.service';
import {
  assertCanModify,
  assertCanView,
  canModifyTicket,
} from '../services/ticketAccess';
import {
  emitStatusUpdated,
  emitTicketCreated,
  emitTicketUpdated,
} from '../sockets';
import type { PopulatedTicketLean } from '../types/lean';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { escapeRegex } from '../utils/regex';
import { serializeTicket } from '../utils/serializers';
import type {
  CreateTicketInput,
  ListQuery,
  UpdateTicketInput,
} from '../validators/ticket.schema';

const POPULATE = [
  { path: 'customerId', select: 'name email' },
  { path: 'assignedAgentId', select: 'name email' },
];

async function loadTicketOr404(id: string): Promise<TicketDocument> {
  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid ticket id');
  }
  const ticket = await Ticket.findById(id).populate(POPULATE);
  if (!ticket) {
    throw ApiError.notFound('Ticket not found');
  }
  return ticket;
}

function present(ticket: TicketDocument) {
  return serializeTicket(ticket.toObject() as unknown as PopulatedTicketLean);
}

/* ---------------------------------- create --------------------------------- */

export const createTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const { subject, description, category } = req.body as CreateTicketInput;

  const ticketNumber = await nextTicketNumber();

  let aiCategory: Category | null = null;
  let aiPriority: Priority | null = null;
  let aiSummary: string | null = null;
  let aiError: string | null = null;
  let finalCategory: Category = category ?? 'General';
  let finalPriority: Priority = 'Medium';

  try {
    const triage = await triageTicket({
      subject,
      description,
      customerCategory: category ?? null,
    });
    aiCategory = triage.category;
    aiPriority = triage.priority;
    aiSummary = triage.summary;
    if (!category) finalCategory = triage.category;
    finalPriority = triage.priority;
  } catch (err) {
    aiError =
      err instanceof AiUnavailableError
        ? err.message
        : 'AI triage failed unexpectedly';
    console.warn('[ai] triage failed:', aiError);
  }

  const ticket = await Ticket.create({
    ticketNumber,
    customerId: new Types.ObjectId(actor.id),
    subject,
    description,
    category: finalCategory,
    priority: finalPriority,
    status: 'New',
    aiCategory,
    aiPriority,
    aiSummary,
    aiReviewed: false,
    aiError,
  });

  await ticket.populate(POPULATE);
  const payload = present(ticket);
  emitTicketCreated(payload);

  res.status(201).json({
    ticket: payload,
    aiAvailable: !aiError,
    message: aiError
      ? 'Ticket created. AI triage is temporarily unavailable — it can be classified manually.'
      : 'Ticket created and analyzed with AI.',
  });
});

/* ----------------------------------- list ---------------------------------- */

export const listTickets = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const query = (req.validatedQuery ?? {}) as ListQuery;

  const filter: Record<string, unknown> = {};

  if (actor.role === 'customer') {
    filter.customerId = new Types.ObjectId(actor.id);
  } else if (actor.role === 'agent' && query.mine) {
    filter.assignedAgentId = new Types.ObjectId(actor.id);
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;

  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    const matchingUsers =
      actor.role === 'customer'
        ? []
        : await User.find({ name: rx }).select('_id').lean();
    filter.$or = [
      { ticketNumber: rx },
      { subject: rx },
      ...(matchingUsers.length
        ? [{ customerId: { $in: matchingUsers.map((u) => u._id) } }]
        : []),
    ];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 50;

  const [items, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE)
      .lean<PopulatedTicketLean[]>(),
    Ticket.countDocuments(filter),
  ]);

  res.json({
    tickets: items.map(serializeTicket),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

/* ---------------------------------- detail --------------------------------- */

export const getTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const ticket = await loadTicketOr404(req.params.id);
  assertCanView(actor, ticket);
  res.json({
    ticket: present(ticket),
    canModify: canModifyTicket(actor, ticket),
  });
});

/* ---------------------------------- update --------------------------------- */

export const updateTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const ticket = await loadTicketOr404(req.params.id);
  assertCanModify(actor, ticket);

  const body = req.body as UpdateTicketInput;

  if (ticket.status === 'Resolved') {
    throw ApiError.badRequest(
      'This ticket is resolved. Use the reopen action to make further changes.',
    );
  }

  if (body.category) ticket.category = body.category;
  if (body.priority) ticket.priority = body.priority;
  if (typeof body.aiSummary === 'string') ticket.aiSummary = body.aiSummary;
  if (typeof body.aiReviewed === 'boolean') ticket.aiReviewed = body.aiReviewed;
  if (typeof body.resolutionNote === 'string') {
    ticket.resolutionNote = body.resolutionNote;
  }

  let statusChanged = false;
  if (body.status && body.status !== ticket.status) {
    const nextStatus = body.status as Status;
    const allowed = STATUS_TRANSITIONS[ticket.status];
    if (!allowed.includes(nextStatus)) {
      throw ApiError.badRequest(
        `Cannot move ticket from "${ticket.status}" to "${nextStatus}"`,
      );
    }
    if (nextStatus === 'Resolved') {
      const note = (body.resolutionNote ?? ticket.resolutionNote).trim();
      if (!note) {
        throw ApiError.unprocessable(
          'Please add a resolution note before resolving this ticket.',
        );
      }
    }
    if (nextStatus === 'Assigned' && !ticket.assignedAgentId) {
      ticket.assignedAgentId = new Types.ObjectId(actor.id);
    }
    ticket.status = nextStatus;
    statusChanged = true;
  }

  await ticket.save();
  await ticket.populate(POPULATE);
  const payload = present(ticket);

  emitTicketUpdated(payload.id, payload);
  if (statusChanged) {
    emitStatusUpdated(payload.id, {
      ticketId: payload.id,
      status: payload.status,
      ticket: payload,
    });
  }

  res.json({ ticket: payload });
});

/* ---------------------------------- assign --------------------------------- */

export const assignTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const ticket = await loadTicketOr404(req.params.id);
  const { agentId } = req.body as { agentId?: string };

  if (ticket.status === 'Resolved') {
    throw ApiError.badRequest('Resolved tickets cannot be reassigned');
  }

  let targetAgentId = actor.id;
  if (agentId && agentId !== actor.id) {
    if (actor.role !== 'admin') {
      throw ApiError.forbidden('Only an admin can assign tickets to other agents');
    }
    const agent = await User.findById(agentId).lean();
    if (!agent || (agent.role !== 'agent' && agent.role !== 'admin')) {
      throw ApiError.badRequest('Target user is not an agent');
    }
    targetAgentId = agentId;
  }

  const currentAssignee = ticket.assignedAgentId ? String(ticket.assignedAgentId) : '';
  if (currentAssignee && currentAssignee !== targetAgentId && actor.role !== 'admin') {
    throw ApiError.forbidden('This ticket is already assigned to another agent');
  }

  ticket.assignedAgentId = new Types.ObjectId(targetAgentId);
  if (ticket.status === 'New') {
    ticket.status = 'Assigned';
  }

  await ticket.save();
  await ticket.populate(POPULATE);
  const payload = present(ticket);

  emitTicketUpdated(payload.id, payload);
  emitStatusUpdated(payload.id, {
    ticketId: payload.id,
    status: payload.status,
    ticket: payload,
  });

  res.json({ ticket: payload });
});

/* ------------------------------- re-run triage ---------------------------- */

export const retriageTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const ticket = await loadTicketOr404(req.params.id);
  assertCanModify(actor, ticket);

  try {
    const triage = await triageTicket({
      subject: ticket.subject,
      description: ticket.description,
      customerCategory: ticket.category,
    });
    ticket.aiCategory = triage.category;
    ticket.aiPriority = triage.priority;
    ticket.aiSummary = triage.summary;
    ticket.aiReviewed = false;
    ticket.aiError = null;
    await ticket.save();
  } catch (err) {
    ticket.aiError =
      err instanceof AiUnavailableError ? err.message : 'AI triage failed';
    await ticket.save();
    throw ApiError.badRequest(
      'AI triage is temporarily unavailable. You can classify this ticket manually.',
    );
  }

  await ticket.populate(POPULATE);
  const payload = present(ticket);
  emitTicketUpdated(payload.id, payload);
  res.json({ ticket: payload });
});

/* ---------------------------------- resolve ------------------------------- */

export const resolveTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const ticket = await loadTicketOr404(req.params.id);
  assertCanModify(actor, ticket);

  const { resolutionNote } = req.body as { resolutionNote: string };
  const note = resolutionNote?.trim();

  if (ticket.status === 'Resolved') {
    throw ApiError.badRequest('This ticket is already resolved');
  }
  if (!note) {
    throw ApiError.unprocessable(
      'Please add a resolution note before resolving this ticket.',
    );
  }
  if (ticket.status !== 'In Progress') {
    throw ApiError.badRequest(
      'Move the ticket to "In Progress" before resolving it',
    );
  }

  ticket.resolutionNote = note;
  ticket.status = 'Resolved';
  await ticket.save();
  await ticket.populate(POPULATE);
  const payload = present(ticket);

  // Post the resolution into the conversation so both parties see it.
  await createMessage({
    ticketId: payload.id,
    text: `✅ Ticket resolved — ${note}`,
    actor,
  });

  emitTicketUpdated(payload.id, payload);
  emitStatusUpdated(payload.id, {
    ticketId: payload.id,
    status: 'Resolved',
    ticket: payload,
  });

  res.json({ ticket: payload });
});

/* ---------------------------------- reopen ------------------------------- */

export const reopenTicket = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const ticket = await loadTicketOr404(req.params.id);
  assertCanModify(actor, ticket);

  if (ticket.status !== 'Resolved') {
    throw ApiError.badRequest('Only resolved tickets can be reopened');
  }

  ticket.status = 'In Progress';
  await ticket.save();
  await ticket.populate(POPULATE);
  const payload = present(ticket);

  emitTicketUpdated(payload.id, payload);
  emitStatusUpdated(payload.id, {
    ticketId: payload.id,
    status: payload.status,
    ticket: payload,
  });

  res.json({ ticket: payload });
});
