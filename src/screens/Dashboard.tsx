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

export default function Dashboard({
  onNavigate, onOpenCase, onOpenAI, onNewInvestigation, onOpenSearch, onOpenCrossCase, activeTab, showToast,
}: DashboardProps) {
  const { t } = useTheme();
  const [cases, setCases] = useState<CaseRecord[]>(caseStore.getAll());
  const [stats, setStats] = useState(caseStore.getStats());
  const [showNcrpModal, setShowNcrpModal] = useState(false);

  useEffect(() => {
    const unsub = caseStore.subscribe(() => {
      setCases([...caseStore.getAll()]);
      setStats(caseStore.getStats());
    });
    return unsub;
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ background: t.bg }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-5 pt-14 pb-5" style={{ background: t.nav }}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <VajraLogo className="w-8 h-8" />
            <div>
              <h1 className="text-[18px] font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                Dashboard
              </h1>
              <p className="text-[10px] text-white/35" style={{ color: t.textMuted }}>CryptoTrace Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNcrpModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-cyan-300 active:scale-95 bg-cyan-500/10 border border-cyan-500/30">
              <span>🇮🇳</span> NCRP 1930 Import
            </button>
            <button onClick={onNewInvestigation}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-white active:scale-95 bg-blue-600/30 border border-blue-500/40">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              New Case
            </button>
          </div>
        </div>

        {/* Search bar */}
        <button onClick={onOpenSearch}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-left"
                style={{ background: t.card2, border: `1px solid ${t.border}` }}>
          <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: t.textMuted }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-[13px] text-white/25" style={{ color: t.textMuted }}>Search cases, wallets, typologies, VASPs...</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono text-white/20" style={{ background: t.inputBg, color: t.textMuted }}>⌘K</span>
        </button>

        {/* Active investigations card */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
             style={{
               background: 'linear-gradient(135deg, #1e5fff 0%, #0033aa 100%)',
               boxShadow: '0 8px 32px rgba(30,95,255,0.35)',
             }}>
          <div className="absolute right-4 top-3 opacity-15">
            <svg width="90" height="90" viewBox="0 0 90 90">
              <circle cx="70" cy="20" r="38" fill="white" />
              <circle cx="15" cy="70" r="22" fill="white" />
            </svg>
          </div>
          <div className="absolute right-5 bottom-4"><Sparkline isDark={t.mode === 'dark'} /></div>

          <p className="text-[12px] text-blue-100/70 font-medium mb-1">Active Investigations</p>
          <div className="text-[46px] font-bold text-white leading-none mb-1.5" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {String(stats.activeCases).padStart(2, '0')}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] text-blue-200/70">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +{cases.length} on-chain tracked
            </div>
            <div className="h-3.5 w-px bg-white/20" />
            <span className="text-[11px] text-blue-200/60">Live Multi-Chain Nodes Active</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'none' }}>

        {/* Metrics 2×2 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: '6D High Risk Cases', value: String(stats.highRiskAlerts).padStart(2, '0'), iconBg: 'rgba(255,61,90,0.15)', iconColor: '#ff3d5a',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
            },
            { label: 'Wallets Clustered', value: String(stats.walletsAnalyzed), iconBg: 'rgba(0,242,254,0.12)', iconColor: '#00f2fe',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9" /></svg>,
            },
            { label: 'VASP Identified',  value: String(stats.vaspCount), iconBg: 'rgba(0,214,143,0.12)', iconColor: '#00d68f',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            },
            { label: 'Total Traced ₹',   value: '2.45 Cr', iconBg: 'rgba(212,175,55,0.12)', iconColor: '#d4af37',
              icon: <span className="text-[16px] font-bold">₹</span>,
            },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-4 flex items-center gap-3"
                 style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                   style={{ background: m.iconBg, color: m.iconColor }}>{m.icon}</div>
              <div>
                <div className="text-[9px] text-white/35 uppercase font-semibold tracking-wide" style={{ color: t.textMuted }}>{m.label}</div>
                <div className="text-[18px] font-bold text-white mt-0.5" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>{m.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions 3-grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'AI Copilot', color: '#4facfe', bg: 'rgba(30,95,255,0.1)',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" /></svg>,
              action: onOpenAI,
            },
            { label: 'Cross-Case Hub', color: '#d4af37', bg: 'rgba(212,175,55,0.1)',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
              action: onOpenCrossCase,
            },
            { label: 'New Trace', color: '#00d68f', bg: 'rgba(0,214,143,0.1)',
              icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
              action: onNewInvestigation,
            },
          ].map((qa) => (
            <button key={qa.label} onClick={qa.action}
                    className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all active:scale-95"
                    style={{ background: qa.bg, border: `1px solid ${qa.color}25`, color: qa.color }}>
              {qa.icon}
              <span className="text-[10px] font-semibold">{qa.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Investigations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[14px] font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
              Recent Forensic Investigations
            </h3>
            <span className="text-[11px] text-[#00f2fe] font-mono">{cases.length} Total</span>
          </div>
          <div className="space-y-2.5">
            {cases.map((c) => {
              const s = RISK_STYLES[c.riskKey] || RISK_STYLES.med;
              return (
                <button key={c.id} onClick={() => onOpenCase(c.id)}
                        className="w-full rounded-xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] text-left"
                        style={{ background: t.card, border: `1px solid ${t.border}` }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: s.dot }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-white font-mono" style={{ color: t.text }}>{c.id}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-white/30 truncate" style={{ color: t.textMuted }}>
                        {c.wallet ? `${c.wallet.slice(0, 6)}...${c.wallet.slice(-4)}` : '—'}
                      </span>
                      <span className="text-[9px] text-white/20" style={{ color: t.textMuted }}>•</span>
                      <span className="text-[10px] text-white/35 font-medium" style={{ color: t.textMuted }}>{c.chain}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>{c.riskLevel}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold font-mono" style={{ color: s.color }}>{c.riskScore}/100</span>
                      <span className="text-[9px] text-white/25" style={{ color: t.textMuted }}>{c.timeAgo || 'Recent'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showNcrpModal && (
        <NcrpBatchModal
          onClose={() => setShowNcrpModal(false)}
          onSelectCase={(wallet, chain, caseId) => {
            setShowNcrpModal(false);
            onOpenCase(caseId);
          }}
        />
      )}

      <BottomNav active={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
