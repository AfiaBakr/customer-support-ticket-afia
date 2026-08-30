'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import type { Role } from '@/lib/types';

/**
 * Client-side route guard. Server-side authorization is still enforced by the
 * API — this only controls what the browser renders.
 */
export function useRequireAuth(allowed?: Role[]) {
  const router = useRouter();
  const { hydrated, token, user } = useAuth();

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace('/login');
      return;
    }
    if (allowed && user && !allowed.includes(user.role)) {
      router.replace('/dashboard');
    }
  }, [hydrated, token, user, allowed, router]);

  const ready = hydrated && !!token && (!allowed || !user || allowed.includes(user.role));
  return { ready, user };
}
