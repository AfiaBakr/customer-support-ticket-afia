import { Router } from 'express';
import {
  listMessages,
  postMessage,
} from '../controllers/message.controller.js';
import * as tickets from '../controllers/ticket.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  assignSchema,
  createTicketSchema,
  listQuerySchema,
  messageSchema,
  resolveSchema,
  updateTicketSchema,
} from '../validators/ticket.schema.js';

const router = Router();

router.use(requireAuth);

router.get('/', validate(listQuerySchema, 'query'), tickets.listTickets);
router.post('/', requireRole('customer'), validate(createTicketSchema), tickets.createTicket);

router.get('/:id', tickets.getTicket);
router.patch(
  '/:id',
  requireRole('agent', 'admin'),
  validate(updateTicketSchema),
  tickets.updateTicket,
);
router.post(
  '/:id/assign',
  requireRole('agent', 'admin'),
  validate(assignSchema),
  tickets.assignTicket,
);
router.post('/:id/triage', requireRole('agent', 'admin'), tickets.retriageTicket);
router.post(
  '/:id/resolve',
  requireRole('agent', 'admin'),
  validate(resolveSchema),
  tickets.resolveTicket,
);
router.post('/:id/reopen', requireRole('agent', 'admin'), tickets.reopenTicket);

router.get('/:id/messages', listMessages);
router.post('/:id/messages', validate(messageSchema), postMessage);

export default router;
