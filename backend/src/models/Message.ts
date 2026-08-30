import { type HydratedDocument, model, Schema, type Types } from 'mongoose';
import { type Role, ROLES } from '../constants';

export interface IMessage {
  ticketId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: Role;
  message: string;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ROLES, required: true },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 4000 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

export type MessageDocument = HydratedDocument<IMessage>;

export const Message = model<IMessage>('Message', messageSchema);
