import type { Category, Priority, Status } from './types';

export const CATEGORIES: Category[] = [
  'Billing',
  'Technical',
  'Account',
  'Order',
  'Payment',
  'Delivery',
  'General',
  'Other',
];

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];

export const STATUSES: Status[] = ['New', 'Assigned', 'In Progress', 'Resolved'];

/** Next status an agent can move a ticket to (mirrors the server rules). */
export const NEXT_STATUS: Record<Status, Status | null> = {
  New: 'Assigned',
  Assigned: 'In Progress',
  'In Progress': 'Resolved',
  Resolved: null,
};

export const STATUS_STYLES: Record<Status, string> = {
  New: 'bg-sky-500/10 text-sky-500 ring-sky-500/30',
  Assigned: 'bg-violet-500/10 text-violet-500 ring-violet-500/30',
  'In Progress': 'bg-gold/10 text-gold ring-gold/40',
  Resolved: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/30',
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  Low: 'bg-slate-500/10 text-muted ring-slate-500/30',
  Medium: 'bg-amber-500/10 text-amber-500 ring-amber-500/30',
  High: 'bg-red-500/10 text-red-500 ring-red-500/40',
};

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:4000';
