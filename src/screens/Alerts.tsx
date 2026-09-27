import { useState, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../context/theme';
import { caseStore } from '../store/caseStore';
import type { CaseRecord } from '../store/caseStore';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';
type Filter = 'All' | 'High' | 'Medium' | 'Low';

interface AlertsProps {
  onNavigate: (tab: Tab) => void;
  onOpenCase: (caseId: string) => void;
  activeTab: Tab;
  showToast?: (msg: string, type?: any, sub?: string) => void;
}

interface AlertItem {
  id: string;
  severity: 'high' | 'med' | 'low';
  title: string;
  body: string;
  case: string;
  time: string;
  read: boolean;
}

const SEVERITY_STYLES: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  high: { bg: 'rgba(255,61,90,0.1)',  color: '#ff3d5a', dot: '#ff3d5a', label: 'High Risk' },
  med:  { bg: 'rgba(245,166,35,0.1)', color: '#f5a623', dot: '#f5a623', label: 'Medium Risk' },
  low:  { bg: 'rgba(0,214,143,0.08)', color: '#00d68f', dot: '#00d68f', label: 'Low Risk' },
};

const FILTERS: Filter[] = ['All', 'High', 'Medium', 'Low'];

export default function Alerts({ onNavigate, onOpenCase, activeTab }: AlertsProps) {
  const { t } = useTheme();
  const [filter, setFilter] = useState<Filter>('All');
  const [cases, setCases] = useState<CaseRecord[]>(caseStore.getAll());

  useEffect(() => {
    const unsub = caseStore.subscribe(() => {
      setCases([...caseStore.getAll()]);
    });
    return unsub;
  }, []);

  const alerts: AlertItem[] = cases.map((c, i) => {
    const isHigh = c.riskScore >= 75;
    const isMed = c.riskScore >= 45 && c.riskScore < 75;
    const sev: AlertItem['severity'] = isHigh ? 'high' : isMed ? 'med' : 'low';

    return {
      id: `ALT-${String(i + 1).padStart(3, '0')}`,
      severity: sev,
      title: isHigh ? 'High Risk Threat Detected' : isMed ? 'Structuring Activity Identified' : 'Standard Baseline Verification',
      body: `Case ${c.id}: Wallet ${c.wallet ? c.wallet.slice(0, 8) + '...' : 'Target'} triggered ${c.typology} on ${c.chain}. Calculated score: ${c.riskScore}/100.`,
      case: c.id,
      time: c.timeAgo || 'Recent',
      read: i > 1,
    };
  });

  const filtered = alerts.filter((a) => {
    if (filter === 'All')    return true;
    if (filter === 'High')   return a.severity === 'high';
    if (filter === 'Medium') return a.severity === 'med';
    if (filter === 'Low')    return a.severity === 'low';
    return true;
  });

  const unread = alerts.filter((a) => !a.read).length;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-12 md:pt-6 pb-28 md:pb-16 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-[20px] md:text-[24px] font-bold text-white tracking-wide"
                  style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                Forensic Alert Center & Signal Feeds
              </h1>
              <p className="text-[11px] md:text-[12px] text-white/40 mt-0.5" style={{ color: t.textMuted }}>
                {unread} unread notifications · {alerts.length} live case signals active
              </p>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-[12px] font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm"
                  style={{
                    background: filter === f
                      ? (t.mode === 'light' ? 'rgba(29, 78, 216, 0.12)' : 'rgba(0, 242, 254, 0.15)')
                      : t.card2,
                    color: filter === f
                      ? (t.mode === 'light' ? '#1d4ed8' : '#00f2fe')
                      : t.textMuted,
                    border: `1px solid ${
                      filter === f
                        ? (t.mode === 'light' ? 'rgba(29, 78, 216, 0.35)' : 'rgba(0, 242, 254, 0.3)')
                        : t.border
                    }`,
                  }}
                >
                  {f} {f === 'All' ? `(${alerts.length})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Alerts Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a) => {
              const s = SEVERITY_STYLES[a.severity];
              return (
                <button
                  key={a.id}
                  onClick={() => onOpenCase(a.case)}
                  className="w-full rounded-2xl p-5 flex items-start gap-3.5 transition-all hover:scale-[1.01] active:scale-[0.98] text-left group"
                  style={{
                    background: a.read ? t.card : t.card2,
                    border: `1px solid ${
                      a.read
                        ? t.border
                        : (t.mode === 'light' ? 'rgba(29, 78, 216, 0.35)' : 'rgba(0, 242, 254, 0.25)')
                    }`,
                  }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                       style={{ background: s.bg }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: t.textMuted }}>{a.time}</span>
                    </div>
                    <h3 className="text-[14px] font-bold mb-1 transition-colors" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                      {a.title}
                    </h3>
                    <p className="text-[12px] leading-relaxed mb-3" style={{ color: t.textSub }}>{a.body}</p>
                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: t.border }}>
                      <span className="text-[11px] font-mono font-bold" style={{ color: t.mode === 'light' ? '#1d4ed8' : '#00f2fe' }}>{a.case}</span>
                      <span className="text-[11px] font-semibold group-hover:translate-x-1 transition-transform" style={{ color: t.mode === 'light' ? '#1d4ed8' : '#00f2fe' }}>
                        Open Case →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
