import { type HydratedDocument, model, Schema, type Types } from 'mongoose';
import {
  type Category,
  CATEGORIES,
  type Priority,
  PRIORITIES,
  type Status,
  STATUSES,
} from '../constants';

export interface ITicket {
  ticketNumber: string;
  customerId: Types.ObjectId;
  assignedAgentId?: Types.ObjectId | null;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  aiCategory?: Category | null;
  aiPriority?: Priority | null;
  aiSummary?: string | null;
  aiReviewed: boolean;
  aiError?: string | null;
  resolutionNote: string;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedAgentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
    description: { type: String, required: true, trim: true, minlength: 5, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, default: 'General', index: true },
    priority: { type: String, enum: PRIORITIES, default: 'Medium', index: true },
    status: { type: String, enum: STATUSES, default: 'New', index: true },
    aiCategory: { type: String, enum: CATEGORIES, default: null },
    aiPriority: { type: String, enum: PRIORITIES, default: null },
    aiSummary: { type: String, default: null, maxlength: 600 },
    aiReviewed: { type: Boolean, default: false },
    aiError: { type: String, default: null },
    resolutionNote: { type: String, default: '', maxlength: 2000 },
  },
  { timestamps: true },
);

ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ subject: 'text' });

ticketSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as unknown as Record<string, unknown>).__v;
    return ret;
  },
});

export type TicketDocument = HydratedDocument<ITicket>;

export const Ticket = model<ITicket>('Ticket', ticketSchema);
