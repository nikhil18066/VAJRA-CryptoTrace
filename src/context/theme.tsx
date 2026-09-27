import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  mode: ThemeMode;
  // Backgrounds
  bg: string;
  nav: string;
  card: string;
  card2: string;
  inputBg: string;
  itemBg: string;
  // Text
  text: string;
  textSub: string;
  textMuted: string;
  // Borders
  border: string;
  borderAccent: string;
  // Misc
  tabActive: string;
  skeletonBase: string;
  skeletonShimmer: string;
  rootShadow: string;
}

const DARK: ThemeColors = {
  mode: 'dark',
  bg:             '#07101f',
  nav:            'linear-gradient(175deg, #0e1c38, #07101f)',
  card:           '#0e1c38',
  card2:          '#112044',
  inputBg:        'rgba(255,255,255,0.06)',
  itemBg:         'rgba(255,255,255,0.04)',
  text:           '#ffffff',
  textSub:        'rgba(255,255,255,0.68)',
  textMuted:      'rgba(255,255,255,0.45)',
  border:         'rgba(255,255,255,0.09)',
  borderAccent:   'rgba(0,242,254,0.18)',
  tabActive:      'rgba(0,242,254,0.12)',
  skeletonBase:   '#0e1c38',
  skeletonShimmer:'#1a3060',
  rootShadow:     '0 0 60px rgba(0,242,254,0.06), 0 0 120px rgba(30,95,255,0.04)',
};

const LIGHT: ThemeColors = {
  mode: 'light',
  bg:             '#f1f5f9',
  nav:            '#ffffff',
  card:           '#ffffff',
  card2:          '#f8fafc',
  inputBg:        '#ffffff',
  itemBg:         '#f1f5f9',
  text:           '#0f172a',
  textSub:        '#334155',
  textMuted:      '#64748b',
  border:         '#e2e8f0',
  borderAccent:   'rgba(29, 78, 216, 0.28)',
  tabActive:      'rgba(29, 78, 216, 0.12)',
  skeletonBase:   '#e2e8f0',
  skeletonShimmer:'#cbd5e1',
  rootShadow:     '0 4px 20px rgba(0,0,0,0.06)',
};

interface ThemeCtxValue {
  t: ThemeColors;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ t: LIGHT, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('vajra-theme') as ThemeMode | null;
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  const t = mode === 'light' ? LIGHT : DARK;

  const toggle = () => {
    setMode((m) => {
      const next = m === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('vajra-theme', next); } catch {}
      return next;
    });
  };

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) root.setAttribute('data-theme', mode);
  }, [mode]);

  return <ThemeCtx.Provider value={{ t, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): ThemeCtxValue {
  return useContext(ThemeCtx);
}
