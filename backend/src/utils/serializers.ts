import {
  isUserRef,
  type PopulatedMessageLean,
  type PopulatedTicketLean,
} from '../types/lean.js';

export interface SerializedUserRef {
  id: string;
  name: string;
  email?: string;
}

export interface SerializedTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  aiCategory: string | null;
  aiPriority: string | null;
  aiSummary: string | null;
  aiReviewed: boolean;
  aiError: string | null;
  resolutionNote: string;
  customer: SerializedUserRef | null;
  assignedAgent: SerializedUserRef | null;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeTicket(t: PopulatedTicketLean): SerializedTicket {
  return {
    id: String(t._id),
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category,
    priority: t.priority,
    status: t.status,
    aiCategory: t.aiCategory ?? null,
    aiPriority: t.aiPriority ?? null,
    aiSummary: t.aiSummary ?? null,
    aiReviewed: Boolean(t.aiReviewed),
    aiError: t.aiError ?? null,
    resolutionNote: t.resolutionNote ?? '',
    customer: isUserRef(t.customerId)
      ? { id: String(t.customerId._id), name: t.customerId.name, email: t.customerId.email }
      : t.customerId
        ? { id: String(t.customerId), name: 'Customer' }
        : null,
    assignedAgent: isUserRef(t.assignedAgentId)
      ? { id: String(t.assignedAgentId._id), name: t.assignedAgentId.name, email: t.assignedAgentId.email }
      : null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

export interface SerializedMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: Date;
}

export function serializeMessage(m: PopulatedMessageLean): SerializedMessage {
  const ticketId =
    typeof m.ticketId === 'object' && '_id' in m.ticketId ? String(m.ticketId._id) : String(m.ticketId);
  return {
    id: String(m._id),
    ticketId,
    senderId: isUserRef(m.senderId) ? String(m.senderId._id) : String(m.senderId),
    senderName: isUserRef(m.senderId) ? m.senderId.name : 'User',
    senderRole: m.senderRole,
    message: m.message,
    createdAt: m.createdAt,
  };
}
