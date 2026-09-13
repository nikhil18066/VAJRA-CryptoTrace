import { useState, useEffect, useRef } from 'react';
import type { GraphNode, GraphEdge } from '../store/analysisStore';
import { useTheme } from '../context/theme';

type NodeType = GraphNode['type'];
type Filter = 'All' | 'Large Transfers' | 'Suspicious Tracking' | 'Inflow' | 'Outflow' | 'Simulator';

const NODE_STYLES: Record<NodeType, { fill: string; stroke: string; r: number; color: string; icon: string }> = {
  suspect:      { fill: '#061c38', stroke: '#00f2fe', r: 24, color: '#00f2fe', icon: '🎯' },
  intermediary: { fill: '#08253e', stroke: '#38bdf8', r: 18, color: '#38bdf8', icon: '💼' },
  mixer:        { fill: '#380c25', stroke: '#ec4899', r: 19, color: '#ec4899', icon: '🌪️' },
  exchange:     { fill: '#04301d', stroke: '#00d68f', r: 20, color: '#00d68f', icon: '🏦' },
  contract:     { fill: '#240c4e', stroke: '#a855f7', r: 17, color: '#a855f7', icon: '📄' },
  collector:    { fill: '#3b0e17', stroke: '#ff3d5a', r: 19, color: '#ff3d5a', icon: '⚡' },
  mule:         { fill: '#362104', stroke: '#f59e0b', r: 18, color: '#f59e0b', icon: '👤' },
  victim:       { fill: '#0b2038', stroke: '#60a5fa', r: 17, color: '#60a5fa', icon: '🛡️' },
};

const FILTERS: Filter[] = ['All', 'Large Transfers', 'Suspicious Tracking', 'Inflow', 'Outflow', 'Simulator'];

const TIMELINE_STAGES = [
  { stage: 0, time: 'T0: Inflow', label: 'Inflow Ingestion (Upstream Sources)' },
  { stage: 1, time: 'T1: Layering', label: 'Structuring & Rapid Intermediary Hops' },
  { stage: 2, time: 'T2: Mixer Hop', label: 'Privacy Protocol & Obfuscation Layer' },
  { stage: 3, time: 'T3: Liquidation', label: 'VASP Deposit & Centralized Off-Ramp' },
];

interface FundFlowGraphProps {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  loading?: boolean;
  wallet?: string;
  chain?: string;
}

// Multi-tiered forensic layout handling 15+ nodes with generous non-overlapping spacing
function layoutGraphNodes(inputNodes: GraphNode[]): GraphNode[] {
  if (!inputNodes || inputNodes.length === 0) return [];
  if (inputNodes.length === 1) {
    return [{ ...inputNodes[0], x: 600, y: 370 }];
  }

  const root = inputNodes.find((n) => n.id === 0 || n.type === 'suspect') || inputNodes[0];
  const others = inputNodes.filter((n) => n.id !== root.id);

  const cx = 600;
  const cy = 370;

  // Categorize nodes cleanly
  const leftNodes: GraphNode[] = [];
  const rightNodes: GraphNode[] = [];
  const topNodes: GraphNode[] = [];
  const bottomNodes: GraphNode[] = [];

  others.forEach((n) => {
    const l = (n.label || '').toLowerCase();
    if (n.type === 'victim' || l.includes('victim') || l.includes('inflow') || l.includes('source')) {
      leftNodes.push(n);
    } else if (n.type === 'exchange' || l.includes('binance') || l.includes('deposit') || l.includes('cex') || l.includes('vasp') || l.includes('off-ramp')) {
      rightNodes.push(n);
    } else if (n.type === 'mixer' || l.includes('mixer') || l.includes('tornado') || n.type === 'contract' || l.includes('contract')) {
      topNodes.push(n);
    } else if (n.type === 'mule' || n.type === 'collector' || l.includes('mule') || l.includes('collector')) {
      bottomNodes.push(n);
    } else {
      if (leftNodes.length <= rightNodes.length && leftNodes.length < 5) {
        leftNodes.push(n);
      } else if (rightNodes.length < 5) {
        rightNodes.push(n);
      } else if (topNodes.length < 4) {
        topNodes.push(n);
      } else {
        bottomNodes.push(n);
      }
    }
  });

  const positionedNodes: GraphNode[] = [
    { ...root, x: cx, y: cy },
  ];

  // Distribute Left Nodes (Inflows / Victims / Funding Sources)
  const leftTotal = leftNodes.length;
  leftNodes.forEach((n, i) => {
    let x = 180;
    let y = 370;

    if (leftTotal <= 3) {
      x = 180;
      const step = 400 / Math.max(1, leftTotal - 1);
      y = leftTotal === 1 ? 370 : 170 + i * step;
    } else if (leftTotal <= 8) {
      // 2-column staggered layout
      const isOuter = i % 2 === 0;
      x = isOuter ? 130 : 290;
      const colIdx = Math.floor(i / 2);
      const colCount = Math.ceil(leftTotal / 2);
      const step = 440 / Math.max(1, colCount - 1);
      y = 150 + colIdx * step + (isOuter ? 0 : 40);
    } else {
      // 3-column staggered layout
      const col = i % 3;
      x = col === 0 ? 100 : col === 1 ? 230 : 360;
      const rowIdx = Math.floor(i / 3);
      const rowCount = Math.ceil(leftTotal / 3);
      const step = 460 / Math.max(1, rowCount - 1);
      y = 140 + rowIdx * step + (col * 30);
    }

    positionedNodes.push({ ...n, x: Math.round(x), y: Math.round(y) });
  });

  // Distribute Right Nodes (Exchanges / Off-Ramps / Liquidation)
  const rightTotal = rightNodes.length;
  rightNodes.forEach((n, i) => {
    let x = 1020;
    let y = 370;

    if (rightTotal <= 3) {
      x = 1020;
      const step = 400 / Math.max(1, rightTotal - 1);
      y = rightTotal === 1 ? 370 : 170 + i * step;
    } else if (rightTotal <= 8) {
      // 2-column staggered layout
      const isOuter = i % 2 === 0;
      x = isOuter ? 1070 : 910;
      const colIdx = Math.floor(i / 2);
      const colCount = Math.ceil(rightTotal / 2);
      const step = 440 / Math.max(1, colCount - 1);
      y = 150 + colIdx * step + (isOuter ? 0 : 40);
    } else {
      // 3-column staggered layout
      const col = i % 3;
      x = col === 0 ? 1100 : col === 1 ? 970 : 840;
      const rowIdx = Math.floor(i / 3);
      const rowCount = Math.ceil(rightTotal / 3);
      const step = 460 / Math.max(1, rowCount - 1);
      y = 140 + rowIdx * step + (col * 30);
    }

    positionedNodes.push({ ...n, x: Math.round(x), y: Math.round(y) });
  });

  // Distribute Top Nodes (Mixers / Smart Contracts / Obfuscation)
  const topTotal = topNodes.length;
  topNodes.forEach((n, i) => {
    let x = 600;
    let y = 100;

    if (topTotal === 1) {
      x = 600;
      y = 100;
    } else if (topTotal === 2) {
      x = i === 0 ? 460 : 740;
      y = 100;
    } else if (topTotal <= 4) {
      const step = 420 / Math.max(1, topTotal - 1);
      x = 390 + i * step;
      y = (i % 2 === 0) ? 85 : 150;
    } else {
      const isOuter = i % 2 === 0;
      const colIdx = Math.floor(i / 2);
      const colCount = Math.ceil(topTotal / 2);
      const step = 440 / Math.max(1, colCount - 1);
      x = 380 + colIdx * step;
      y = isOuter ? 80 : 155;
    }

    positionedNodes.push({ ...n, x: Math.round(x), y: Math.round(y) });
  });

  // Distribute Bottom Nodes (Mules / Collectors / Layering Intermediaries)
  const bottomTotal = bottomNodes.length;
  bottomNodes.forEach((n, i) => {
    let x = 600;
    let y = 640;

    if (bottomTotal === 1) {
      x = 600;
      y = 640;
    } else if (bottomTotal === 2) {
      x = i === 0 ? 460 : 740;
      y = 640;
    } else if (bottomTotal <= 4) {
      const step = 420 / Math.max(1, bottomTotal - 1);
      x = 390 + i * step;
      y = (i % 2 === 0) ? 640 : 575;
    } else {
      const isOuter = i % 2 === 0;
      const colIdx = Math.floor(i / 2);
      const colCount = Math.ceil(bottomTotal / 2);
      const step = 440 / Math.max(1, colCount - 1);
      x = 380 + colIdx * step;
      y = isOuter ? 655 : 580;
    }

    positionedNodes.push({ ...n, x: Math.round(x), y: Math.round(y) });
  });

  // Dynamic Collision Separation Pass to guarantee zero node/card overlap
  for (let iter = 0; iter < 10; iter++) {
    for (let i = 0; i < positionedNodes.length; i++) {
      for (let j = i + 1; j < positionedNodes.length; j++) {
        const a = positionedNodes[i];
        const b = positionedNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minXDist = 135;
        const minYDist = 65;

        if (Math.abs(dx) < minXDist && Math.abs(dy) < minYDist) {
          const overlapX = (minXDist - Math.abs(dx)) * (dx >= 0 ? 1 : -1) * 0.5;
          const overlapY = (minYDist - Math.abs(dy)) * (dy >= 0 ? 1 : -1) * 0.5;

          if (a.id !== root.id) {
            a.x = Math.max(80, Math.min(1120, a.x - overlapX * 0.7));
            a.y = Math.max(70, Math.min(670, a.y - overlapY * 0.7));
          }
          if (b.id !== root.id) {
            b.x = Math.max(80, Math.min(1120, b.x + overlapX * 0.7));
            b.y = Math.max(70, Math.min(670, b.y + overlapY * 0.7));
          }
        }
      }
    }
  }

  return positionedNodes;
}

export default function FundFlowGraph({ nodes: propNodes, edges: propEdges, loading, wallet, chain }: FundFlowGraphProps) {
  const { t } = useTheme();
  const [filter, setFilter]     = useState<Filter>('All');
  const [selected, setSelected] = useState<number | null>(null);

  // Pan & Zoom State
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Time-Machine State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStage, setPlaybackStage] = useState(3);
  const [speed, setSpeed]         = useState<1 | 2 | 4>(1);

  // Simulator State: simulated risk overrides for nodes
  const [nodeOverrides, setNodeOverrides] = useState<Record<number, { type: NodeType; risk: number }>>({});

  // Clean genuine on-chain nodes (no dummy/mock fallbacks)
  const inputNodes = propNodes && propNodes.length > 0 ? propNodes : [];
  const rawEdges   = propEdges && propEdges.length > 0 ? propEdges : [];

  // Compute clean layout
  const rawNodes = layoutGraphNodes(inputNodes);

  // Apply simulator overrides
  const NODES = rawNodes.map((n) => {
    if (nodeOverrides[n.id]) {
      return {
        ...n,
        type: nodeOverrides[n.id].type,
        riskScore: nodeOverrides[n.id].risk,
      };
    }
    return n;
  });

  const EDGES = rawEdges;

  // Time Machine Playback Loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setPlaybackStage((prev) => {
          if (prev >= 3) {
            setIsPlaying(false);
            return 3;
          }
          return prev + 1;
        });
      }, 1600 / speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Determine node & edge visibility based on playback stage & filters
  const visibleEdges = EDGES.filter((e, idx) => {
    if (filter === 'Large Transfers')      return !!e.isLarge;
    if (filter === 'Suspicious Tracking')  return !!e.suspicious;
    if (filter === 'Inflow')               return e.to === 0;
    if (filter === 'Outflow')              return e.from === 0;

    if (playbackStage === 0) return e.to === 0 || idx === 0;
    if (playbackStage === 1) return e.to === 0 || idx <= Math.floor(EDGES.length * 0.4);
    if (playbackStage === 2) return e.to === 0 || idx <= Math.floor(EDGES.length * 0.7);
    return true;
  });

  const visibleNodeIds = new Set<number>();
  visibleEdges.forEach((e) => { visibleNodeIds.add(e.from); visibleNodeIds.add(e.to); });
  visibleNodeIds.add(0);

  if (filter === 'Suspicious Tracking') {
    NODES.filter((n) => n.type === 'mixer' || n.type === 'mule' || n.type === 'collector' || (n.riskScore && n.riskScore >= 75)).forEach((n) => visibleNodeIds.add(n.id));
  }
  if (filter === 'Large Transfers') {
    NODES.filter((n) => n.isLarge).forEach((n) => visibleNodeIds.add(n.id));
  }
  if (playbackStage === 3 || filter === 'All' || filter === 'Simulator' || visibleNodeIds.size <= 1) {
    NODES.forEach((n) => visibleNodeIds.add(n.id));
  }

  const selectedNode = selected !== null ? NODES.find((n) => n.id === selected) : null;
  const selectedStyle = selectedNode ? (NODE_STYLES[selectedNode.type] || NODE_STYLES.intermediary) : NODE_STYLES.intermediary;
  const edgeColor = (e: GraphEdge) => e.suspicious ? '#ec4899' : e.isLarge ? '#f5a623' : '#00f2fe';

  const largeCount = EDGES.filter((e) => e.isLarge).length || NODES.filter((n) => n.isLarge).length;
  const suspiciousCount = EDGES.filter((e) => e.suspicious).length || NODES.filter((n) => n.type === 'mixer' || n.type === 'mule' || n.type === 'collector').length;
  const inflowCount = EDGES.filter((e) => e.to === 0).length || NODES.filter((n) => n.type === 'victim' || n.label.toLowerCase().includes('inflow')).length;
  const outflowCount = EDGES.filter((e) => e.from === 0).length || NODES.filter((n) => n.type === 'exchange' || n.type === 'mule' || n.type === 'mixer').length;

  const handleSimulateTag = (nodeId: number, tagType: NodeType | 'RESET') => {
    if (tagType === 'RESET') {
      setNodeOverrides((prev) => {
        const next = { ...prev };
        delete next[nodeId];
        return next;
      });
      return;
    }

    const defaultRisks: Record<NodeType, number> = {
      mixer: 98,
      collector: 92,
      mule: 85,
      suspect: 88,
      intermediary: 65,
      contract: 45,
      exchange: 20,
      victim: 15,
    };

    setNodeOverrides((prev) => ({
      ...prev,
      [nodeId]: { type: tagType, risk: defaultRisks[tagType] },
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, Math.round((z + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, Math.round((z - 0.15) * 100) / 100));
  const handleResetZoom = () => { setZoom(1.0); setPan({ x: 0, y: 0 }); };

  const currentStageInfo = TIMELINE_STAGES[playbackStage] || TIMELINE_STAGES[3];

  return (
    <div className="flex flex-col h-full">
      {/* Top Controls: Filter chips */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0 gap-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
                    className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 whitespace-nowrap active:scale-95"
                    style={{
                      background: filter === f ? '#1e5fff' : t.inputBg,
                      color:      filter === f ? '#fff'    : t.textSub,
                      border:     filter === f ? '1px solid #1e5fff' : `1px solid ${t.border}`,
                    }}>
              {f === 'All' ? `All Transfers (${NODES.length})` :
               f === 'Large Transfers' ? `⚡ Large Transfers (${largeCount})` :
               f === 'Suspicious Tracking' ? `🚨 Suspicious Tracking (${suspiciousCount})` :
               f === 'Inflow' ? `⬇ Inflows (${inflowCount})` :
               f === 'Outflow' ? `⬆ Outflows (${outflowCount})` :
               f === 'Simulator' ? '⚡ Risk Simulator' : f}
            </button>
          ))}
        </div>

        {/* Pan & Zoom Toolbar */}
        <div className="flex items-center gap-1 bg-[#061224] border border-white/10 p-1 rounded-xl flex-shrink-0">
          <button onClick={handleZoomIn} title="Zoom In"
                  className="w-6 h-6 rounded-lg bg-white/5 text-cyan-300 hover:bg-cyan-500/20 font-bold text-xs flex items-center justify-center">
            +
          </button>
          <button onClick={handleZoomOut} title="Zoom Out"
                  className="w-6 h-6 rounded-lg bg-white/5 text-cyan-300 hover:bg-cyan-500/20 font-bold text-xs flex items-center justify-center">
            -
          </button>
          <button onClick={handleResetZoom} title="Reset View"
                  className="px-1.5 h-6 rounded-lg bg-white/5 text-[9px] font-mono text-white/60 hover:text-white flex items-center justify-center">
            {Math.round(zoom * 100)}%
          </button>
        </div>
      </div>

      {/* Time Machine Playback Bar */}
      <div className="mx-4 mb-2 p-2.5 rounded-xl bg-[#061224]/90 border border-white/10 flex items-center justify-between gap-3 text-[11px] font-mono shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (playbackStage >= 3 && !isPlaying) setPlaybackStage(0);
            setIsPlaying(!isPlaying);
          }}
                  className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center hover:bg-cyan-500/30 active:scale-95 transition-all">
            {isPlaying ? '⏸' : '▶'}
          </button>
          <span className="text-[#00f2fe] font-bold truncate">{currentStageInfo.time}</span>
        </div>

        <div className="flex-1 max-w-[180px] sm:max-w-xs flex items-center gap-1.5">
          {TIMELINE_STAGES.map((s) => (
            <button key={s.stage} onClick={() => setPlaybackStage(s.stage)}
                    title={s.label}
                    className={`h-2 flex-1 rounded-full transition-all ${playbackStage >= s.stage ? 'bg-[#00f2fe] shadow-[0_0_8px_rgba(0,242,254,0.7)]' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="flex items-center gap-1">
          {([1, 2, 4] as const).map((spd) => (
            <button key={spd} onClick={() => setSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${speed === spd ? 'bg-blue-600 text-white' : 'text-white/40 hover:text-white'}`}>
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 mx-4 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
           style={{ background: '#030814', border: `1px solid ${t.borderAccent}`, minHeight: 0 }}
           onMouseDown={handleMouseDown}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}>

        {/* ── State 1: Active Live Loading Scanner ── */}
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#030814]/98 backdrop-blur-lg px-6 text-center space-y-4">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Radar rings */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
              <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-pulse" />
              <div className="absolute inset-6 rounded-full border border-blue-500/40" />
              {/* Radar sweep beam */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/25 to-transparent animate-spin"
                   style={{ transformOrigin: 'center center', animationDuration: '2.5s' }} />
              {/* Core Icon */}
              <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300 font-mono text-base font-bold shadow-[0_0_20px_rgba(0,242,254,0.6)]">
                ⚡
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00f2fe] text-[10px] font-mono font-bold tracking-widest uppercase">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Live Blockchain Ingestion
              </div>
              <p className="text-[15px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Tracing Multi-Chain Fund Flow & Counterparties...
              </p>
              <p className="text-[11px] font-mono text-cyan-300/70 truncate max-w-xs">
                {wallet ? `Target: ${wallet.slice(0, 10)}...${wallet.slice(-6)}` : 'Querying RPC nodes...'}
              </p>
            </div>

            <div className="w-52 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 animate-[pulse_1s_infinite] w-full" />
            </div>
          </div>
        )}

        {/* ── State 2: Fresh Single-Node Wallet (0 Counterparties) ── */}
        {!loading && NODES.length <= 1 && EDGES.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center space-y-3 bg-[#030814]/85">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,242,254,0.15)]">
              🛡️
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-[15px] font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                Isolated Self-Custody Keypair
              </p>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Direct on-chain ledger analysis verified 0 external counterparty hops for this address. This wallet is currently inactive or operates as an isolated keypair.
              </p>
            </div>
            {wallet && (
              <span className="text-[10px] font-mono px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-cyan-300 truncate max-w-xs">
                {wallet}
              </span>
            )}
          </div>
        )}

        {/* ── SVG Graph Render with Pan & Zoom Group ── */}
        <svg viewBox="0 0 1200 740" className="w-full h-full max-h-[580px]">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="17" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#00f2fe" />
            </marker>
            <marker id="arrowPink" viewBox="0 0 10 10" refX="17" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#ec4899" />
            </marker>
            <marker id="arrowGold" viewBox="0 0 10 10" refX="17" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f5a623" />
            </marker>
            <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Background Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '600px 370px' }}>
            {/* Clean Curved Edges */}
            {visibleEdges.map((e, idx) => {
              const src = NODES.find((n) => n.id === e.from);
              const dst = NODES.find((n) => n.id === e.to);
              if (!src || !dst) return null;

              // Compute smooth curve midpoint
              const dx = dst.x - src.x;
              const dy = dst.y - src.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const curvature = (idx % 2 === 0 ? 1 : -1) * Math.min(22, dist * 0.055);
              const midX = (src.x + dst.x) / 2 - (dy / dist) * curvature;
              const midY = (src.y + dst.y) / 2 + (dx / dist) * curvature;

              const pathD = `M ${src.x} ${src.y} Q ${midX} ${midY} ${dst.x} ${dst.y}`;
              const marker = e.suspicious ? 'url(#arrowPink)' : e.isLarge ? 'url(#arrowGold)' : 'url(#arrow)';

              return (
                <g key={`edge-${idx}`}>
                  <path d={pathD}
                        fill="none"
                        stroke={edgeColor(e)}
                        strokeWidth={e.suspicious ? 2.4 : e.isLarge ? 2.2 : 1.6}
                        strokeOpacity={e.suspicious ? 0.95 : e.isLarge ? 0.9 : 0.65}
                        strokeDasharray={e.suspicious ? '5 3' : undefined}
                        markerEnd={marker} />

                  {/* Sleek compact amount badge */}
                  {(e.amount || e.relationship) && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect x="-38" y="-8.5" width="76" height="17" rx="8.5"
                            fill="#020612"
                            stroke={e.suspicious ? '#ec4899' : e.isLarge ? '#f5a623' : 'rgba(0,242,254,0.45)'}
                            strokeWidth={e.suspicious || e.isLarge ? '1.2' : '0.8'} />
                      <text x="0" y="3.5" textAnchor="middle"
                            fill={e.suspicious ? '#ec4899' : e.isLarge ? '#f5a623' : '#00f2fe'}
                            fontSize="7.5" fontWeight="bold" fontFamily="'JetBrains Mono', monospace">
                        {e.amount || e.relationship?.toUpperCase()}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((n) => {
              if (!visibleNodeIds.has(n.id)) return null;
              const style = NODE_STYLES[n.type] || NODE_STYLES.intermediary;
              const isSelected = selected === n.id;
              const isRoot = n.id === 0;

              // Text preparation & clean string limits
              const rawLabel = isRoot ? 'TARGET SUBJECT' : (n.label || 'Node');
              const rawSub = `${n.addr || ''}${n.totalValue ? ' · ' + n.totalValue : ''}`;

              // Dynamic width calculation with bounded bounds
              const labelLen = rawLabel.length;
              const subLen = rawSub.length;
              const cardW = Math.min(148, Math.max(118, Math.max(labelLen * 6.2, subLen * 5.4) + 16));
              const cardH = 28;
              const cardY = n.y > 450 ? n.y - style.r - 36 : n.y + style.r + 8;
              const clipId = `card-clip-${n.id}`;

              // Text truncation to guarantee zero overflow
              const displayLabel = rawLabel.length > 20 ? rawLabel.slice(0, 19) + '…' : rawLabel;
              const displaySub = rawSub.length > 22 ? rawSub.slice(0, 21) + '…' : rawSub;

              return (
                <g key={`node-${n.id}`} onClick={() => setSelected(isSelected ? null : n.id)}
                   className="cursor-pointer group">
                  {/* Root Radar Rings */}
                  {isRoot && (
                    <>
                      <circle cx={n.x} cy={n.y} r={style.r + 15}
                              fill="none" stroke="#00f2fe" strokeWidth="1.2"
                              strokeDasharray="4 4" opacity="0.4"
                              className="animate-spin" style={{ transformOrigin: `${n.x}px ${n.y}px` }} />
                      <circle cx={n.x} cy={n.y} r={style.r + 7}
                              fill="none" stroke="#00f2fe" strokeWidth="0.8" opacity="0.25" />
                    </>
                  )}

                  {/* Selection Halo */}
                  {isSelected && (
                    <circle cx={n.x} cy={n.y} r={style.r + 7}
                            fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.95" />
                  )}

                  {/* Large Value Outer Indicator Ring (Subtle secondary ring, never overrides node outline) */}
                  {n.isLarge && !isRoot && (
                    <circle cx={n.x} cy={n.y} r={style.r + 4.5}
                            fill="none" stroke="#f5a623" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.75" />
                  )}

                  {/* Main Node Circle: Outline stroke is ALWAYS identical to entity type color */}
                  <circle cx={n.x} cy={n.y} r={style.r}
                          fill={style.fill} stroke={style.stroke}
                          strokeWidth={isRoot ? 2.8 : 2.0}
                          filter={isRoot ? 'url(#nodeGlow)' : undefined} />

                  {/* Icon inside node */}
                  <text x={n.x} y={n.y + 4.5} textAnchor="middle" fontSize={isRoot ? '12' : '10'} opacity="0.95">
                    {style.icon}
                  </text>

                  {/* Single Unified Card Badge with SVG ClipPath (100% Zero Overflow) */}
                  <g transform={`translate(${n.x}, ${cardY})`}>
                    <clipPath id={clipId}>
                      <rect x={-cardW / 2} y="0" width={cardW} height={cardH} rx="7" />
                    </clipPath>

                    {/* Card Box Background */}
                    <rect x={-cardW / 2} y="0" width={cardW} height={cardH} rx="7"
                          fill="#020815" fillOpacity="0.96"
                          stroke={isSelected ? '#ffffff' : isRoot ? '#00f2fe' : `${style.stroke}75`}
                          strokeWidth={isSelected ? 1.5 : 1.0} />

                    {/* Clipped Text Content */}
                    <g clipPath={`url(#${clipId})`}>
                      {/* Top: Entity Label with Entity Color */}
                      <text x="0" y="11.5" textAnchor="middle"
                            fill={isRoot ? '#00f2fe' : style.stroke}
                            fontSize="8.5" fontWeight="bold" fontFamily="'Inter', sans-serif">
                        {displayLabel}
                      </text>
                      {/* Bottom: Address & Value */}
                      <text x="0" y="22" textAnchor="middle" fill="#94a3b8"
                            fontSize="7" fontFamily="'JetBrains Mono', monospace">
                        {displaySub}
                      </text>
                    </g>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Selected Node Inspector / What-If Simulator Panel */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 rounded-xl p-3 space-y-2 animate-fadeIn z-30 max-h-[220px] overflow-y-auto no-scrollbar"
               style={{ background: 'rgba(3,8,20,0.97)', border: `1px solid ${selectedStyle.stroke}`, backdropFilter: 'blur(14px)', boxShadow: '0 8px 32px rgba(0,0,0,0.9)' }}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-bold text-white truncate max-w-[200px]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {selectedNode.label}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold"
                        style={{
                          background: `${selectedStyle.stroke}20`,
                          color: selectedStyle.stroke,
                          border: `1px solid ${selectedStyle.stroke}40`,
                        }}>
                    {selectedNode.type}
                  </span>
                  {selectedNode.riskScore !== undefined && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 font-bold">
                      RISK: {selectedNode.riskScore}/100
                    </span>
                  )}
                  {selectedNode.totalValue && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold">
                      VOL: {selectedNode.totalValue}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-mono text-cyan-400/80 mt-0.5 select-all truncate">
                  {selectedNode.fullAddr || selectedNode.addr}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-white/5 flex-shrink-0">
                ✕
              </button>
            </div>

            {/* Interactive "What-If" Simulator Risk Re-propagation with All 8 Node Types and Colors */}
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-white/50 font-bold uppercase">What-If Forensic Simulation:</span>
                {nodeOverrides[selectedNode.id] && (
                  <button onClick={() => handleSimulateTag(selectedNode.id, 'RESET')}
                          className="text-cyan-400 hover:underline text-[10px]">
                    Reset to Default
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono flex-wrap">
                {/* 1. Sanctioned Mixer */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'mixer')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'mixer' ? 'ring-1 ring-pink-400 font-bold' : ''}`}
                        style={{ background: 'rgba(236,72,153,0.18)', color: '#ec4899', borderColor: 'rgba(236,72,153,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#ec4899]" />
                  + Mixer (+45)
                </button>

                {/* 2. Syndicate Collector */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'collector')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'collector' ? 'ring-1 ring-red-400 font-bold' : ''}`}
                        style={{ background: 'rgba(255,61,90,0.18)', color: '#ff3d5a', borderColor: 'rgba(255,61,90,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#ff3d5a]" />
                  + Collector (+40)
                </button>

                {/* 3. Pass-Through Mule */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'mule')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'mule' ? 'ring-1 ring-amber-400 font-bold' : ''}`}
                        style={{ background: 'rgba(245,166,35,0.18)', color: '#f5a623', borderColor: 'rgba(245,166,35,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#f5a623]" />
                  + Mule (+35)
                </button>

                {/* 4. Suspect Subject */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'suspect')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'suspect' ? 'ring-1 ring-cyan-400 font-bold' : ''}`}
                        style={{ background: 'rgba(0,242,254,0.18)', color: '#00f2fe', borderColor: 'rgba(0,242,254,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#00f2fe]" />
                  + Suspect (+30)
                </button>

                {/* 5. Intermediary Transit */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'intermediary')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'intermediary' ? 'ring-1 ring-sky-400 font-bold' : ''}`}
                        style={{ background: 'rgba(56,189,248,0.18)', color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
                  + Intermediary (+15)
                </button>

                {/* 6. Smart Contract */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'contract')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'contract' ? 'ring-1 ring-purple-400 font-bold' : ''}`}
                        style={{ background: 'rgba(168,85,247,0.18)', color: '#a855f7', borderColor: 'rgba(168,85,247,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
                  Contract (0)
                </button>

                {/* 7. Compliant VASP Exchange */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'exchange')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'exchange' ? 'ring-1 ring-emerald-400 font-bold' : ''}`}
                        style={{ background: 'rgba(0,214,143,0.18)', color: '#00d68f', borderColor: 'rgba(0,214,143,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#00d68f]" />
                  - VASP (-35)
                </button>

                {/* 8. Verified Victim */}
                <button onClick={() => handleSimulateTag(selectedNode.id, 'victim')}
                        className={`px-2 py-1 rounded-lg border flex items-center gap-1 active:scale-95 transition-all ${selectedNode.type === 'victim' ? 'ring-1 ring-blue-400 font-bold' : ''}`}
                        style={{ background: 'rgba(96,165,250,0.18)', color: '#60a5fa', borderColor: 'rgba(96,165,250,0.4)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#60a5fa]" />
                  - Victim (-40)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

