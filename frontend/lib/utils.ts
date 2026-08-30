import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(value: string | Date | undefined | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  const table: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  let unitSeconds = 1;
  for (const [limit, unit] of table) {
    if (Math.abs(seconds) < limit) {
      const divisor = unitSeconds;
      return rtf.format(-Math.round(seconds / divisor), unit);
    }
    unitSeconds = limit;
  }
  return d.toLocaleDateString();
}

export function initials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Extracts a human-readable message from an axios-style error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err === 'object' && err !== null) {
    const anyErr = err as {
      response?: { data?: { error?: { message?: string; details?: { message?: string }[] } } };
      message?: string;
    };
    const apiErr = anyErr.response?.data?.error;
    if (apiErr?.details?.length && apiErr.details[0]?.message) {
      return apiErr.details[0].message;
    }
    if (apiErr?.message) return apiErr.message;
    if (anyErr.message) return anyErr.message;
  }
  return fallback;
}
