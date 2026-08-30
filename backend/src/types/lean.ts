import type { Types } from 'mongoose';
import type { Category, Priority, Role, Status } from '../constants';

/** A ref field that may be an ObjectId or a populated user document. */
export interface UserRef {
  _id: Types.ObjectId;
  name: string;
  email?: string;
  role?: Role;
}

export interface PopulatedTicketLean {
  _id: Types.ObjectId;
  ticketNumber: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  aiCategory: Category | null;
  aiPriority: Priority | null;
  aiSummary: string | null;
  aiReviewed: boolean;
  aiError: string | null;
  resolutionNote: string;
  customerId: UserRef | Types.ObjectId;
  assignedAgentId: UserRef | Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PopulatedMessageLean {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId | { _id: Types.ObjectId };
  senderId: UserRef | Types.ObjectId;
  senderRole: Role;
  message: string;
  createdAt: Date;
}

export function isUserRef(value: unknown): value is UserRef {
  return (
    !!value &&
    typeof value === 'object' &&
    'name' in (value as Record<string, unknown>) &&
    '_id' in (value as Record<string, unknown>)
  );
}
