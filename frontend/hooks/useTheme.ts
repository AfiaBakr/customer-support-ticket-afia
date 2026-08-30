'use client';

import { useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem('supportflow.theme') as Theme | null) ?? null;
    const system: Theme = window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
    const initial = stored ?? system;
    setThemeState(initial);
    apply(initial);
    setReady(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    apply(next);
    localStorage.setItem('supportflow.theme', next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      apply(next);
      localStorage.setItem('supportflow.theme', next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle, ready };
}
