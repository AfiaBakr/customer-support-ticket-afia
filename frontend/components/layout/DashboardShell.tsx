'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Sparkles,
  Ticket as TicketIcon,
  X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Avatar } from '@/components/ui/primitives';
import { closeSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';
import { useAuth } from '@/store/auth';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/tickets', label: 'Tickets', icon: TicketIcon, exact: false },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  function onLogout() {
    logout();
    closeSocket();
    router.replace('/login');
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
            isActive(item.href, item.exact)
              ? 'bg-gold/10 font-medium text-gold'
              : 'text-muted hover:bg-surface-2 hover:text-content',
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
      {user?.role === 'customer' && (
        <Link
          href="/dashboard/tickets/new"
          onClick={() => setOpen(false)}
          className="mt-2 flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-strong via-gold to-gold-soft px-3 py-2 text-sm font-semibold text-black"
        >
          <PlusCircle className="h-4 w-4" />
          New Ticket
        </Link>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6">
        <button
          className="rounded-lg border border-line p-1.5 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-gold-strong to-gold-soft text-black">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">
            Support<span className="text-gradient-gold">Flow</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <Avatar name={user?.name} />
            <div className="leading-tight">
              <p className="text-xs font-medium text-content">{user?.name}</p>
              <p className="text-[11px] capitalize text-muted">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-muted hover:text-danger"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 border-r border-line p-4 lg:block">
          {nav}
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="absolute left-0 top-0 h-full w-64 border-r border-line bg-surface p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {nav}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
