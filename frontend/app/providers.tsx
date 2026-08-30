'use client';

import { useEffect } from 'react';
import { Toaster } from '@/components/ui/Toaster';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

/**
 * Validates a persisted token on first load and keeps the cached user fresh.
 */
function AuthBootstrap() {
  const { token, hydrated, setUser, logout } = useAuth();

  useEffect(() => {
    if (!hydrated || !token) return;
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.user);
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, setUser, logout]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthBootstrap />
      {children}
      <Toaster />
    </>
  );
}
