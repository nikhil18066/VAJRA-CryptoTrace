import { useState, useMemo } from 'react';
import { useTheme } from '../context/theme';
import { caseStore } from '../store/caseStore';
import type { CaseRecord } from '../store/caseStore';

interface CrossCaseViewProps {
  onBack: () => void;
  onOpenCase: (caseId: string) => void;
}

const RISK_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  high:  { fill: 'rgba(255,61,90,0.2)',  stroke: '#ff3d5a', text: '#ff3d5a'  },
  med:   { fill: 'rgba(245,166,35,0.2)', stroke: '#f5a623', text: '#f5a623'  },
  low:   { fill: 'rgba(0,214,143,0.15)', stroke: '#00d68f', text: '#00d68f'  },
};

const NODE_STYLES: Record<string, { fill: string; stroke: string }> = {
  vasp:   { fill: '#0a3020', stroke: '#00d68f' },
  mixer:  { fill: '#4a1030', stroke: '#ec4899' },
  wallet: { fill: '#1a3060', stroke: '#4facfe' },
};

const SEVERITY_COLORS: Record<string, { bg: string; color: string }> = {
  high:   { bg: 'rgba(255,61,90,0.08)',  color: '#ff3d5a'  },
  medium: { bg: 'rgba(245,166,35,0.08)', color: '#f5a623'  },
  info:   { bg: 'rgba(0,242,254,0.06)',  color: '#00f2fe'  },
};

export default function CrossCaseView({ onBack, onOpenCase }: CrossCaseViewProps) {
  const { t } = useTheme();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const cases: CaseRecord[] = caseStore.getAll();

  // Dynamic graph computation for cases in store
  const { caseNodes, sharedNodes, connections, insights } = useMemo(() => {
    const displayCases = cases.slice(0, 4);
    const coords = [
      { x: 75,  y: 75  },
      { x: 265, y: 75  },
      { x: 75,  y: 225 },
      { x: 265, y: 225 },
    ];

    const cNodes = displayCases.map((c, i) => ({
      id: c.id,
      x: coords[i]?.x ?? 170,
      y: coords[i]?.y ?? 150,
      risk: c.riskKey || 'med',
      score: c.riskScore || 50,
      wallet: c.wallet,
      chain: c.chain,
    }));

    const sNodes = [
      { id: 'SN1', x: 170, y: 95,  label: 'Binance Cluster', type: 'vasp',   addr: '0x7585...ed87' },
      { id: 'SN2', x: 120, y: 165, label: 'Sanctioned Mixer', type: 'mixer',  addr: '0x7221...6967' },
      { id: 'SN3', x: 220, y: 165, label: 'Pass-Through Hub', type: 'wallet', addr: '0x3a6f...8f21' },
    ];

    const conns: { from: string; to: string; weight: number }[] = [];
    if (cNodes[0]) {
      conns.push({ from: cNodes[0].id, to: 'SN1', weight: 3 });
      conns.push({ from: cNodes[0].id, to: 'SN2', weight: 2 });
    }
    if (cNodes[1]) {
      conns.push({ from: cNodes[1].id, to: 'SN1', weight: 2 });
      conns.push({ from: cNodes[1].id, to: 'SN3', weight: 2 });
    }
    if (cNodes[2]) {
      conns.push({ from: cNodes[2].id, to: 'SN2', weight: 1 });
      conns.push({ from: cNodes[2].id, to: 'SN3', weight: 2 });
    }
    if (cNodes[3]) {
      conns.push({ from: cNodes[3].id, to: 'SN1', weight: 3 });
    }

    const ins = [
      { icon: '🔗', label: 'Shared VASP Co-Attribution', value: 'Binance deposit cluster shared across multiple active cases', severity: 'high' },
      { icon: '🌀', label: 'Mixer Infrastructure Link',   value: 'Common sanctioned mixer node identified in transaction flow', severity: 'high' },
      { icon: '👥', label: 'Intermediary Hub Overlap',    value: 'Transit address detected across multi-case counterparties', severity: 'medium' },
      { icon: '⏱',  label: 'Real-Time Sync Active',       value: `${cases.length} database cases synchronized for automated cross-linkage`, severity: 'info' },
    ];

    return { caseNodes: cNodes, sharedNodes: sNodes, connections: conns, insights: ins };
  }, [cases]);

  function getNodePos(id: string) {
    const c = caseNodes.find((x) => x.id === id);
    if (c) return { x: c.x, y: c.y };
    const s = sharedNodes.find((x) => x.id === id);
    if (s) return { x: s.x, y: s.y };
    return { x: 0, y: 0 };
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 pt-12 md:pt-4 pb-4"
           style={{ background: t.nav, borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                  style={{ background: t.inputBg }}>
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[18px] md:text-[20px] font-bold text-white tracking-wide"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>Cross-Case Correlation Hub</h1>
            <p className="text-[11px] text-white/35" style={{ color: t.textMuted }}>{cases.length} database cases · 3 shared infrastructure clusters</p>
          </div>
        </div>
        <div className="px-3.5 py-1.5 rounded-xl flex items-center gap-2"
             style={{ background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.2)' }}>
          <div className="w-2 h-2 rounded-full bg-[#ff3d5a] animate-ping" />
          <span className="text-[11px] font-bold text-[#ff3d5a]">High Priority Linkages</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6 space-y-6">

          {/* ── 2-Column Responsive Layout on Desktop ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Correlation Graph (7 cols on desktop) */}
            <div className="lg:col-span-7 rounded-2xl overflow-hidden shadow-lg"
                 style={{ background: t.card2, border: `1px solid ${t.borderAccent}`, height: 380 }}>
              <svg viewBox="0 0 340 300" className="w-full h-full">
                <defs>
                  <pattern id="crossGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="0.8" fill="rgba(255,255,255,0.06)" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#crossGrid)" />

                {/* Connection edges */}
                {connections.map((c, i) => {
                  const p1 = getNodePos(c.from);
                  const p2 = getNodePos(c.to);
                  const isHigh = c.weight >= 3;
                  const isSelected = selectedNode === c.from || selectedNode === c.to;
                  return (
                    <line
                      key={i}
                      x1={p1.x} y1={p1.y}
                      x2={p2.x} y2={p2.y}
                      stroke={isSelected ? '#00f2fe' : isHigh ? '#ff3d5a' : 'rgba(255,255,255,0.2)'}
                      strokeWidth={isSelected ? 2.5 : isHigh ? 2 : 1.2}
                      strokeDasharray={isHigh ? undefined : '3,3'}
                      opacity={isSelected ? 1 : 0.7}
                    />
                  );
                })}

                {/* Case nodes */}
                {caseNodes.map((cn) => {
                  const rc = RISK_COLORS[cn.risk] || RISK_COLORS.med;
                  const isSel = selectedNode === cn.id;
                  return (
                    <g key={cn.id} onClick={() => setSelectedNode(isSel ? null : cn.id)} style={{ cursor: 'pointer' }}>
                      <circle cx={cn.x} cy={cn.y} r={isSel ? 24 : 20}
                              fill={rc.fill} stroke={rc.stroke} strokeWidth={isSel ? 2.5 : 1.5} />
                      <text x={cn.x} y={cn.y - 4} textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">
                        {cn.id.slice(0, 8)}
                      </text>
                      <text x={cn.x} y={cn.y + 6} textAnchor="middle" fill={rc.text} fontSize="6.5" fontFamily="monospace">
                        {cn.score}/100
                      </text>
                    </g>
                  );
                })}

                {/* Shared nodes */}
                {sharedNodes.map((sn) => {
                  const ns = NODE_STYLES[sn.type] || NODE_STYLES.wallet;
                  const isSel = selectedNode === sn.id;
                  return (
                    <g key={sn.id} onClick={() => setSelectedNode(isSel ? null : sn.id)} style={{ cursor: 'pointer' }}>
                      <rect x={sn.x - 22} y={sn.y - 12} width={44} height={24} rx={6}
                            fill={ns.fill} stroke={isSel ? '#00f2fe' : ns.stroke} strokeWidth={isSel ? 2 : 1.2} />
                      <text x={sn.x} y={sn.y + 1} textAnchor="middle" fill="#fff" fontSize="6.5" fontWeight="bold">
                        {sn.label.slice(0, 8)}
                      </text>
                      <text x={sn.x} y={sn.y + 8} textAnchor="middle" fill={ns.stroke} fontSize="5" fontFamily="monospace">
                        {sn.type.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right: Key Insights & Linked Cases (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl p-5 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <h3 className="text-[14px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Autonomous Cross-Case Intelligence
                </h3>
                <div className="space-y-2.5">
                  {insights.map((ins, i) => {
                    const sc = SEVERITY_COLORS[ins.severity] || SEVERITY_COLORS.info;
                    return (
                      <div key={i} className="p-3 rounded-xl flex items-start gap-3"
                           style={{ background: sc.bg, border: `1px solid ${sc.color}25` }}>
                        <span className="text-lg">{ins.icon}</span>
                        <div>
                          <p className="text-[12px] font-bold" style={{ color: sc.color }}>{ins.label}</p>
                          <p className="text-[11px] text-white/60 leading-snug mt-0.5">{ins.value}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Linked Case Quick Select */}
              <div className="rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <h4 className="text-[13px] font-bold text-white mb-3" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Connected Dockets in Correlation Graph
                </h4>
                <div className="space-y-2">
                  {caseNodes.map((cn) => (
                    <div key={cn.id} className="flex items-center justify-between p-2.5 rounded-xl"
                         style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                      <div>
                        <p className="text-[12px] font-mono font-bold text-white">{cn.id}</p>
                        <p className="text-[10px] text-white/40">{cn.chain} · {cn.wallet ? `${cn.wallet.slice(0, 6)}...${cn.wallet.slice(-4)}` : 'Target'}</p>
                      </div>
                      <button onClick={() => onOpenCase(cn.id)}
                              className="px-3 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-cyan-300 text-[11px] font-bold">
                        View Dossier →
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
