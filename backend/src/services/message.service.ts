import { Types } from 'mongoose';
import type { Role } from '../constants.js';
import { Message } from '../models/Message.js';
import { Ticket } from '../models/Ticket.js';
import type { PopulatedMessageLean } from '../types/lean.js';
import { ApiError } from '../utils/ApiError.js';
import { type SerializedMessage, serializeMessage } from '../utils/serializers.js';
import { canMessageTicket } from './ticketAccess.js';
import { emitNewMessage } from '../sockets/index.js';

interface Actor {
  id: string;
  role: Role;
}

interface CreateMessageParams {
  ticketId: string;
  text: string;
  actor: Actor;
}

/**
 * Persists a message, touches the parent ticket's updatedAt, emits `new-message`
 * to the ticket room and returns the serialized message. Shared by the REST
 * endpoint and the Socket.IO `ticket-message` handler.
 */
export async function createMessage(params: CreateMessageParams): Promise<SerializedMessage> {
  const { ticketId, text, actor } = params;

  if (!Types.ObjectId.isValid(ticketId)) {
    throw ApiError.badRequest('Invalid ticket id');
  }
  const trimmed = text?.trim();
  if (!trimmed) {
    throw ApiError.unprocessable('Message cannot be empty');
  }

  const ticket = await Ticket.findById(ticketId).select('customerId assignedAgentId').lean();
  if (!ticket) {
    throw ApiError.notFound('Ticket not found');
  }
  if (!canMessageTicket(actor, ticket)) {
    throw ApiError.forbidden('You cannot post messages on this ticket');
  }

  const created = await Message.create({
    ticketId: new Types.ObjectId(ticketId),
    senderId: new Types.ObjectId(actor.id),
    senderRole: actor.role,
    message: trimmed,
  });

  await Ticket.updateOne({ _id: ticketId }, { $set: { updatedAt: new Date() } });

  const populated = await Message.findById(created._id)
    .populate('senderId', 'name role')
    .lean<PopulatedMessageLean>();

  const payload = serializeMessage(populated as PopulatedMessageLean);
  emitNewMessage(ticketId, payload);
  return payload;
}

export async function listMessagesForTicket(ticketId: string): Promise<SerializedMessage[]> {
  const rows = await Message.find({ ticketId })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name role')
    .lean<PopulatedMessageLean[]>();
  return rows.map(serializeMessage);
}
