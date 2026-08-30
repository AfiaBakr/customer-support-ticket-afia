'use client';

import { Sparkles } from 'lucide-react';

/** A hand-built illustration of the SupportFlow agent workspace (no stock art). */
export function DashboardMockup() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gold/10 blur-2xl" aria-hidden />
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex items-center gap-2 border-b border-line bg-surface-2 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs text-muted">SupportFlow · Agent Workspace</span>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-3">
          {[
            { k: 'Assigned', v: '18' },
            { k: 'In Progress', v: '7' },
            { k: 'High Priority', v: '3' },
          ].map((s) => (
            <div key={s.k} className="rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-xs text-muted">{s.k}</p>
              <p className="mt-1 text-2xl font-semibold text-gradient-gold">{s.v}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 px-4 pb-4">
          <div className="rounded-xl border border-gold/40 bg-gold/5 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              AI Triage Suggestion · Human Review Required
            </div>
            <p className="mt-2 text-sm text-content">
              <span className="font-mono text-xs text-gold">SF-2026-000042</span> · Charged
              twice for my order
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-surface px-2 py-0.5 ring-1 ring-inset ring-line">
                Category: Billing
              </span>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-500 ring-1 ring-inset ring-red-500/30">
                Priority: High
              </span>
            </div>
            <p className="mt-2 text-xs text-muted">
              “Possible duplicate payment reported by customer.”
            </p>
          </div>

          {[
            ['SF-2026-000041', 'Refund not received', 'In Progress'],
            ['SF-2026-000039', 'Cannot log in after reset', 'Assigned'],
          ].map(([id, subject, status]) => (
            <div
              key={id}
              className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs"
            >
              <span className="text-content">
                <span className="font-mono text-gold">{id}</span> · {subject}
              </span>
              <span className="rounded-full bg-surface px-2 py-0.5 text-muted ring-1 ring-inset ring-line">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
