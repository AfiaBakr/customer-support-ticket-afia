'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  CircleDot,
  Inbox,
  PlusCircle,
  Timer,
} from 'lucide-react';
import { StatsCard } from '@/components/tickets/StatsCard';
import { TicketList } from '@/components/tickets/TicketList';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState } from '@/components/ui/primitives';
import { api } from '@/lib/api';
import type { CustomerStats, SlimTicket } from '@/lib/types';
import { errorMessage } from '@/lib/utils';
import { useAuth } from '@/store/auth';

export function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [recent, setRecent] = useState<SlimTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/customer');
      setStats(res.data.stats);
      setRecent(res.data.recentTickets);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your dashboard'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            Welcome back, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-muted">Here is where your support requests stand.</p>
        </div>
        <Link href="/dashboard/tickets/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            Create New Ticket
          </Button>
        </Link>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatsCard label="Total tickets" value={stats?.total ?? 0} icon={Inbox} loading={loading} />
            <StatsCard label="New" value={stats?.new ?? 0} icon={CircleDot} loading={loading} />
            <StatsCard
              label="In progress"
              value={stats?.inProgress ?? 0}
              icon={Timer}
              loading={loading}
            />
            <StatsCard
              label="Resolved"
              value={stats?.resolved ?? 0}
              icon={CheckCircle2}
              accent
              loading={loading}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Recent tickets</h2>
              <Link href="/dashboard/tickets" className="text-xs text-gold hover:underline">
                View all
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
                title="No tickets yet"
                description="Create your first ticket and our AI will triage it instantly."
                action={
                  <Link href="/dashboard/tickets/new">
                    <Button size="sm">Create a ticket</Button>
                  </Link>
                }
              />
            ) : (
              <TicketList tickets={recent} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
