'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronRight, RotateCcw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/Modal';
import { NEXT_STATUS } from '@/lib/constants';
import type { Ticket } from '@/lib/types';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { toast } from '@/store/toast';

export function AgentActions({
  ticket,
  currentUserId,
  onUpdated,
}: {
  ticket: Ticket;
  currentUserId: string;
  onUpdated: (t: Ticket) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState(ticket.resolutionNote ?? '');
  const [confirmResolve, setConfirmResolve] = useState(false);

  const assignedToMe = ticket.assignedAgent?.id === currentUserId;
  const next = NEXT_STATUS[ticket.status];

  async function call(label: string, fn: () => Promise<{ data: { ticket: Ticket } }>) {
    setBusy(label);
    try {
      const res = await fn();
      onUpdated(res.data.ticket);
      toast.success(`${label} — done.`);
    } catch (err) {
      toast.error(errorMessage(err, `Could not ${label.toLowerCase()}`));
    } finally {
      setBusy(null);
    }
  }

  const assign = () =>
    call('Assign to me', () => api.post(`/tickets/${ticket.id}/assign`, {}));

  const advance = () => {
    if (!next) return;
    if (next === 'Resolved') {
      setConfirmResolve(true);
      return;
    }
    void call(`Move to ${next}`, () =>
      api.patch(`/tickets/${ticket.id}`, { status: next }),
    );
  };

  const resolve = async () => {
    const note = resolutionNote.trim();
    if (!note) {
      toast.error('Please add a resolution note before resolving this ticket.');
      return;
    }
    setBusy('Resolve');
    try {
      const res = await api.post(`/tickets/${ticket.id}/resolve`, { resolutionNote: note });
      onUpdated(res.data.ticket);
      setConfirmResolve(false);
      toast.success('Ticket resolved successfully.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not resolve ticket'));
    } finally {
      setBusy(null);
    }
  };

  const reopen = () =>
    call('Reopen ticket', () => api.post(`/tickets/${ticket.id}/reopen`, {}));

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold">Agent actions</p>

      <div className="mt-3 space-y-2">
        {!ticket.assignedAgent && (
          <Button
            size="sm"
            fullWidth
            onClick={assign}
            loading={busy === 'Assign to me'}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign to me
          </Button>
        )}

        {ticket.assignedAgent && !assignedToMe && (
          <p className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-muted">
            Assigned to {ticket.assignedAgent.name}. Only that agent (or an admin) can change
            it.
          </p>
        )}

        {ticket.status !== 'Resolved' && next && next !== 'Resolved' && (
          <Button
            size="sm"
            fullWidth
            variant="secondary"
            onClick={advance}
            loading={busy === `Move to ${next}`}
          >
            Move to {next}
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {ticket.status === 'In Progress' && (
          <div className="rounded-lg border border-line bg-surface-2 p-3">
            <label className="text-xs font-medium text-content">
              Resolution note <span className="text-danger">*</span>
            </label>
            <Textarea
              className="mt-1 min-h-[72px] bg-surface"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Summarize how the issue was resolved…"
            />
            <Button
              size="sm"
              fullWidth
              className="mt-2"
              onClick={() => setConfirmResolve(true)}
              disabled={!resolutionNote.trim()}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolve Ticket
            </Button>
          </div>
        )}

        {ticket.status === 'Resolved' && (
          <>
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs">
              <p className="font-medium text-emerald-500">Resolved</p>
              <p className="mt-1 text-muted">{ticket.resolutionNote}</p>
            </div>
            <Button
              size="sm"
              fullWidth
              variant="ghost"
              onClick={reopen}
              loading={busy === 'Reopen ticket'}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reopen ticket
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmResolve}
        onClose={() => setConfirmResolve(false)}
        onConfirm={resolve}
        loading={busy === 'Resolve'}
        title="Resolve this ticket?"
        body="The customer will be notified and the ticket will move to Resolved. You can reopen it later if needed."
        confirmLabel="Resolve ticket"
      />
    </div>
  );
}
