'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/store/auth';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#about', label: 'About' },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={
        'sticky top-0 z-40 border-b transition-colors ' +
        (scrolled
          ? 'border-line bg-bg/80 backdrop-blur-md'
          : 'border-transparent bg-transparent')
      }
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-strong to-gold-soft text-black">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Support<span className="text-gradient-gold">Flow</span>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link href="/" className="text-sm text-muted hover:text-content">
            Home
          </Link>
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted hover:text-content">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {token ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-content">
                Login
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link href="/" onClick={() => setOpen(false)} className="text-sm text-muted">
              Home
            </Link>
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2">
              {token ? (
                <Link href="/dashboard" className="flex-1">
                  <Button size="sm" fullWidth>
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button size="sm" variant="secondary" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button size="sm" fullWidth>
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
