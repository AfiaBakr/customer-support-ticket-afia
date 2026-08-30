'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatsCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-surface p-4 shadow-card',
        accent ? 'border-gold/40' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        <Icon className={cn('h-4 w-4', accent ? 'text-gold' : 'text-muted')} />
      </div>
      {loading ? (
        <div className="skeleton mt-2 h-8 w-12 rounded" />
      ) : (
        <p
          className={cn(
            'mt-1 text-2xl font-semibold tabular-nums',
            accent && 'text-gradient-gold',
          )}
        >
          {value}
        </p>
      )}
    </div>
  );
}
