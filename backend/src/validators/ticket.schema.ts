import { z } from 'zod';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants.js';

export const createTicketSchema = z.object({
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(160),
  description: z
    .string()
    .trim()
    .min(15, 'Please describe the issue in at least 15 characters')
    .max(5000),
  category: z.enum(CATEGORIES).optional(),
});

export const updateTicketSchema = z
  .object({
    category: z.enum(CATEGORIES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    status: z.enum(STATUSES).optional(),
    aiSummary: z.string().trim().min(3).max(600).optional(),
    aiReviewed: z.boolean().optional(),
    resolutionNote: z.string().trim().max(2000).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export const assignSchema = z.object({
  agentId: z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, 'Invalid agent id')
    .optional(),
});

export const resolveSchema = z.object({
  resolutionNote: z
    .string()
    .trim()
    .min(5, 'Resolution note must be at least 5 characters')
    .max(2000),
});

export const messageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000),
});

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
