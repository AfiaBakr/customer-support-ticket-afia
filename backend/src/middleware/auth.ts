import type { RequestHandler } from 'express';
import type { Role } from '../constants';
import { User } from '../models/User';
import { verifyToken } from '../services/token.service';
import { ApiError } from '../utils/ApiError';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw ApiError.unauthorized('Missing bearer token');
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.id).lean();
    if (!user) {
      throw ApiError.unauthorized('Account no longer exists');
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(ApiError.unauthorized('Invalid or expired session'));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires role: ${roles.join(' or ')}`));
    }
    next();
  };
