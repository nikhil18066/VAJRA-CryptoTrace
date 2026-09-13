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
  inputBg:        'rgba(255,255,255,0.05)',
  itemBg:         'rgba(255,255,255,0.04)',
  text:           '#ffffff',
  textSub:        'rgba(255,255,255,0.55)',
  textMuted:      'rgba(255,255,255,0.3)',
  border:         'rgba(255,255,255,0.08)',
  borderAccent:   'rgba(0,242,254,0.15)',
  tabActive:      'rgba(0,242,254,0.12)',
  skeletonBase:   '#0e1c38',
  skeletonShimmer:'#1a3060',
  rootShadow:     '0 0 60px rgba(0,242,254,0.06), 0 0 120px rgba(30,95,255,0.04)',
};

const LIGHT: ThemeColors = {
  mode: 'light',
  bg:             '#eef2f8',
  nav:            'linear-gradient(175deg, #ffffff, #eef2f8)',
  card:           '#ffffff',
  card2:          '#f4f7fc',
  inputBg:        'rgba(0,0,0,0.04)',
  itemBg:         'rgba(0,0,0,0.03)',
  text:           '#1a2035',
  textSub:        'rgba(26,32,53,0.6)',
  textMuted:      'rgba(26,32,53,0.38)',
  border:         'rgba(0,0,0,0.08)',
  borderAccent:   'rgba(30,95,255,0.14)',
  tabActive:      'rgba(30,95,255,0.08)',
  skeletonBase:   '#e8edf5',
  skeletonShimmer:'#d4dce9',
  rootShadow:     '0 0 40px rgba(30,95,255,0.08), 0 0 80px rgba(0,0,0,0.06)',
};

interface ThemeCtxValue {
  t: ThemeColors;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ t: DARK, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    try { return (localStorage.getItem('vajra-theme') as ThemeMode) ?? 'dark'; } catch { return 'dark'; }
  });

  const t = mode === 'dark' ? DARK : LIGHT;

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
