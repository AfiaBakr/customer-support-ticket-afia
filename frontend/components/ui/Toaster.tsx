'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { cn } from '@/lib/utils';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'border-emerald-500/40 text-emerald-500',
  error: 'border-danger/40 text-danger',
  info: 'border-gold/40 text-gold',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
      {toasts.map((t) => {
        const Icon = icons[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-lg border bg-surface px-4 py-3 text-sm shadow-card',
              styles[t.kind],
            )}
            role="status"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="flex-1 text-content">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-muted hover:text-content"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
