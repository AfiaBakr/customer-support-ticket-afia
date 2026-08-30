export const CATEGORIES = [
  'Billing',
  'Technical',
  'Account',
  'Order',
  'Payment',
  'Delivery',
  'General',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ['New', 'Assigned', 'In Progress', 'Resolved'] as const;
export type Status = (typeof STATUSES)[number];

export const ROLES = ['customer', 'agent', 'admin'] as const;
export type Role = (typeof ROLES)[number];

/**
 * Allowed forward status transitions. Reopening a resolved ticket is handled
 * by an explicit endpoint, not through this table.
 */
export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  New: ['Assigned'],
  Assigned: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [],
};
