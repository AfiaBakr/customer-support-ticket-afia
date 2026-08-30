'use client';

import { Check } from 'lucide-react';
import { STATUSES } from '@/lib/constants';
import type { Status } from '@/lib/types';
import { cn } from '@/lib/utils';

export function TicketTimeline({ status }: { status: Status }) {
  const currentIndex = STATUSES.indexOf(status);

  return (
    <ol className="flex items-center gap-1">
      {STATUSES.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <li key={s} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-1 ring-inset',
                  done && 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/40',
                  active && 'bg-gold/15 text-gold ring-gold/50',
                  !done && !active && 'bg-surface-2 text-muted ring-line',
                )}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-[10px] leading-none',
                  active ? 'text-content' : 'text-muted',
                )}
              >
                {s}
              </span>
            </div>
            {i < STATUSES.length - 1 && (
              <span
                className={cn(
                  'h-px flex-1',
                  i < currentIndex ? 'bg-emerald-500/40' : 'bg-line',
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
