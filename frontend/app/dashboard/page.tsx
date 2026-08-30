'use client';

import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { AgentDashboard } from '@/components/dashboard/AgentDashboard';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { LoadingSpinner } from '@/components/ui/primitives';
import { useAuth } from '@/store/auth';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return <LoadingSpinner />;
  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'agent') return <AgentDashboard />;
  return <CustomerDashboard />;
}
