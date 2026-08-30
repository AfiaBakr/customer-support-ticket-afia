import { z } from 'zod';
import { CATEGORIES } from './constants';
import type { Category } from './types';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['customer', 'agent']),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const createTicketSchema = z.object({
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(160),
  description: z
    .string()
    .trim()
    .min(15, 'Please describe the issue in at least 15 characters')
    .max(5000),
  category: z
    .union([z.enum(CATEGORIES as [Category, ...Category[]]), z.literal('')])
    .optional(),
});
export type CreateTicketValues = z.infer<typeof createTicketSchema>;
