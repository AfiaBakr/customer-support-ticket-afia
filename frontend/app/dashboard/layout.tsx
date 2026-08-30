'use client';

import { DashboardShell } from '@/components/layout/DashboardShell';
import { LoadingSpinner } from '@/components/ui/primitives';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner label="Preparing your workspace…" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
