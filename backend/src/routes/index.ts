import { Router } from 'express';
import { dbReady } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import ticketRoutes from './ticket.routes.js';

const api = Router();

api.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'supportflow-api',
    database: dbReady() ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

// Every route below needs the database. Fail fast with a clear message instead
// of hanging until a driver timeout.
api.use((_req, _res, next) => {
  if (!dbReady()) {
    return next(
      new ApiError(
        503,
        'Database is not connected. Check MONGODB_URI in backend/.env — the server will reconnect automatically once it is reachable.',
      ),
    );
  }
  next();
});

api.use('/auth', authRoutes);
api.use('/tickets', ticketRoutes);
api.use('/dashboard', dashboardRoutes);

// Agent roster — used by the admin assignment UI.
api.get(
  '/agents',
  requireAuth,
  requireRole('agent', 'admin'),
  asyncHandler(async (_req, res) => {
    const agents = await User.find({ role: { $in: ['agent', 'admin'] } })
      .select('name email role')
      .sort({ name: 1 })
      .lean();
    res.json({
      agents: agents.map((a) => ({
        id: String(a._id),
        name: a.name,
        email: a.email,
        role: a.role,
      })),
    });
  }),
);

export default api;
