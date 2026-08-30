import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../constants';

export interface JwtPayload {
  id: string;
  role: Role;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded === 'string' ||
    typeof decoded.id !== 'string' ||
    typeof decoded.role !== 'string'
  ) {
    throw new Error('Malformed token payload');
  }
  return { id: decoded.id, role: decoded.role as Role };
}
