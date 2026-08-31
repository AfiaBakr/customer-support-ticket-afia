import { Types } from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import {
  createMessage,
  listMessagesForTicket,
} from '../services/message.service.js';
import { assertCanView } from '../services/ticketAccess.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listMessages = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const { id } = req.params;

  if (!Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('Invalid ticket id');
  }
  const ticket = await Ticket.findById(id)
    .select('customerId assignedAgentId')
    .lean();
  if (!ticket) {
    throw ApiError.notFound('Ticket not found');
  }
  assertCanView(actor, ticket);

  const messages = await listMessagesForTicket(id);
  res.json({ messages });
});

export const postMessage = asyncHandler(async (req, res) => {
  const actor = req.user!;
  const { id } = req.params;
  const { message } = req.body as { message: string };

  const created = await createMessage({ ticketId: id, text: message, actor });
  res.status(201).json({ message: created });
});
