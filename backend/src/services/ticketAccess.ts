import type { Types } from 'mongoose';
import type { Role } from '../constants';
import { ApiError } from '../utils/ApiError';

interface Actor {
  id: string;
  role: Role;
}

type TicketRefs = {
  customerId: Types.ObjectId | { _id: Types.ObjectId } | string;
  assignedAgentId?: Types.ObjectId | { _id: Types.ObjectId } | string | null;
};

function idOf(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

/** Who may read a ticket. Agents & admins can see the whole queue. */
export function canViewTicket(actor: Actor, ticket: TicketRefs): boolean {
  if (actor.role === 'admin' || actor.role === 'agent') return true;
  return idOf(ticket.customerId) === actor.id;
}

/**
 * Who may modify a ticket (status, category, priority, triage, resolution).
 * An agent may act on a ticket assigned to them or on an unassigned ticket
 * (queue pickup). Agents may never touch a ticket owned by another agent.
 */
export function canModifyTicket(actor: Actor, ticket: TicketRefs): boolean {
  if (actor.role === 'admin') return true;
  if (actor.role === 'agent') {
    const assignee = idOf(ticket.assignedAgentId);
    return assignee === '' || assignee === actor.id;
  }
  return false;
}

/** Who may post messages on a ticket. */
export function canMessageTicket(actor: Actor, ticket: TicketRefs): boolean {
  if (actor.role === 'admin' || actor.role === 'agent') return true;
  return idOf(ticket.customerId) === actor.id;
}

export function assertCanView(actor: Actor, ticket: TicketRefs): void {
  if (!canViewTicket(actor, ticket)) {
    throw ApiError.forbidden('You do not have access to this ticket');
  }
}

export function assertCanModify(actor: Actor, ticket: TicketRefs): void {
  if (!canModifyTicket(actor, ticket)) {
    throw ApiError.forbidden('This ticket is assigned to another agent');
  }
}
