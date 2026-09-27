import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { VajraLogo } from '../components/Graphics';
import { useTheme } from '../context/theme';
import { caseStore } from '../store/caseStore';
import type { CaseRecord } from '../store/caseStore';
import NcrpBatchModal from '../components/NcrpBatchModal';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';

interface DashboardProps {
  onNavigate: (tab: Tab) => void;
  onOpenCase: (caseId: string) => void;
  onOpenAI: () => void;
  onNewInvestigation: () => void;
  onOpenSearch: () => void;
  onOpenCrossCase: () => void;
  onStartAnalysis?: (wallet: string, chain: string, caseId: string) => void;
  activeTab: Tab;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error', sub?: string) => void;
}

const RISK_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  high: { bg: 'rgba(255,61,90,0.12)',  color: '#ff3d5a', dot: '#ff3d5a' },
  med:  { bg: 'rgba(245,166,35,0.12)', color: '#f5a623', dot: '#f5a623' },
  low:  { bg: 'rgba(0,214,143,0.12)',  color: '#00d68f', dot: '#00d68f' },
};

function Sparkline({ isDark }: { isDark: boolean }) {
  const pts = [22,30,28,40,36,48,42,55,46,60,52,65];
  const w = 80; const h = 28;
  const max = Math.max(...pts); const min = Math.min(...pts);
  const coords = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - ((v - min) / (max - min)) * h}`);
  const lineColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(26,32,53,0.4)';
  const fillColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(26,32,53,0.05)';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-80">
      <polyline points={coords.join(' ')} fill="none" stroke={lineColor}
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${coords.join(' ')} ${w},${h}`} fill={fillColor} stroke="none" />
    </svg>
  );
}

function formatRelativeTime(isoDate?: string, fallback = 'Just now'): string {
  if (!isoDate) return fallback;
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return fallback;
  }
}

export default function Dashboard({
  onNavigate, onOpenCase, onOpenAI, onNewInvestigation, onOpenSearch, onOpenCrossCase, activeTab,
}: DashboardProps) {
  const { t } = useTheme();
  const [cases, setCases] = useState<CaseRecord[]>(() => caseStore.getAll());
  const [stats, setStats] = useState(() => caseStore.getStats());
  const [showNcrpModal, setShowNcrpModal] = useState(false);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    // Initial fetch
    setCases([...caseStore.getAll()]);
    setStats(caseStore.getStats());

    // Instant subscriber whenever any case is scanned, imported, or updated
    const unsub = caseStore.subscribe(() => {
      setCases([...caseStore.getAll()]);
      setStats(caseStore.getStats());
    });

    // 3-second heartbeat to keep live time ("Just now", "2m ago") ticking continuously in real-time
    const interval = setInterval(() => {
      setCases([...caseStore.getAll()]);
      setStats(caseStore.getStats());
      setTicker((prev) => prev + 1);
    }, 3000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-12 md:pt-6 pb-8 space-y-6">

          {/* Top Banner / Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <VajraLogo className="w-9 h-9 md:w-10 md:h-10" />
              <div>
                <h1 className="text-[20px] md:text-[24px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  Forensic Intelligence Dashboard
                </h1>
                <p className="text-[11px] md:text-[12px] text-white/40" style={{ color: t.textMuted }}>
                  Multi-Chain Asset Tracing & Typology Classification Network
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowNcrpModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[12px] font-bold active:scale-95 transition-all shadow-sm"
                style={{
                  background: t.mode === 'light' ? 'rgba(30,95,255,0.08)' : 'rgba(0,242,254,0.1)',
                  color: t.mode === 'light' ? '#1e5fff' : '#00f2fe',
                  border: `1px solid ${t.mode === 'light' ? 'rgba(30,95,255,0.25)' : 'rgba(0,242,254,0.3)'}`,
                }}
              >
                <span>🇮🇳</span> NCRP 1930 Batch Import
              </button>
              <button
                onClick={onNewInvestigation}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white active:scale-95 bg-blue-600 hover:bg-blue-500 border border-blue-500/40 transition-all shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Case Registration
              </button>
            </div>
          </div>

          {/* Search bar (Visible on mobile, fast trigger on desktop) */}
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all hover:border-cyan-500/40"
            style={{ background: t.card2, border: `1px solid ${t.border}` }}
          >
            <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: t.textMuted }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[13px] text-white/35" style={{ color: t.textMuted }}>
              Search cases, target wallets, typologies, VASPs, or transaction hashes...
            </span>
            <span className="ml-auto text-[11px] px-2 py-0.5 rounded font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20">
              ⌘K / Ctrl+K
            </span>
          </button>

          {/* ── Hero & Forensic Metrics Responsive Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Active investigations hero card */}
            <div
              className="lg:col-span-5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #1e5fff 0%, #0033aa 100%)',
                boxShadow: '0 8px 32px rgba(30,95,255,0.35)',
              }}
            >
              <div className="absolute right-4 top-3 opacity-15">
                <svg width="120" height="120" viewBox="0 0 90 90">
                  <circle cx="70" cy="20" r="38" fill="white" />
                  <circle cx="15" cy="70" r="22" fill="white" />
                </svg>
              </div>
              <div className="absolute right-6 bottom-5"><Sparkline isDark={t.mode === 'dark'} /></div>

              <div>
                <p className="text-[12px] text-blue-100/80 font-semibold tracking-wider uppercase mb-1">
                  Active Forensic Inquiries
                </p>
                <div className="text-[52px] font-bold text-white leading-none mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  {String(stats.activeCases).padStart(2, '0')}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-white/15">
                <div className="flex items-center gap-1 text-[12px] font-medium text-blue-100">
                  <svg className="w-3.5 h-3.5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  +{cases.length} on-chain tracked
                </div>
                <div className="h-3.5 w-px bg-white/20" />
                <span className="text-[11px] text-blue-200/80 font-mono">
                  Live Multi-Chain RPCs
                </span>
              </div>
            </div>

            {/* Metrics 4-Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {[
                {
                  label: '6D High Risk Cases',
                  value: String(stats.highRiskAlerts).padStart(2, '0'),
                  iconBg: 'rgba(255,61,90,0.15)',
                  iconColor: '#ff3d5a',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ),
                },
                {
                  label: 'Wallets Clustered',
                  value: String(stats.walletsAnalyzed),
                  iconBg: 'rgba(0,242,254,0.12)',
                  iconColor: '#00f2fe',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9" />
                    </svg>
                  ),
                },
                {
                  label: 'VASP Identified',
                  value: String(stats.vaspCount),
                  iconBg: 'rgba(0,214,143,0.12)',
                  iconColor: '#00d68f',
                  icon: (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  label: 'Total Traced ₹',
                  value: stats.totalTracedINR || '₹2.45 Cr',
                  iconBg: 'rgba(212,175,55,0.12)',
                  iconColor: '#d4af37',
                  icon: <span className="text-[16px] font-bold">₹</span>,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded-2xl p-4 flex flex-col justify-between transition-all hover:scale-[1.01]"
                  style={{ background: t.card, border: `1px solid ${t.border}` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 flex-shrink-0"
                    style={{ background: m.iconBg, color: m.iconColor }}
                  >
                    {m.icon}
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wide" style={{ color: t.textMuted }}>
                      {m.label}
                    </div>
                    <div
                      className="text-[22px] font-bold text-white mt-0.5"
                      style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}
                    >
                      {m.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions 3-grid */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              {
                label: 'AI Copilot',
                color: '#4facfe',
                bg: 'rgba(30,95,255,0.1)',
                desc: 'Ask forensic queries & hypotheses',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                  </svg>
                ),
                action: onOpenAI,
              },
              {
                label: 'Cross-Case Hub',
                color: '#d4af37',
                bg: 'rgba(212,175,55,0.1)',
                desc: 'Discover multi-case wallet linkages',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                action: onOpenCrossCase,
              },
              {
                label: 'New Trace',
                color: '#00d68f',
                bg: 'rgba(0,214,143,0.1)',
                desc: 'Ingest suspect address or QR',
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
                action: onNewInvestigation,
              },
            ].map((qa) => (
              <button
                key={qa.label}
                onClick={qa.action}
                className="flex flex-col items-center sm:items-start p-4 md:p-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-left"
                style={{ background: qa.bg, border: `1px solid ${qa.color}25`, color: qa.color }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${qa.color}18` }}>
                  {qa.icon}
                </div>
                <span className="text-[13px] md:text-[14px] font-bold tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  {qa.label}
                </span>
                <span className="hidden sm:block text-[11px] text-white/50 mt-0.5" style={{ color: t.textMuted }}>
                  {qa.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Recent Investigations Responsive Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[16px] md:text-[18px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  Recent Forensic Investigations
                </h3>
                <p className="text-[11px] text-white/40" style={{ color: t.textMuted }}>
                  Active case dockets and real-time on-chain risk assessments
                </p>
              </div>
              <span className="text-[12px] text-[#00f2fe] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 font-bold">
                {cases.length} Total Dockets
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {cases.map((c) => {
                const s = RISK_STYLES[c.riskKey] || RISK_STYLES.med;
                const relTime = formatRelativeTime(c.createdAt, c.timeAgo || 'Recent');
                const isJustNow = relTime === 'Just now' || relTime.endsWith('s ago');
                return (
                  <button
                    key={c.id}
                    onClick={() => onOpenCase(c.id)}
                    className="w-full rounded-2xl p-4 flex items-center gap-3.5 transition-all hover:scale-[1.01] active:scale-[0.98] text-left group relative overflow-hidden"
                    style={{ background: t.card, border: `1px solid ${isJustNow ? (t.mode === 'light' ? 'rgba(2,132,199,0.4)' : 'rgba(0,242,254,0.4)') : t.border}` }}
                  >
                    {isJustNow && (
                      <div className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase tracking-wider bg-cyan-500 text-black font-mono animate-pulse">
                        LIVE
                      </div>
                    )}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: s.dot }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-white font-mono group-hover:text-[#00f2fe] transition-colors" style={{ color: t.text }}>
                        {c.id}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-white/40 truncate" style={{ color: t.textMuted }}>
                          {c.wallet ? `${c.wallet.slice(0, 6)}...${c.wallet.slice(-4)}` : '—'}
                        </span>
                        <span className="text-[9px]" style={{ color: t.textMuted }}>•</span>
                        <span className="text-[11px] font-medium" style={{ color: t.mode === 'light' ? '#1e5fff' : '#00f2fe' }}>
                          {c.chain}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background: s.bg, color: s.color }}>
                        {c.riskLevel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold font-mono" style={{ color: s.color }}>
                          {c.riskScore}/100
                        </span>
                        <span className="text-[10px] text-white/30" style={{ color: isJustNow ? (t.mode === 'light' ? '#0284c7' : '#00f2fe') : t.textMuted }}>
                          {relTime}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showNcrpModal && (
        <NcrpBatchModal
          onClose={() => setShowNcrpModal(false)}
          onSelectCase={(_wallet, _chain, caseId) => {
            setShowNcrpModal(false);
            onOpenCase(caseId);
          }}
        />
      )}

      <BottomNav active={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
