'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '@/components/ui/primitives';
import type { SlimTicket, Ticket } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

type Row = Ticket | SlimTicket;

export function TicketList({
  tickets,
  showCustomer,
}: {
  tickets: Row[];
  showCustomer?: boolean;
}) {
  return (
    <>
      {/* Mobile: cards */}
      <ul className="space-y-3 md:hidden">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/dashboard/tickets/${t.id}`}
              className="block rounded-xl border border-line bg-surface p-4 transition hover:border-gold/40"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-gold">{t.ticketNumber}</span>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium text-content">{t.subject}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <PriorityBadge priority={t.priority} />
                <span className="rounded-full bg-surface-2 px-2 py-0.5 ring-1 ring-inset ring-line">
                  {t.category}
                </span>
                {'aiReviewed' in t && !t.aiReviewed && t.aiSummary && (
                  <span className="inline-flex items-center gap-1 text-gold">
                    <Sparkles className="h-3 w-3" /> AI review
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>
                  {showCustomer && t.customer ? t.customer.name : t.assignedAgent?.name ?? 'Unassigned'}
                </span>
                <span>{timeAgo(t.updatedAt)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-xl border border-line md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              {showCustomer && <th className="px-4 py-3 font-medium">Customer</th>}
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {tickets.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer transition hover:bg-surface-2"
                onClick={() => {
                  window.location.href = `/dashboard/tickets/${t.id}`;
                }}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/dashboard/tickets/${t.id}`}
                    className="font-mono text-xs text-gold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t.ticketNumber}
                  </Link>
                </td>
                <td className="max-w-[280px] px-4 py-3">
                  <span className="line-clamp-1 text-content">{t.subject}</span>
                  {'aiReviewed' in t && !t.aiReviewed && t.aiSummary && (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gold">
                      <Sparkles className="h-3 w-3" /> AI suggestion pending review
                    </span>
                  )}
                </td>
                {showCustomer && (
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {t.customer?.name ?? '—'}
                  </td>
                )}
                <td className="whitespace-nowrap px-4 py-3 text-muted">{t.category}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={t.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                  {timeAgo(t.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
