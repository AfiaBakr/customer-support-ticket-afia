'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface WrapProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (id: string) => React.ReactNode;
}

export function Field({ label, error, hint, required, children }: WrapProps) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-content">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const base =
  'w-full rounded-lg bg-surface-2 border border-line px-3 py-2 text-sm text-content placeholder:text-muted/70 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(base, 'min-h-[120px] resize-y', className)} {...props} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(base, 'appearance-none pr-8', className)} {...props}>
      {children}
    </select>
  );
});
