export type Role = 'customer' | 'agent' | 'admin';
export type Category =
  | 'Billing'
  | 'Technical'
  | 'Account'
  | 'Order'
  | 'Payment'
  | 'Delivery'
  | 'General'
  | 'Other';
export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'New' | 'Assigned' | 'In Progress' | 'Resolved';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string | null;
}

export interface UserRef {
  id: string;
  name: string;
  email?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  aiCategory: Category | null;
  aiPriority: Priority | null;
  aiSummary: string | null;
  aiReviewed: boolean;
  aiError: string | null;
  resolutionNote: string;
  customer: UserRef | null;
  assignedAgent: UserRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  message: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CustomerStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  active: number;
}

export interface AgentStats {
  total: number;
  new: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  unassigned: number;
}

export interface AdminStats {
  total: number;
  open: number;
  resolved: number;
  highPriority: number;
  users: number;
  agents: number;
}

export interface SlimTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: Category;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
  customer: UserRef | null;
  assignedAgent: UserRef | null;
}
