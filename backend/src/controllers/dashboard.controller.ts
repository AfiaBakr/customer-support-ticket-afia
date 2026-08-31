import { Types } from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

type StatusRow = { _id: string; count: number };

const STATUS_KEYS = ['New', 'Assigned', 'In Progress', 'Resolved'] as const;
type StatusKey = (typeof STATUS_KEYS)[number];

function tally(rows: StatusRow[]): Record<StatusKey, number> {
  const base: Record<StatusKey, number> = {
    New: 0,
    Assigned: 0,
    'In Progress': 0,
    Resolved: 0,
  };
  for (const row of rows) {
    if ((STATUS_KEYS as readonly string[]).includes(row._id)) {
      base[row._id as StatusKey] = row.count;
    }
  }
  return base;
}

interface SlimTicketSource {
  _id: unknown;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  customerId?: { _id: unknown; name: string } | unknown;
  assignedAgentId?: { _id: unknown; name: string } | unknown;
}

function slimTicket(t: SlimTicketSource) {
  const cust = t.customerId as { _id: unknown; name: string } | null;
  const agent = t.assignedAgentId as { _id: unknown; name: string } | null;
  return {
    id: String(t._id),
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    customer: cust && typeof cust === 'object' && 'name' in cust
      ? { id: String(cust._id), name: cust.name }
      : null,
    assignedAgent: agent && typeof agent === 'object' && 'name' in agent
      ? { id: String(agent._id), name: agent.name }
      : null,
  };
}

export const customerDashboard = asyncHandler(async (req, res) => {
  const customerId = new Types.ObjectId(req.user!.id);

  const [byStatus, recent, total] = await Promise.all([
    Ticket.aggregate<StatusRow>([
      { $match: { customerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Ticket.find({ customerId })
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate('assignedAgentId', 'name')
      .lean(),
    Ticket.countDocuments({ customerId }),
  ]);

  const stats = tally(byStatus);
  res.json({
    stats: {
      total,
      new: stats.New,
      inProgress: stats['In Progress'] + stats.Assigned,
      resolved: stats.Resolved,
      active: total - stats.Resolved,
    },
    recentTickets: recent.map((t) => slimTicket(t as unknown as SlimTicketSource)),
  });
});

export const agentDashboard = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const scope =
    actor.role === 'admin'
      ? {}
      : { assignedAgentId: new Types.ObjectId(actor.id) };

  const [byStatus, highPriority, unassigned, recent, total] = await Promise.all([
    Ticket.aggregate<StatusRow>([
      { $match: scope },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Ticket.countDocuments({ ...scope, priority: 'High', status: { $ne: 'Resolved' } }),
    Ticket.countDocuments({ assignedAgentId: null, status: 'New' }),
    Ticket.find(scope)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('customerId', 'name')
      .populate('assignedAgentId', 'name')
      .lean(),
    Ticket.countDocuments(scope),
  ]);

  const stats = tally(byStatus);
  res.json({
    stats: {
      total,
      new: stats.New,
      assigned: stats.Assigned,
      inProgress: stats['In Progress'],
      resolved: stats.Resolved,
      highPriority,
      unassigned,
    },
    recentTickets: recent.map((t) => slimTicket(t as unknown as SlimTicketSource)),
  });
});

export const adminDashboard = asyncHandler(async (_req, res) => {
  const [byStatus, byCategory, byPriority, users, agents] = await Promise.all([
    Ticket.aggregate<StatusRow>([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Ticket.aggregate<StatusRow>([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Ticket.aggregate<StatusRow>([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    User.countDocuments({}),
    User.countDocuments({ role: 'agent' }),
  ]);

  const stats = tally(byStatus);
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  res.json({
    stats: {
      total,
      open: total - stats.Resolved,
      resolved: stats.Resolved,
      highPriority: byPriority.find((p) => p._id === 'High')?.count ?? 0,
      users,
      agents,
    },
    byStatus: STATUS_KEYS.map((status) => ({ status, count: stats[status] })),
    byCategory: byCategory.map((c) => ({ category: c._id, count: c.count })),
    byPriority: byPriority.map((p) => ({ priority: p._id, count: p.count })),
  });
});
