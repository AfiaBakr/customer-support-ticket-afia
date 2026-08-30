'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden border-r border-line bg-surface/40 lg:block">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-strong to-gold-soft text-black">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-semibold">
              Support<span className="text-gradient-gold">Flow</span>
            </span>
          </Link>
          <div>
            <h2 className="text-3xl font-bold leading-snug">
              AI-Powered Support.
              <br />
              <span className="text-gradient-gold">Human-Driven Resolution.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm text-muted">
              Triage every ticket in seconds, keep the conversation real-time, and resolve
              with an auditable note.
            </p>
          </div>
          <p className="text-xs text-muted">
            Demo · customer@supportflow.demo / agent@supportflow.demo · Passw0rd!
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-strong to-gold-soft text-black">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="font-semibold">
              Support<span className="text-gradient-gold">Flow</span>
            </span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
