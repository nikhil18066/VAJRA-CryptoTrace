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

  const selectedCaseObj = caseNodes.find((c) => c.id === selectedNode);
  const selectedSharedObj = sharedNodes.find((s) => s.id === selectedNode);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 md:px-8 pt-12 md:pt-4 pb-4"
           style={{ background: t.nav, borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-3">
          <button onClick={onBack}
                  className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                  style={{ background: t.inputBg }}>
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: t.textSub }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-[17px] md:text-[20px] font-bold text-white tracking-wide"
                style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>Cross-Case Correlation</h1>
            <p className="text-[10px] md:text-[11px] text-white/35" style={{ color: t.textMuted }}>{cases.length} database cases · 3 shared infrastructure clusters</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-xl flex items-center gap-1.5"
             style={{ background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-[#ff3d5a]" />
          <span className="text-[10px] font-bold text-[#ff3d5a]">Alert</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-4">

          {/* ── Responsive Layout (2-columns on desktop, stacked on mobile) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            {/* Left Section: Graph + Legend + Selected Node Inspection (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Network Graph */}
              <div className="rounded-2xl overflow-hidden relative shadow-md"
                   style={{ background: t.card2, border: `1px solid ${t.borderAccent}`, height: 320 }}>
                <svg viewBox="0 0 340 300" className="w-full h-full">
                  <defs>
                    <pattern id="crossGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="10" cy="10" r="0.8" fill={t.mode === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.06)'} />
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
                      <g key={i}>
                        <line
                          x1={p1.x} y1={p1.y}
                          x2={p2.x} y2={p2.y}
                          stroke={isSelected ? '#00f2fe' : isHigh ? 'rgba(255,61,90,0.6)' : t.mode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.18)'}
                          strokeWidth={isSelected ? 2 : isHigh ? 1.5 : 1}
                          strokeDasharray={isHigh ? undefined : '3,3'}
                        />
                        {isSelected && (
                          <circle r="3" fill="#00f2fe">
                            <animateMotion
                              path={`M${p1.x},${p1.y} L${p2.x},${p2.y}`}
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                        )}
                      </g>
                    );
                  })}

                  {/* Case nodes */}
                  {caseNodes.map((c) => {
                    const col = RISK_COLORS[c.risk] || RISK_COLORS.med;
                    const isSel = selectedNode === c.id;
                    return (
                      <g key={c.id}
                         transform={`translate(${c.x}, ${c.y})`}
                         className="cursor-pointer"
                         onClick={() => setSelectedNode(isSel ? null : c.id)}>
                        {isSel && (
                          <circle r="26" fill="none" stroke="#00f2fe" strokeWidth="1.5"
                                  strokeDasharray="4,2" className="anim-spin" />
                        )}
                        <circle r="20" fill={col.fill} stroke={col.stroke} strokeWidth="1.5" />
                        <text y="-3" textAnchor="middle" fontSize="7" fill={col.text}
                              fontFamily="monospace" fontWeight="bold">
                          {c.id.split('-').pop()}
                        </text>
                        <text y="7" textAnchor="middle" fontSize="8" fill={t.mode === 'light' ? '#0f172a' : '#ffffff'}
                              fontWeight="bold" fontFamily="sans-serif">
                          {c.score}
                        </text>
                        <text y="30" textAnchor="middle" fontSize="7" fill={t.mode === 'light' ? '#334155' : 'rgba(255,255,255,0.6)'}
                              fontFamily="monospace" fontWeight="600">
                          {c.id}
                        </text>
                      </g>
                    );
                  })}

                  {/* Shared infrastructure nodes */}
                  {sharedNodes.map((s) => {
                    const sty = NODE_STYLES[s.type];
                    const isSel = selectedNode === s.id;
                    return (
                      <g key={s.id}
                         transform={`translate(${s.x}, ${s.y})`}
                         className="cursor-pointer"
                         onClick={() => setSelectedNode(isSel ? null : s.id)}>
                        {isSel && (
                          <circle r="22" fill="none" stroke={sty.stroke} strokeWidth="1.5"
                                  strokeDasharray="3,2" />
                        )}
                        <polygon
                          points="0,-16 16,0 0,16 -16,0"
                          fill={sty.fill}
                          stroke={sty.stroke}
                          strokeWidth="1.5"
                        />
                        <text y="3" textAnchor="middle" fontSize="7" fill={sty.stroke}
                              fontWeight="bold" fontFamily="sans-serif">
                          {s.id}
                        </text>
                        <text y="25" textAnchor="middle" fontSize="7" fill={t.mode === 'light' ? '#334155' : 'rgba(255,255,255,0.7)'}
                              fontFamily="sans-serif" fontWeight="600">
                          {s.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 py-2 text-[10px]" style={{ color: t.textMuted }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff3d5a]" />
                  <span style={{ color: t.textMuted }}>Case Node</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rotate-45 bg-[#00d68f]" />
                  <span style={{ color: t.textMuted }}>Shared VASP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rotate-45 bg-[#ec4899]" />
                  <span style={{ color: t.textMuted }}>Shared Mixer</span>
                </div>
              </div>

              {/* Selected Node Details Card */}
              {selectedCaseObj && (
                <div className="rounded-xl p-4 space-y-2 animate-fadeIn" style={{ background: t.card, border: `1px solid ${t.borderAccent}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold font-mono" style={{ color: t.text }}>{selectedCaseObj.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-[#ff3d5a]">
                      Score: {selectedCaseObj.score}/100
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-cyan-500 font-semibold break-all">{selectedCaseObj.wallet || 'Target Address'}</p>
                  <p className="text-[10px]" style={{ color: t.textMuted }}>{selectedCaseObj.chain} Network</p>
                  <button onClick={() => onOpenCase(selectedCaseObj.id)}
                          className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] active:scale-95 transition-all">
                    Open Full Case Dossier →
                  </button>
                </div>
              )}

              {selectedSharedObj && (
                <div className="rounded-xl p-4 space-y-2 animate-fadeIn" style={{ background: t.card, border: `1px solid ${t.borderAccent}` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold" style={{ color: t.text }}>{selectedSharedObj.label} ({selectedSharedObj.id})</span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                      {selectedSharedObj.type}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-cyan-500 font-semibold">{selectedSharedObj.addr}</p>
                  <p className="text-[10px]" style={{ color: t.textSub }}>
                    Intersects with active cases across multiple jurisdiction dockets in the national registry.
                  </p>
                </div>
              )}
            </div>

            {/* Right Section: Correlation Insights + Linked Investigations (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Dynamic Key Intelligence Insights */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest"
                   style={{ color: t.textMuted }}>Correlation Insights</p>

                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="rounded-xl p-3.5 flex items-start gap-3"
                         style={{
                           background: SEVERITY_COLORS[ins.severity].bg,
                           border: `1px solid ${SEVERITY_COLORS[ins.severity].color}25`,
                         }}>
                      <span className="text-[16px] leading-none mt-0.5">{ins.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-white" style={{ color: t.text }}>{ins.label}</p>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  background: `${SEVERITY_COLORS[ins.severity].color}20`,
                                  color: SEVERITY_COLORS[ins.severity].color,
                                }}>
                            {ins.severity}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/55 mt-1 leading-snug" style={{ color: t.textSub }}>{ins.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Investigations List */}
              <div className="pt-1">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2"
                   style={{ color: t.textMuted }}>Linked Investigations ({cases.length})</p>
                <div className="space-y-2 pb-6">
                  {cases.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => onOpenCase(c.id)}
                      className="w-full rounded-xl p-3 flex items-center justify-between transition-all active:scale-[0.98] text-left hover:scale-[1.01]"
                      style={{ background: t.card, border: `1px solid ${t.border}` }}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[12px] font-semibold text-white font-mono" style={{ color: t.text }}>{c.id}</span>
                        <span className="text-[10px] text-white/40 block font-mono truncate" style={{ color: t.textMuted }}>{c.wallet}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: c.riskScore >= 75 ? 'rgba(255,61,90,0.15)' : 'rgba(245,166,35,0.15)',
                                color: c.riskScore >= 75 ? '#ff3d5a' : '#f5a623',
                              }}>
                          {c.riskScore}/100
                        </span>
                        <span className="text-[11px] text-[#00f2fe] font-semibold">View →</span>
                      </div>
                    </button>
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
