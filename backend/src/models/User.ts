import bcrypt from 'bcryptjs';
import { type HydratedDocument, type Model, model, Schema } from 'mongoose';
import { type Role, ROLES } from '../constants.js';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
  },
  { timestamps: true },
);

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const clean = ret as unknown as Record<string, unknown>;
    delete clean.passwordHash;
    delete clean.__v;
    return clean;
  },
});

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export const User: UserModel = model<IUser, UserModel>('User', userSchema);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
