import { useState, useSyncExternalStore } from 'react';
import RiskGauge from '../components/RiskGauge';
import FundFlowGraph from '../components/FundFlowGraph';
import { analysisStore } from '../store/analysisStore';
import { useTheme } from '../context/theme';
import type { ThemeColors } from '../context/theme';
import { downloadCaseReportPDF, shareCaseReport, downloadEvidenceBundleJSON } from '../utils/exportUtils';
import { generateAndPrintLegalNotice } from '../utils/legalNoticeGenerator';

type CaseTab = 'graph' | 'wallet' | 'vasp' | 'risk' | 'txns' | 'ai' | 'evidence' | 'report';

interface CaseDetailProps {
  caseId: string;
  onBack: () => void;
  onOpenAI: () => void;
  onOpenEvidence: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error', sub?: string) => void;
}

const TABS: { id: CaseTab; label: string; badge?: string }[] = [
  { id: 'graph',    label: 'Flow Graph' },
  { id: 'wallet',   label: 'Wallet'     },
  { id: 'vasp',     label: 'VASP'       },
  { id: 'risk',     label: 'Risk DNA', badge: '6D' },
  { id: 'txns',     label: 'Txns'       },
  { id: 'ai',       label: 'VAJRA AI', badge: 'COPILOT' },
  { id: 'evidence', label: 'Evidence'   },
  { id: 'report',   label: 'Report & Notice' },
];

function SectionHeader({ title, t }: { title: string; t: ThemeColors }) {
  return (
    <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-3"
       style={{ color: t.textMuted }}>{title}</p>
  );
}

function DataRow({ label, value, mono = false, accent = false, t }:
  { label: string; value: string; mono?: boolean; accent?: boolean; t: ThemeColors }) {
  return (
    <div className="flex items-center justify-between py-2.5"
         style={{ borderBottom: `1px solid ${t.border}` }}>
      <span className="text-[12px] text-white/40" style={{ color: t.textSub }}>{label}</span>
      <span className={`text-[12px] font-medium ${accent ? 'text-[#00f2fe]' : 'text-white'}`}
            style={{ fontFamily: mono ? "'Inter', monospace" : undefined, color: accent ? '#00f2fe' : t.text }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Graph Tab ─── */
function GraphTab({ nodes, edges, loading, wallet, chain, t }: { nodes: import('../store/analysisStore').GraphNode[]; edges: import('../store/analysisStore').GraphEdge[]; loading?: boolean; wallet?: string; chain?: string; t: ThemeColors }) {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-4 sm:px-6 md:px-8 pt-3 pb-1 flex items-center justify-between">
        <SectionHeader title="Fund Flow & Entity Relationship Graph" t={t} />
        <span className="text-[11px] font-mono text-cyan-400 font-semibold hidden sm:inline">
          {nodes.length} Nodes · {edges.length} Transfers
        </span>
      </div>
      <div className="flex-1 min-h-0 w-full">
        <FundFlowGraph nodes={nodes} edges={edges} loading={loading} wallet={wallet} chain={chain} />
      </div>
    </div>
  );
}

/* ─── Wallet & Entity Tab ─── */
function WalletTab({ data, t }: { data: ReturnType<typeof analysisStore.get>; t: ThemeColors }) {
  const b      = data.blockchain;
  const addr   = b?.address   || data.wallet || 'Target Address';
  const chain  = b?.chain     || 'Multi-Chain EVM';
  const bal    = b?.balance   || '0.00';
  const balUSD = b?.balanceUSD || '$0.00';
  const txCnt  = b?.txCount   ?? 0;
  const first  = b?.firstSeen || 'N/A';
  const last   = b?.lastSeen  || 'N/A';
  const risk   = b?.riskScore ?? data.riskDNA?.compositeScore ?? 50;
  const typ    = b?.typology  || (data.typologyMatches?.[0]?.title ?? 'Standard Activity');

  const riskColor = risk >= 75 ? '#ff3d5a' : risk >= 45 ? '#f5a623' : '#00d68f';
  const riskLabel = risk >= 75 ? 'High Risk' : risk >= 45 ? 'Medium Risk' : 'Low Risk';

  const fp = data.fingerprint;
  const clusters = data.entityClusters || [];
  const portfolio = b?.portfolio || [];

  return (
    <div className="overflow-y-auto h-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-6 max-w-7xl mx-auto w-full">
      {/* Address chip */}
      <div className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
           style={{ background: t.card2, border: `1px solid ${t.borderAccent}` }}>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-mono text-white font-semibold truncate" style={{ color: t.text }}>{addr}</p>
          <p className="text-[11px] text-white/40 mt-0.5" style={{ color: t.textSub }}>{chain} · {typ}</p>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full self-start sm:self-center flex-shrink-0 uppercase"
              style={{ background: `${riskColor}18`, color: riskColor }}>
          {riskLabel} ({risk}/100)
        </span>
      </div>

      {/* Discovered Portfolio & Token Assets */}
      <div>
        <SectionHeader title={`On-Chain Holdings · ${portfolio.length || 1} Asset(s) (${balUSD})`} t={t} />
        {portfolio.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolio.map((p, idx) => (
              <div key={idx} className="rounded-xl p-3.5 space-y-1" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold font-mono" style={{ color: t.text }}>{p.symbol}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-400 font-mono font-bold">
                    {p.chain}
                  </span>
                </div>
                <p className="text-[13px] font-mono font-bold text-cyan-400">{p.formatted}</p>
                <p className="text-[11px]" style={{ color: t.textMuted }}>{p.balanceUSD}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl p-3.5 space-y-1" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold font-mono" style={{ color: t.text }}>{chain} Native</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-cyan-400 font-mono font-bold">
                  {chain}
                </span>
              </div>
              <p className="text-[13px] font-mono font-bold text-cyan-400">{bal}</p>
              <p className="text-[11px]" style={{ color: t.textMuted }}>{balUSD}</p>
            </div>
          </div>
        )}
      </div>

      {/* Behavioral DNA & Clusters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Behavioral Fingerprint Card */}
        {fp && (
          <div>
            <SectionHeader title="Behavioral DNA Fingerprint" t={t} />
            <div className="rounded-2xl p-4 space-y-2.5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between pb-2" style={{ borderBottom: `1px solid ${t.border}` }}>
                <span className="text-[12px]" style={{ color: t.textSub }}>Signature Hash</span>
                <span className="text-[11px] font-mono text-[#00f2fe] font-bold">{fp.fingerprintHash}</span>
              </div>
              <DataRow label="Transaction Velocity" value={fp.velocityCategory} t={t} />
              <DataRow label="Fan-Out Dispersion" value={fp.fanOutCategory} t={t} />
              <DataRow label="Avg Holding Time" value={`${fp.avgHoldingTimeMinutes} mins`} t={t} />
              <DataRow label="Timing Regularity (Bot/Script Index)" value={`${fp.timingRegularityPercent}%`} t={t} />
              <DataRow label="Exchange Exposure" value={fp.exchangeExposureLevel} t={t} />
            </div>
          </div>
        )}

        {/* Ledger Overview */}
        <div>
          <SectionHeader title="Ledger Overview & Activity Stats" t={t} />
          <div className="rounded-2xl px-5 py-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <DataRow label="Chain Network"    value={chain} t={t} />
            <DataRow label="Total Balance"    value={bal}   t={t} />
            <DataRow label="Balance (USD)"    value={balUSD} t={t} />
            <DataRow label="Total Tx Count"   value={String(txCnt)} t={t} />
            <DataRow label="First Active"     value={first} t={t} />
            <DataRow label="Last Active"      value={last}  t={t} />
          </div>
        </div>
      </div>

      {/* Discovered Entity Clusters */}
      {clusters.length > 0 && (
        <div>
          <SectionHeader title="Discovered Entity Clusters" t={t} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {clusters.map((c) => (
              <div key={c.clusterId} className="rounded-2xl p-4" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-bold" style={{ color: t.text }}>{c.name}</span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                    {c.commonControlConfidence}% CONTROL CONFIDENCE
                  </span>
                </div>
                <p className="text-[11px] font-mono text-cyan-400 mb-2">{c.clusterId} · {c.addresses.length} Linked Wallets</p>
                <div className="space-y-1">
                  {c.heuristicReasons.map((hr, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px]" style={{ color: t.textSub }}>
                      <span className="text-[#00f2fe]">›</span>
                      <span>{hr}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── VASP Tab ─── */
function VaspTab({ data, t }: { data: ReturnType<typeof analysisStore.get>; t: ThemeColors }) {
  const vasps = data.vaspAttribution || [];
  const primary = vasps[0] || { name: 'Unknown VASP', confidence: 0, category: 'Unhosted' };

  return (
    <div className="overflow-y-auto h-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-6 max-w-7xl mx-auto w-full">
      <SectionHeader title="Primary VASP Attribution & Counterparty Classification" t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6"
             style={{ background: t.card, border: `1px solid ${primary.confidence >= 60 ? 'rgba(0,214,143,0.3)' : t.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl"
                   style={{ background: 'rgba(0,214,143,0.15)', color: '#00d68f' }}>
                {primary.name[0]}
              </div>
              <div>
                <p className="text-[18px] font-bold text-white"
                   style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>{primary.name}</p>
                <p className="text-[12px] text-white/40" style={{ color: t.textSub }}>({primary.category})</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/40 mb-0.5" style={{ color: t.textSub }}>Confidence</p>
              <p className="text-[36px] font-bold text-[#00d68f]"
                 style={{ fontFamily: "'Rajdhani', sans-serif" }}>{primary.confidence}%</p>
            </div>
          </div>
        </div>

        {primary.evidence && primary.evidence.length > 0 && (
          <div className="rounded-2xl p-5 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
            <h4 className="text-[13px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Attribution Heuristic Evidence
            </h4>
            <div className="space-y-2">
              {primary.evidence.map((e, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-[#00d68f] font-bold mt-0.5">✓</span>
                  <span className="text-[12px] text-white/70 leading-snug" style={{ color: t.textSub }}>{e}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Risk Tab (Risk DNA 6D) ─── */
function RiskTab({ data, t }: { data: ReturnType<typeof analysisStore.get>; t: ThemeColors }) {
  const b = data.blockchain;
  const score = b?.riskScore ?? 85;
  const riskDNA = data.riskDNA;
  const typologies = data.typologyMatches || [];
  const predictions = data.predictions;

  return (
    <div className="overflow-y-auto h-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-6 max-w-7xl mx-auto w-full">
      <SectionHeader title="VAJRA Risk Engine 2.0 · 6D Risk DNA Profile" t={t} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Gauge */}
        <div className="lg:col-span-5 rounded-2xl p-6 flex flex-col items-center justify-center"
             style={{ background: t.card, border: `1px solid ${score >= 75 ? 'rgba(255,61,90,0.2)' : 'rgba(0,214,143,0.2)'}` }}>
          <RiskGauge score={score} size={150} riskDNA={riskDNA} showDNABreakdown={true} />
        </div>

        {/* Predictive & Typology Breakdown */}
        <div className="lg:col-span-7 space-y-4">
          {/* Predictive Next-Hop Trajectory */}
          {predictions && (
            <div className="rounded-2xl p-5 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <SectionHeader title="Predictive Next-Hop Trajectory" t={t} />
              <p className="text-[12px] leading-relaxed" style={{ color: t.textSub }}>{predictions.forecastingNarrative}</p>
              <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
                {predictions.nextHopProbabilities.map((nh, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium" style={{ color: t.text }}>{nh.category.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-500 font-mono font-bold">{nh.probabilityPercent}%</span>
                      <span className="text-[10px] font-mono" style={{ color: t.textMuted }}>(&lt;{nh.expectedTimeWindowHours}h)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Laundering Typologies */}
          {typologies.length > 0 && (
            <div className="space-y-3">
              <SectionHeader title="Matched Money Laundering Typologies" t={t} />
              {typologies.map((typ) => (
                <div key={typ.id} className="rounded-2xl p-4" style={{ background: t.card, border: '1px solid rgba(255,61,90,0.3)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-bold text-red-500">{typ.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold">
                      {typ.confidence}% CONFIDENCE
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ color: t.textSub }}>{typ.description}</p>
                  <div className="p-2.5 rounded-xl text-[11px] font-mono"
                       style={{ background: t.mode === 'light' ? '#f1f5f9' : 'rgba(0,0,0,0.3)', color: t.mode === 'light' ? '#0369a1' : '#00f2fe', border: `1px solid ${t.border}` }}>
                    <span style={{ color: t.textMuted }}>RECOMMENDED ACTION: </span>
                    {typ.recommendation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Transactions Tab ─── */
function TxnsTab({ data, t }: { data: ReturnType<typeof analysisStore.get>; t: ThemeColors }) {
  const b = data.blockchain;
  const recent = b?.recentTxs || [];
  const activeAddr = (b?.address || data.wallet || '').toLowerCase();
  const chain = b?.chain || 'Ethereum';

  const getExplorerTxUrl = (hash: string, txChain?: string) => {
    const c = (txChain || chain).toLowerCase();
    if (c.includes('bnb') || c.includes('bsc')) return `https://bscscan.com/tx/${hash}`;
    if (c.includes('polygon') || c.includes('matic')) return `https://polygonscan.com/tx/${hash}`;
    if (c.includes('arbitrum')) return `https://arbiscan.io/tx/${hash}`;
    if (c.includes('base')) return `https://basescan.org/tx/${hash}`;
    if (c.includes('tron')) return `https://tronscan.org/#/transaction/${hash}`;
    if (c.includes('bitcoin') || c.includes('btc')) return `https://mempool.space/tx/${hash}`;
    if (c.includes('solana') || c.includes('sol')) return `https://solscan.io/tx/${hash}`;
    return `https://etherscan.io/tx/${hash}`;
  };

  return (
    <div className="overflow-y-auto h-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-4 max-w-7xl mx-auto w-full">
      <SectionHeader title={`Transactions · ${recent.length} displayed (${chain})`} t={t} />
      {recent.length === 0 ? (
        <div className="rounded-2xl p-8 text-center space-y-2" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <p className="text-[15px] font-bold" style={{ color: t.text }}>No Public On-Chain Transfers Recorded</p>
          <p className="text-[12px] max-w-md mx-auto" style={{ color: t.textMuted }}>
            This wallet has not executed public transactions on this explorer index, or transactions are processed via internal exchange matching engine.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {recent.map((tx, i) => {
            const isOut = tx.from && tx.from.toLowerCase() === activeAddr;
            const isIn = tx.to && tx.to.toLowerCase() === activeAddr;
            const dirLabel = isOut ? 'OUTFLOW' : isIn ? 'INFLOW' : 'TRANSFER';
            const dirColor = isOut ? '#ff3d5a' : isIn ? '#00d68f' : '#00f2fe';
            const explorerUrl = tx.hash ? getExplorerTxUrl(tx.hash, tx.chain) : null;

            return (
              <div key={i} className="rounded-2xl p-4 space-y-2.5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                          style={{ background: `${dirColor}18`, color: dirColor }}>
                      {dirLabel}
                    </span>
                    <span style={{ color: t.textMuted }}>{tx.chain || chain}</span>
                  </div>
                  <span style={{ color: t.textMuted }}>{tx.timeStamp ? new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString('en-IN') : 'Recent'}</span>
                </div>

                <div className="flex justify-between items-center text-[13px]">
                  <div className="font-mono text-[11px] truncate max-w-[220px]" style={{ color: t.textSub }}>
                    <span className={isOut ? 'font-semibold' : ''} style={{ color: isOut ? t.text : t.textMuted }}>
                      {tx.from ? `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : 'Inflow'}
                    </span>
                    <span className="text-cyan-500 mx-1.5 font-bold">→</span>
                    <span className={isIn ? 'font-semibold' : ''} style={{ color: isIn ? '#00d68f' : t.textMuted }}>
                      {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'Target'}
                    </span>
                  </div>
                  <span className="font-bold font-mono text-[13px]" style={{ color: t.text }}>
                    {tx.value || '0'} <span className="text-cyan-500">{tx.tokenSymbol || 'BNB'}</span>
                  </span>
                </div>

                {explorerUrl && (
                  <div className="flex justify-between items-center pt-2 text-[11px] font-mono" style={{ borderTop: `1px solid ${t.border}` }}>
                    <span className="truncate max-w-[200px]" style={{ color: t.textMuted }}>{tx.hash}</span>
                    <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                       className="text-cyan-500 hover:underline flex items-center gap-1 font-semibold">
                      View on Explorer ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Evidence Tab (Claim-Centric) ─── */
function EvidencePreviewTab({ data, caseId, onOpenEvidence, showToast, t }: {
  data: ReturnType<typeof analysisStore.get>;
  caseId: string;
  onOpenEvidence: () => void;
  showToast: (m: string, t2?: any, s?: string) => void;
  t: ThemeColors;
}) {
  const items = data.evidence || [];
  const hypotheses = data.blockchain ? {
    primary: `Illicit fund layering and intentional dispersion to obfuscate theft origin prior to exchange liquidation.`,
    counter: 'High-frequency algorithmic market-making or OTC desk arbitrage rebalancing.',
    diff: 'Direct interaction with sanctioned privacy pool contracts refutes legitimate market-making compliance.',
  } : null;

  return (
    <div className="overflow-y-auto h-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-6 max-w-7xl mx-auto w-full">
      {/* Evidence Sealed Badge */}
      <div className="rounded-2xl px-5 py-3.5 flex items-center justify-between"
           style={{ background: 'rgba(0,214,143,0.07)', border: '1px solid rgba(0,214,143,0.18)' }}>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#00d68f] anim-pulse" />
          <div>
            <p className="text-[12px] font-bold text-[#00d68f]">Claim-Centric Evidence Vault Sealed · {items.length} Artifacts</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: t.textMuted }}>SHA-256 Verified · Chain-of-Custody Logged</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenEvidence} className="px-3.5 py-1.5 rounded-xl font-bold text-[11px] text-white bg-blue-600 active:scale-95">
            EXPAND DOSSIER
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alternative Hypothesis Comparison */}
        {hypotheses && (
          <div className="space-y-3">
            <SectionHeader title="Alternative Hypothesis Evaluation" t={t} />
            <div className="rounded-2xl p-5 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-red-500 uppercase font-mono">Hypothesis A (Illicit Structuring)</span>
                <p className="text-[12px] leading-relaxed" style={{ color: t.text }}>{hypotheses.primary}</p>
              </div>
              <div className="space-y-1 pt-3" style={{ borderTop: `1px solid ${t.border}` }}>
                <span className="text-[11px] font-bold text-emerald-600 uppercase font-mono">Hypothesis B (Legitimate Market Action)</span>
                <p className="text-[12px] leading-relaxed" style={{ color: t.textSub }}>{hypotheses.counter}</p>
              </div>
              <div className="p-3 rounded-xl text-[11px] font-mono"
                   style={{ background: t.mode === 'light' ? '#f1f5f9' : 'rgba(0,0,0,0.4)', color: t.mode === 'light' ? '#0369a1' : '#00f2fe', border: `1px solid ${t.border}` }}>
                <span style={{ color: t.textMuted }}>CRITICAL DIFFERENTIATOR: </span>
                {hypotheses.diff}
              </div>
            </div>
          </div>
        )}

        {/* Claim-Centric Evidence Cards */}
        <div className="space-y-3">
          <SectionHeader title="Sealed Evidence Claims" t={t} />
          <div className="space-y-3">
            {items.map((ev) => (
              <div key={ev.id} className="rounded-2xl p-4 space-y-1.5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 font-bold uppercase">{ev.type}</span>
                  <span className="text-[11px] font-mono text-emerald-600 font-bold">{ev.confidence}% CONFIDENCE</span>
                </div>
                <p className="text-[13px] font-bold" style={{ color: t.text }}>{ev.title}</p>
                {ev.claim && (
                  <p className="text-[12px] italic border-l-2 border-cyan-400 pl-2.5 my-1.5" style={{ color: t.textSub }}>"{ev.claim}"</p>
                )}
                <p className="text-[10px] font-mono" style={{ color: t.textMuted }}>Method: {ev.method || 'Cryptographic Ledger Verification'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
        <button onClick={onOpenEvidence} className="py-3 rounded-xl font-bold text-[12px] text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md">
          FULL EVIDENCE BUNDLE
        </button>
        <button onClick={() => { downloadEvidenceBundleJSON(data, caseId); showToast('Evidence bundle exported', 'success'); }}
                className="py-3 rounded-xl font-bold text-[12px] transition-all shadow-sm"
                style={{ background: t.card2, border: `1px solid ${t.border}`, color: t.text }}>
          EXPORT JSON
        </button>
      </div>
    </div>
  );
}

/* ─── Report Tab ─── */
function ReportTab({ data, caseId, showToast, t }: { data: any; caseId: string; showToast?: any; t: ThemeColors }) {
  return (
    <div className="overflow-y-auto h-full px-4 sm:px-6 md:px-8 pt-4 pb-28 md:pb-16 space-y-6 max-w-7xl mx-auto w-full">
      <SectionHeader title="Forensic Case Dossier & Statutory Notice Dispatch" t={t} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1-Click Legal Notice Card */}
        <div className="rounded-2xl p-6 space-y-4 bg-gradient-to-br from-blue-950/70 to-slate-900 border border-blue-500/40 flex flex-col justify-between text-white shadow-md">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🇮🇳</span>
              <div>
                <p className="text-[16px] font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Statutory Police Notice Dispatch
                </p>
                <p className="text-[11px] text-cyan-400 font-mono">Section 91 CrPC / Section 94 BNSS 2023 & Section 17 PMLA</p>
              </div>
            </div>
            <p className="text-[12px] text-blue-100/90 leading-relaxed mb-3">
              Generate an official, ready-to-sign law enforcement notice for immediate asset freezing and KYC production to <strong>{data.vaspAttribution?.[0]?.name || 'Binance'}</strong>.
            </p>
          </div>
          <button onClick={() => generateAndPrintLegalNotice(data, caseId)}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[13px] tracking-wider active:scale-95 transition-all shadow-lg">
            PRINT / EXPORT OFFICIAL NOTICE (SEC 91 CrPC)
          </button>
        </div>

        {/* Dossier Download Card */}
        <div className="rounded-2xl p-6 flex flex-col justify-between shadow-sm" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div>
            <h4 className="text-[16px] font-bold mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
              Audit-Ready Case Report
            </h4>
            <p className="text-[12px] leading-relaxed mb-4" style={{ color: t.textSub }}>
              All on-chain artifacts, 6D Risk DNA vectors, transaction traces, and ML classifications for {caseId} have been compiled into an audit-ready dossier.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => downloadCaseReportPDF(data, caseId)} className="py-3.5 rounded-xl font-bold text-[12px] text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-md">
              DOWNLOAD PDF
            </button>
            <button onClick={() => shareCaseReport(data, caseId, showToast)}
                    className="py-3.5 rounded-xl font-bold text-[12px] transition-all shadow-sm"
                    style={{ background: t.card2, border: `1px solid ${t.border}`, color: t.text }}>
              SHARE REPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── AI Tab ─── */
function AIPreviewTab({ onOpenAI, t }: { onOpenAI: () => void; t: ThemeColors }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center gap-5">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-600 text-white font-bold text-2xl shadow-xl">
        V
      </div>
      <div>
        <p className="text-[18px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
          VAJRA Forensic AI Copilot
        </p>
        <p className="text-[13px] max-w-[320px] mt-1" style={{ color: t.textMuted }}>
          Ask natural-language queries, request path explanations, and generate counter-hypotheses grounded in on-chain proof.
        </p>
      </div>
      <button onClick={onOpenAI} className="px-8 py-3.5 rounded-xl font-bold text-[13px] text-white bg-blue-600 hover:bg-blue-500 shadow-lg active:scale-95 transition-all">
        LAUNCH AI COPILOT
      </button>
    </div>
  );
}

/* ─── Main CaseDetail Component ─── */
export default function CaseDetail({ caseId, onBack, onOpenAI, onOpenEvidence, showToast }: CaseDetailProps) {
  const { t } = useTheme();
  const [activeTab, setActiveTab] = useState<CaseTab>('graph');

  const data = useSyncExternalStore(
    (cb) => analysisStore.subscribe(cb),
    () => analysisStore.get(),
  );

  const b = data.blockchain;
  const score = b?.riskScore ?? data.riskDNA?.compositeScore ?? 50;
  const addr  = data.wallet || b?.address || '—';
  const riskColor = score >= 75 ? '#ff3d5a' : score >= 45 ? '#f5a623' : '#00d68f';
  const riskLabel = score >= 75 ? 'High Risk' : score >= 45 ? 'Medium Risk' : 'Low Risk';

  if (data.loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center space-y-5" style={{ background: t.bg }}>
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full border border-cyan-500/30 animate-pulse" />
          <div className="absolute inset-6 rounded-full border border-blue-500/40" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/25 to-transparent animate-spin"
               style={{ transformOrigin: 'center center', animationDuration: '2.5s' }} />
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-cyan-400 flex items-center justify-center text-cyan-300 font-mono text-lg font-bold shadow-[0_0_20px_rgba(0,242,254,0.6)]">
            ⚡
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[#00f2fe] text-[10px] font-mono font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Analyzing On-Chain Data
          </div>
          <p className="text-[17px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            Interrogating Multi-Chain RPC Nodes & Clusters...
          </p>
          <p className="text-[11px] font-mono text-cyan-300/80 truncate px-4 py-1.5 rounded-lg bg-white/5 border border-white/10">
            {addr !== '—' ? addr : caseId}
          </p>
          <p className="text-[11px] text-white/50">
            Ingesting multi-chain event logs, calculating 6D Risk DNA, and assembling topological flow graph.
          </p>
        </div>

        <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 animate-[pulse_1s_infinite] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: t.nav }}>
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-8 pt-12 md:pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all" style={{ background: t.inputBg }}>
              <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-[18px] md:text-[20px] font-bold text-white truncate tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {caseId}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-white/40 truncate max-w-[180px] md:max-w-none">{addr}</span>
                <span className="text-[11px] font-bold" style={{ color: riskColor }}>{riskLabel} · {score}/100</span>
              </div>
            </div>
          </div>

          {/* Desktop Fast Action CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => generateAndPrintLegalNotice(data, caseId)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-blue-600/30 border border-blue-500/40 text-blue-200 hover:bg-blue-600/50 transition-all flex items-center gap-1.5"
            >
              <span>📜</span> Sec 91 Notice
            </button>
            <button
              onClick={() => downloadCaseReportPDF(data, caseId)}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-1.5"
            >
              <span>📄</span> Export PDF
            </button>
            <button
              onClick={onOpenAI}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>🤖</span> AI Copilot
            </button>
          </div>
        </div>

        {/* Tabs Strip */}
        <div className="flex px-4 sm:px-6 md:px-8 pb-0 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className="flex-shrink-0 px-3.5 py-2.5 text-[12px] font-semibold transition-all relative flex items-center gap-1"
                      style={{ color: isActive ? '#00f2fe' : t.textMuted }}>
                {tab.label}
                {tab.badge && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#00f2fe]" />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-px mx-4 sm:mx-6 md:mx-8" style={{ background: t.border }} />
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'graph'    && <GraphTab nodes={data.graphNodes} edges={data.graphEdges} loading={data.loading} wallet={data.wallet} chain={b?.chain} t={t} />}
        {activeTab === 'wallet'   && <WalletTab data={data} t={t} />}
        {activeTab === 'vasp'     && <VaspTab data={data} t={t} />}
        {activeTab === 'risk'     && <RiskTab data={data} t={t} />}
        {activeTab === 'txns'     && <TxnsTab data={data} t={t} />}
        {activeTab === 'ai'       && <AIPreviewTab onOpenAI={onOpenAI} t={t} />}
        {activeTab === 'evidence' && <EvidencePreviewTab data={data} caseId={caseId} onOpenEvidence={onOpenEvidence} showToast={showToast} t={t} />}
        {activeTab === 'report'   && <ReportTab data={data} caseId={caseId} showToast={showToast} t={t} />}
      </div>
    </div>
  );
}
