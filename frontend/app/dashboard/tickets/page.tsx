'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Filter, PlusCircle, Search, X } from 'lucide-react';
import { TicketList } from '@/components/tickets/TicketList';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Field';
import { EmptyState, ErrorState, LoadingSpinner } from '@/components/ui/primitives';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { CATEGORIES, PRIORITIES, STATUSES } from '@/lib/constants';
import type { Ticket } from '@/lib/types';
import { errorMessage } from '@/lib/utils';
import { useAuth } from '@/store/auth';

function TicketsView() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const params = useSearchParams();
  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState(params.get('status') ?? '');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/tickets', {
        params: {
          status: status || undefined,
          priority: priority || undefined,
          category: category || undefined,
          mine: isStaff && mine ? 'true' : undefined,
          q: debouncedQ || undefined,
          limit: 100,
        },
      });
      setTickets(res.data.tickets);
    } catch (err) {
      setError(errorMessage(err, 'Could not load tickets'));
    } finally {
      setLoading(false);
    }
  }, [status, priority, category, mine, debouncedQ, isStaff]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const hasFilters = status || priority || category || mine || debouncedQ;

  function clearFilters() {
    setStatus('');
    setPriority('');
    setCategory('');
    setMine(false);
    setQ('');
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Tickets</h1>
          <p className="text-sm text-muted">
            {isStaff ? 'The full support queue.' : 'All tickets you have submitted.'}
          </p>
        </div>
        {user?.role === 'customer' && (
          <Link href="/dashboard/tickets/new">
            <Button>
              <PlusCircle className="h-4 w-4" />
              New Ticket
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={
                isStaff ? 'Search ticket #, subject or customer' : 'Search ticket # or subject'
              }
              className="w-full rounded-lg border border-line bg-surface-2 py-2 pl-9 pr-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-40">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="sm:w-40">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-40">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          {isStaff && (
            <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={mine}
                onChange={(e) => setMine(e.target.checked)}
                className="accent-gold"
              />
              Assigned to me
            </label>
          )}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-content"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading tickets…" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-6 w-6" />}
          title={hasFilters ? 'No tickets match these filters' : 'No tickets yet'}
          description={
            hasFilters ? 'Try clearing one or more filters.' : 'Tickets will appear here once created.'
          }
          action={
            hasFilters ? (
              <Button size="sm" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-xs text-muted">
            {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
          </p>
          <TicketList tickets={tickets} showCustomer={isStaff} />
        </>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TicketsView />
    </Suspense>
  );
}
