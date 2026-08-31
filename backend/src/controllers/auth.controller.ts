import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, User } from '../models/User.js';
import { signToken } from '../services/token.service.js';
import type { LoginInput, RegisterInput } from '../validators/auth.schema.js';

interface PublicUserSource {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
}

function publicUser(u: PublicUserSource) {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt ?? null,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body as RegisterInput;

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
  });

  const token = signToken({ id: String(user._id), role: user.role });
  res.status(201).json({ token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: String(user._id), role: user.role });
  res.json({ token, user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await User.findById(req.user.id).lean();
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  res.json({ user: publicUser(user) });
});
