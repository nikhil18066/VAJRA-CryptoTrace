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
  high: { bg: 'rgba(255,61,90,0.1)',  color: '#ff3d5a', dot: '#ff3d5a', label: 'High'   },
  med:  { bg: 'rgba(245,166,35,0.1)', color: '#f5a623', dot: '#f5a623', label: 'Medium' },
  low:  { bg: 'rgba(0,214,143,0.08)', color: '#00d68f', dot: '#00d68f', label: 'Low'    },
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
    <div className="flex flex-col h-full" style={{ background: t.bg }}>

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-14 pb-4"
           style={{ background: t.nav }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[22px] font-bold text-white"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>Alert Center</h1>
            <p className="text-[11px] text-white/40 mt-0.5" style={{ color: t.textMuted }}>
              {unread} unread · {alerts.length} live case signals
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-xl transition-all active:scale-95"
              style={{
                background: filter === f ? 'rgba(0,242,254,0.15)' : t.card2,
                color:      filter === f ? '#00f2fe' : t.textMuted,
                border:     `1px solid ${filter === f ? 'rgba(0,242,254,0.3)' : t.border}`,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {filtered.map((a) => {
          const s = SEVERITY_STYLES[a.severity];
          return (
            <button
              key={a.id}
              onClick={() => onOpenCase(a.case)}
              className="w-full rounded-2xl p-4 flex items-start gap-3 transition-all active:scale-[0.98] text-left"
              style={{
                background: a.read ? t.card : t.card2,
                border:     `1px solid ${a.read ? t.border : 'rgba(0,242,254,0.2)'}`,
              }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                   style={{ background: s.bg }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                        style={{ background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                  <span className="text-[10px] text-white/30 font-mono" style={{ color: t.textMuted }}>{a.time}</span>
                </div>
                <h3 className="text-[13px] font-semibold text-white mb-1" style={{ color: t.text }}>{a.title}</h3>
                <p className="text-[11px] text-white/50 leading-relaxed mb-2" style={{ color: t.textSub }}>{a.body}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#00f2fe] font-mono">{a.case}</span>
                  <span className="text-[11px] text-[#00f2fe] font-medium">Open Case →</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <BottomNav active={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
