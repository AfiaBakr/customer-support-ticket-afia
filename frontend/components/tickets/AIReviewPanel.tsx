'use client';

import { useState } from 'react';
import { AlertTriangle, Check, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Field';
import { CATEGORIES, PRIORITIES } from '@/lib/constants';
import type { Category, Priority, Ticket } from '@/lib/types';
import { api } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { toast } from '@/store/toast';

export function AIReviewPanel({
  ticket,
  editable,
  onUpdated,
}: {
  ticket: Ticket;
  editable: boolean;
  onUpdated: (t: Ticket) => void;
}) {
  const [category, setCategory] = useState<Category>(ticket.category);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [summary, setSummary] = useState(ticket.aiSummary ?? '');
  const [saving, setSaving] = useState(false);
  const [retriaging, setRetriaging] = useState(false);

  const dirty =
    category !== ticket.category ||
    priority !== ticket.priority ||
    summary !== (ticket.aiSummary ?? '');

  async function save(markReviewed: boolean) {
    setSaving(true);
    try {
      const res = await api.patch(`/tickets/${ticket.id}`, {
        category,
        priority,
        aiSummary: summary || undefined,
        aiReviewed: markReviewed ? true : ticket.aiReviewed,
      });
      onUpdated(res.data.ticket);
      toast.success(markReviewed ? 'Triage saved & marked reviewed.' : 'Triage updated.');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save triage'));
    } finally {
      setSaving(false);
    }
  }

  async function retriage() {
    setRetriaging(true);
    try {
      const res = await api.post(`/tickets/${ticket.id}/triage`);
      const t: Ticket = res.data.ticket;
      onUpdated(t);
      setCategory(t.category);
      setPriority(t.priority);
      setSummary(t.aiSummary ?? '');
      toast.success('AI re-analyzed the ticket.');
    } catch (err) {
      toast.error(errorMessage(err, 'AI triage is temporarily unavailable'));
    } finally {
      setRetriaging(false);
    }
  }

  return (
    <div className="rounded-xl border border-gold/40 bg-gold/[0.04] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Sparkles className="h-4 w-4" />
          AI Triage Suggestion
        </div>
        {ticket.aiReviewed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500 ring-1 ring-inset ring-emerald-500/30">
            <Check className="h-3 w-3" /> Human reviewed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold ring-1 ring-inset ring-gold/40">
            <AlertTriangle className="h-3 w-3" /> Human review required
          </span>
        )}
      </div>

      {ticket.aiError && (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          AI triage was unavailable when this ticket was created. Classify it manually or
          re-run triage.
        </p>
      )}

      <dl className="mt-3 space-y-1 text-xs text-muted">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">AI category</dt>
          <dd className="text-content">{ticket.aiCategory ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">AI priority</dt>
          <dd className="text-content">{ticket.aiPriority ?? '—'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">AI summary</dt>
          <dd className="text-content">{ticket.aiSummary ?? '—'}</dd>
        </div>
      </dl>

      {editable ? (
        <div className="mt-4 space-y-3 border-t border-gold/20 pt-4">
          <p className="text-xs font-medium text-content">Final (human-reviewed) values</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted">
              Category
              <Select
                className="mt-1"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-xs text-muted">
              Priority
              <Select
                className="mt-1"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <label className="block text-xs text-muted">
            Summary
            <Textarea
              className="mt-1 min-h-[72px]"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Human-reviewed summary of the issue"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => save(true)} loading={saving}>
              <Check className="h-3.5 w-3.5" />
              {dirty ? 'Save & accept' : 'Accept suggestion'}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => save(false)}
              loading={saving}
              disabled={!dirty}
            >
              Save changes
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={retriage}
              loading={retriaging}
              title="Ask the AI to analyze the ticket again"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-run AI
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-gold/20 pt-3 text-xs text-muted">
          Final classification:{' '}
          <span className="text-content">
            {ticket.category} · {ticket.priority} priority
          </span>
        </p>
      )}
    </div>
  );
}
