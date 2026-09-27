import { useState } from 'react';
import { useTheme } from '../context/theme';
import { VajraLogo } from './Graphics';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';

interface DesktopNavProps {
  activeTab: Tab;
  currentScreen: string;
  onNavigate: (tab: Tab) => void;
  onOpenScreen: (screen: string) => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  caseId?: string;
  alertCount?: number;
}

export default function DesktopNav({
  activeTab,
  currentScreen,
  onNavigate,
  onOpenScreen,
  onOpenSearch,
  onLogout,
  caseId,
  alertCount = 3,
}: DesktopNavProps) {
  const { t, toggle } = useTheme();
  const isDark = t.mode === 'dark';

  const [uiScale, setUiScale] = useState<string>(() => {
    try {
      return localStorage.getItem('vajra-ui-scale') || '85';
    } catch {
      return '85';
    }
  });

  const cycleUiScale = () => {
    // Cycle between 80 -> 85 -> 100 -> 80
    const nextScale = uiScale === '85' ? '80' : uiScale === '80' ? '100' : '85';
    setUiScale(nextScale);
    try {
      localStorage.setItem('vajra-ui-scale', nextScale);
    } catch {}
    document.documentElement.setAttribute('data-ui-scale', nextScale);
  };

  const navLinks: { id: Tab | 'CROSS_CASE' | 'AI_INVESTIGATOR'; label: string; icon: string; badge?: string }[] = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: '⚡' },
    { id: 'INVESTIGATE', label: 'Investigate', icon: '🔍' },
    { id: 'ALERTS', label: 'Alerts', icon: '🚨', badge: alertCount > 0 ? String(alertCount) : undefined },
    { id: 'CROSS_CASE', label: 'Cross-Case Hub', icon: '🌐' },
    { id: 'AI_INVESTIGATOR', label: 'AI Copilot', icon: '🤖', badge: 'PRO' },
    { id: 'PROFILE', label: 'Profile', icon: '👤' },
  ];

  const handleNavClick = (id: Tab | 'CROSS_CASE' | 'AI_INVESTIGATOR') => {
    if (id === 'CROSS_CASE' || id === 'AI_INVESTIGATOR') {
      onOpenScreen(id);
    } else {
      onNavigate(id);
    }
  };

  return (
    <header
      className="hidden md:flex items-center justify-between px-6 py-3 border-b flex-shrink-0 z-30 transition-colors duration-200"
      style={{ background: t.nav, borderColor: t.border }}
    >
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('DASHBOARD')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <VajraLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-[17px] font-bold tracking-wider"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}
              >
                VAJRA <span className="text-[#00f2fe]">CRYPTOTRACE</span>
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
                LEA v1.0
              </span>
            </div>
            <p className="text-[10px] text-white/40" style={{ color: t.textMuted }}>
              Cyber Forensics Command Center
            </p>
          </div>
        </button>

        {/* Live Multi-Chain Node Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Multi-Chain RPCs Live
        </div>
      </div>

      {/* Center: Global Navigation Tabs */}
      <nav className="flex items-center gap-1.5">
        {navLinks.map((tab) => {
          const isSelected =
            currentScreen === tab.id ||
            (tab.id === activeTab &&
              !['CROSS_CASE', 'AI_INVESTIGATOR', 'CASE_DETAIL', 'EVIDENCE_BUNDLE'].includes(currentScreen));

          return (
            <button
              key={tab.id}
              onClick={() => handleNavClick(tab.id)}
              className="relative px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 flex items-center gap-1.5 active:scale-95"
              style={{
                background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
                color: isSelected ? '#00f2fe' : t.textSub,
                border: isSelected ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid transparent',
              }}
            >
              <span>{tab.icon}</span>
              <span style={{ fontFamily: isSelected ? "'Rajdhani', sans-serif" : undefined, fontWeight: isSelected ? 700 : 500 }}>
                {tab.label}
              </span>
              {tab.badge && (
                <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#ff3d5a] text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Quick Search, Active Case, Theme & Profile/Logout */}
      <div className="flex items-center gap-3">
        {/* ⌘K Quick Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[12px] transition-all duration-150 active:scale-95 hover:border-cyan-500/40"
          style={{
            background: t.card2,
            border: `1px solid ${t.border}`,
            color: t.textMuted,
          }}
          title="Search anything (Cmd+K / Ctrl+K)"
        >
          <svg className="w-4 h-4 text-[#00f2fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="hidden xl:inline">Search cases, wallets...</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-cyan-300">
            ⌘K
          </span>
        </button>

        {/* Active Case Jump Badge (if viewing or investigating a case) */}
        {caseId && (
          <button
            onClick={() => onOpenScreen('CASE_DETAIL')}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-all"
            title="Jump to Active Case"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>{caseId}</span>
          </button>
        )}

        {/* UI Density / Zoom Scale Controller */}
        <button
          onClick={cycleUiScale}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all active:scale-95"
          style={{
            background: t.card2,
            border: `1px solid ${t.border}`,
            color: t.mode === 'light' ? '#0284c7' : '#00f2fe',
          }}
          title={`Desktop Density Scale: ${uiScale}% (Click to toggle 80% / 85% / 100%)`}
        >
          <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span>{uiScale}%</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center text-sm"
          style={{ background: t.card2, border: `1px solid ${t.border}`, color: t.text }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? '🌙' : '☀️'}
        </button>

        {/* Officer User Pill & Logout */}
        <div
          className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl"
          style={{ background: t.card, border: `1px solid ${t.border}` }}
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center font-mono">
            RS
          </div>
          <div className="hidden lg:block text-left pr-2">
            <p className="text-[11px] font-bold leading-tight" style={{ color: t.text }}>
              Rohit Sharma
            </p>
            <p className="text-[9px] text-white/40 leading-tight" style={{ color: t.textMuted }}>
              Unit 23 · LEA
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors"
            title="Secure Logout"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
