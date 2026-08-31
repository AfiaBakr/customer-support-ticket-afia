import { Router } from 'express';
import {
  adminDashboard,
  agentDashboard,
  customerDashboard,
} from '../controllers/dashboard.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/customer', requireRole('customer', 'admin'), customerDashboard);
router.get('/agent', requireRole('agent', 'admin'), agentDashboard);
router.get('/admin', requireRole('admin'), adminDashboard);

export default router;
