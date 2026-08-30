'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Radio, Wifi, WifiOff } from 'lucide-react';
import { AgentActions } from '@/components/tickets/AgentActions';
import { AIReviewPanel } from '@/components/tickets/AIReviewPanel';
import { Conversation } from '@/components/tickets/Conversation';
import { TicketTimeline } from '@/components/tickets/TicketTimeline';
import {
  ErrorState,
  LoadingSpinner,
  PriorityBadge,
  StatusBadge,
} from '@/components/ui/primitives';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import type { Message, Ticket } from '@/lib/types';
import { errorMessage, formatDate } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useAuth } from '@/store/auth';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [canModify, setCanModify] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const seenIds = useRef<Set<string>>(new Set());

  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [t, m] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/messages`),
      ]);
      setTicket(t.data.ticket);
      setCanModify(t.data.canModify);
      const msgs: Message[] = m.data.messages;
      seenIds.current = new Set(msgs.map((x) => x.id));
      setMessages(msgs);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this ticket'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: join ticket room, receive messages + status updates.
  useEffect(() => {
    if (!socket || !id) return;

    const join = () => socket.emit('join-ticket', id);
    join();
    socket.on('connect', join);

    const onMessage = (msg: Message) => {
      if (msg.ticketId !== id || seenIds.current.has(msg.id)) return;
      seenIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
    };
    const onStatus = (payload: { ticketId: string; ticket: Ticket }) => {
      if (payload.ticketId !== id) return;
      setTicket(payload.ticket);
      toast.info(`Status updated to “${payload.ticket.status}”.`);
    };
    const onUpdated = (updated: Ticket) => {
      if (updated.id !== id) return;
      setTicket(updated);
    };

    socket.on('new-message', onMessage);
    socket.on('ticket-status-updated', onStatus);
    socket.on('ticket-updated', onUpdated);

    return () => {
      socket.emit('leave-ticket', id);
      socket.off('connect', join);
      socket.off('new-message', onMessage);
      socket.off('ticket-status-updated', onStatus);
      socket.off('ticket-updated', onUpdated);
    };
  }, [socket, id]);

  async function sendMessage(text: string) {
    try {
      const res = await api.post(`/tickets/${id}/messages`, { message: text });
      const msg: Message = res.data.message;
      if (!seenIds.current.has(msg.id)) {
        seenIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Message not sent'));
      throw err;
    }
  }

  if (loading) return <LoadingSpinner label="Loading ticket…" />;
  if (error || !ticket)
    return <ErrorState message={error || 'Ticket not found'} onRetry={load} />;

  const editable = isStaff && canModify;

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-sm text-gold">{ticket.ticketNumber}</p>
            <h1 className="mt-1 text-lg font-bold">{ticket.subject}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span
              className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-muted"
              title={connected ? 'Live updates active' : 'Reconnecting…'}
            >
              {connected ? (
                <Wifi className="h-3 w-3 text-emerald-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-muted" />
              )}
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm text-muted">{ticket.description}</p>

        <div className="mt-4">
          <TicketTimeline status={ticket.status} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Conversation */}
        <div className="order-2 lg:order-1">
          <Conversation
            messages={messages}
            currentUserId={user?.id ?? ''}
            onSend={sendMessage}
          />
          <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
            <Radio className="h-3 w-3" />
            Messages are stored and delivered in real time to everyone on this ticket.
          </p>
        </div>

        {/* Sidebar */}
        <div className="order-1 space-y-4 lg:order-2">
          <div className="rounded-xl border border-line bg-surface p-4 text-sm">
            <p className="font-semibold">Ticket information</p>
            <dl className="mt-3 space-y-2 text-xs">
              {[
                ['Category', ticket.category],
                ['Priority', `${ticket.priority}`],
                ['Status', ticket.status],
                ['Customer', ticket.customer?.name ?? '—'],
                ['Assigned agent', ticket.assignedAgent?.name ?? 'Unassigned'],
                ['Created', formatDate(ticket.createdAt)],
                ['Updated', formatDate(ticket.updatedAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right text-content">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {(isStaff || ticket.aiSummary) && (
            <AIReviewPanel ticket={ticket} editable={editable} onUpdated={setTicket} />
          )}

          {editable && (
            <AgentActions
              ticket={ticket}
              currentUserId={user?.id ?? ''}
              onUpdated={setTicket}
            />
          )}

          {isStaff && !canModify && ticket.assignedAgent && (
            <p className="rounded-xl border border-line bg-surface p-4 text-xs text-muted">
              This ticket is assigned to {ticket.assignedAgent.name}. You can read it and post
              messages, but only the assigned agent or an admin can change its status.
            </p>
          )}

          {!isStaff && ticket.status === 'Resolved' && ticket.resolutionNote && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
              <p className="font-medium text-emerald-500">Resolution</p>
              <p className="mt-1 text-muted">{ticket.resolutionNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
