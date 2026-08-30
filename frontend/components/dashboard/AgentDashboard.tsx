'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Inbox,
  Timer,
  UserCheck,
} from 'lucide-react';
import { StatsCard } from '@/components/tickets/StatsCard';
import { TicketList } from '@/components/tickets/TicketList';
import { EmptyState, ErrorState } from '@/components/ui/primitives';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import type { AgentStats, SlimTicket } from '@/lib/types';
import { errorMessage } from '@/lib/utils';
import { useAuth } from '@/store/auth';

export function AgentDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [recent, setRecent] = useState<SlimTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get('/dashboard/agent');
      setStats(res.data.stats);
      setRecent(res.data.recentTickets);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the agent dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live-refresh stats as tickets move around the queue.
  useEffect(() => {
    if (!socket) return;
    const refresh = () => void load();
    socket.on('ticket-created', refresh);
    socket.on('ticket-updated', refresh);
    socket.on('ticket-status-updated', refresh);
    return () => {
      socket.off('ticket-created', refresh);
      socket.off('ticket-updated', refresh);
      socket.off('ticket-status-updated', refresh);
    };
  }, [socket, load]);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          {isAdmin ? 'Support overview' : `Your workspace, ${user?.name.split(' ')[0]}`}
        </h1>
        <p className="text-sm text-muted">
          {isAdmin
            ? 'Every ticket across the team.'
            : 'Tickets assigned to you, plus the shared queue.'}
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatsCard label={isAdmin ? 'All tickets' : 'Assigned to me'} value={stats?.total ?? 0} icon={Inbox} loading={loading} />
            <StatsCard label="New" value={stats?.new ?? 0} icon={CircleDot} loading={loading} />
            <StatsCard label="Assigned" value={stats?.assigned ?? 0} icon={UserCheck} loading={loading} />
            <StatsCard label="In progress" value={stats?.inProgress ?? 0} icon={Timer} loading={loading} />
            <StatsCard label="Resolved" value={stats?.resolved ?? 0} icon={CheckCircle2} loading={loading} />
            <StatsCard label="High priority" value={stats?.highPriority ?? 0} icon={AlertTriangle} accent loading={loading} />
          </div>

          {typeof stats?.unassigned === 'number' && stats.unassigned > 0 && (
            <Link
              href="/dashboard/tickets?status=New"
              className="flex items-center justify-between rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 text-sm"
            >
              <span className="text-content">
                <span className="font-semibold text-gold">{stats.unassigned}</span> unassigned
                ticket{stats.unassigned > 1 ? 's' : ''} waiting in the queue
              </span>
              <span className="text-xs text-gold">Open queue →</span>
            </Link>
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent activity</h2>
              <Link href="/dashboard/tickets" className="text-xs text-gold hover:underline">
                View all tickets
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-6 w-6" />}
                title="No assigned tickets"
                description="When a ticket is assigned to you it will show up here."
              />
            ) : (
              <TicketList tickets={recent} showCustomer />
            )}
          </div>
        </>
      )}
    </div>
  );
}
