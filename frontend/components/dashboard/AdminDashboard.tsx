'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FolderOpen, Inbox, Users } from 'lucide-react';
import { StatsCard } from '@/components/tickets/StatsCard';
import { ErrorState } from '@/components/ui/primitives';
import { AgentDashboard } from './AgentDashboard';
import { api } from '@/lib/api';
import type { AdminStats } from '@/lib/types';
import { errorMessage } from '@/lib/utils';

interface AdminPayload {
  stats: AdminStats;
  byStatus: { status: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

function Bars({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 truncate text-muted">{r.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-gold-strong to-gold-soft"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </span>
            <span className="w-6 text-right tabular-nums text-content">{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, 'Could not load admin analytics')));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Admin analytics</h1>
        <p className="text-sm text-muted">Live figures computed from the ticket database.</p>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatsCard label="Total tickets" value={data?.stats.total ?? 0} icon={Inbox} />
            <StatsCard label="Open" value={data?.stats.open ?? 0} icon={FolderOpen} />
            <StatsCard label="Resolved" value={data?.stats.resolved ?? 0} icon={CheckCircle2} />
            <StatsCard label="High priority" value={data?.stats.highPriority ?? 0} icon={AlertTriangle} accent />
            <StatsCard label="Users" value={data?.stats.users ?? 0} icon={Users} />
            <StatsCard label="Agents" value={data?.stats.agents ?? 0} icon={Users} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Bars
              title="By status"
              rows={(data?.byStatus ?? []).map((r) => ({ label: r.status, count: r.count }))}
            />
            <Bars
              title="By priority"
              rows={(data?.byPriority ?? []).map((r) => ({ label: r.priority, count: r.count }))}
            />
            <Bars
              title="By category"
              rows={(data?.byCategory ?? []).map((r) => ({ label: r.category, count: r.count }))}
            />
          </div>
        </>
      )}

      <div className="border-t border-line pt-6">
        <AgentDashboard />
      </div>
    </div>
  );
}
