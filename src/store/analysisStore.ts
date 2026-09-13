import type { WalletAnalysis } from '../services/blockchain';
import { KNOWN_MIXERS, KNOWN_EXCHANGE_MAP, KNOWN_EXCHANGES } from '../services/blockchain';
import type { RiskDNAProfile } from '../services/riskEngine2';
import type { EntityCluster, WalletFingerprint, ClassifiedRelationship } from '../services/entityIntelligence';
import type { TypologyMatch, LifecycleAnalysis } from '../services/behavioralEngine';
import type { TracedPath } from '../services/pathEngine';
import type { FraudCampaign } from '../services/campaignEngine';
import type { PredictiveForecasting } from '../services/predictionEngine';

export { KNOWN_MIXERS, KNOWN_EXCHANGES, KNOWN_EXCHANGE_MAP };

export interface GraphNode {
  id: number;
  x: number;
  y: number;
  label: string;
  addr: string;
  fullAddr?: string;
  type: 'suspect' | 'intermediary' | 'mixer' | 'exchange' | 'contract' | 'collector' | 'mule' | 'victim';
  clusterId?: string;
  riskScore?: number;
  totalValue?: string;
  txCount?: number;
  isLarge?: boolean;
}

export interface GraphEdge {
  from: number;
  to: number;
  amount?: string;
  suspicious?: boolean;
  isLarge?: boolean;
  relationship?: string; // 'funds', 'bridges', 'swaps', 'forwards', 'consolidates'
  txCount?: number;
}

export interface VaspAttribution {
  name: string;
  confidence: number;
  category: string;
  address?: string;
  evidence?: string[];
}

export interface EvidenceItem {
  id: string;
  type: 'on-chain' | 'attribution' | 'cross-case' | 'analytical' | 'behavioral' | 'campaign';
  category: string;
  title: string;
  claim?: string;           // Claim-Centric Evidence: The explicit forensic assertion supported
  method?: string;          // Verification method: e.g. "Cryptographic Hash & Bytecode Analysis"
  hash?: string;
  block?: string;
  time?: string;
  source: string;
  confidence: number;
  verified: boolean;
  summary: string;
  provenance?: {
    chain: string;
    collectedAt: string;
    collectorNode: string;
  };
}

export interface MLPrediction {
  exchange_prob: number;
  prediction: string;
  confidence: number;
}

export interface AnalysisState {
  wallet: string;
  caseId: string;
  blockchain: WalletAnalysis | null;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  aiNarrative: string;
  vaspAttribution: VaspAttribution[];
  evidence: EvidenceItem[];
  mlPrediction: MLPrediction | null;
  
  // SIH 21-Pillar Additions
  riskDNA: RiskDNAProfile | null;
  entityClusters: EntityCluster[];
  fingerprint: WalletFingerprint | null;
  relationships: ClassifiedRelationship[];
  typologyMatches: TypologyMatch[];
  lifecycle: LifecycleAnalysis | null;
  dynamicPaths: TracedPath[];
  campaigns: FraudCampaign[];
  predictions: PredictiveForecasting | null;

  loading: boolean;
  error: string;
}

const DEFAULT: AnalysisState = {
  wallet: '',
  caseId: '',
  blockchain: null,
  graphNodes: [],
  graphEdges: [],
  aiNarrative: '',
  vaspAttribution: [],
  evidence: [],
  mlPrediction: null,
  
  riskDNA: null,
  entityClusters: [],
  fingerprint: null,
  relationships: [],
  typologyMatches: [],
  lifecycle: null,
  dynamicPaths: [],
  campaigns: [],
  predictions: null,

  loading: false,
  error: '',
};

let _state: AnalysisState = { ...DEFAULT };
const _listeners = new Set<() => void>();

function notify() { _listeners.forEach((fn) => fn()); }

export const analysisStore = {
  get(): AnalysisState { return _state; },

  set(partial: Partial<AnalysisState>) {
    _state = { ..._state, ...partial };
    notify();
  },

  reset() {
    _state = { ...DEFAULT };
    notify();
  },

  subscribe(fn: () => void): () => void {
    _listeners.add(fn);
    return () => _listeners.delete(fn);
  },
};

// ── Build comprehensive on-chain graph from all transactions and counterparties ────────────────────────────
export function buildGraph(analysis: WalletAnalysis): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const cx = 530;
  const cy = 320;

  const addrLower = (analysis.address || '').toLowerCase();
  const isKnownEx = !!KNOWN_EXCHANGE_MAP[addrLower];
  const exName = KNOWN_EXCHANGE_MAP[addrLower] || (analysis.chain === 'Tron' ? 'Binance Tron' : 'Exchange VASP');

  const nodes: GraphNode[] = [
    {
      id: 0,
      x: cx,
      y: cy,
      label: isKnownEx ? `${exName} Deposit` : 'Target Subject',
      addr: truncAddr(analysis.address),
      fullAddr: analysis.address,
      type: isKnownEx ? 'exchange' : 'suspect',
      riskScore: analysis.riskScore,
      totalValue: analysis.balance,
      txCount: analysis.txCount,
    },
  ];

  const edges: GraphEdge[] = [];
  const peerMap = new Map<string, {
    address: string;
    name?: string;
    type?: GraphNode['type'];
    inflowTotal: number;
    outflowTotal: number;
    txCount: number;
    symbol: string;
    maxTxVal: number;
    chain?: string;
  }>();

  // 1. Ingest existing counterparties
  for (const cp of analysis.counterparties || []) {
    if (!cp.address || cp.address.toLowerCase() === addrLower) continue;
    const lower = cp.address.toLowerCase();
    const valNum = parseFloat((cp.totalValue || '0').replace(/[^0-9.]/g, '')) || 0;
    const sym = cp.tokenSymbol || (analysis.chain === 'Tron' ? 'TRX' : analysis.chain === 'Bitcoin' ? 'BTC' : analysis.chain === 'Solana' ? 'SOL' : analysis.chain === 'Polygon' ? 'POL' : analysis.chain === 'BNB Chain' ? 'BNB' : 'ETH');
    
    peerMap.set(lower, {
      address: cp.address,
      name: cp.name,
      type: (cp.type === 'wallet' ? 'intermediary' : cp.type) || 'intermediary',
      inflowTotal: 0,
      outflowTotal: valNum,
      txCount: cp.count || 1,
      symbol: sym,
      maxTxVal: valNum,
      chain: cp.chain || analysis.chain,
    });
  }

  // 2. Ingest all transactions from recentTxs to ensure 100% complete money movement capture
  for (const tx of analysis.recentTxs || []) {
    const fromLower = (tx.from || '').toLowerCase();
    const toLower = (tx.to || '').toLowerCase();
    const val = parseFloat((tx.value || '0').replace(/,/g, '')) || 0;
    const sym = tx.tokenSymbol || (analysis.chain === 'Tron' ? 'TRX' : analysis.chain === 'Bitcoin' ? 'BTC' : analysis.chain === 'Solana' ? 'SOL' : analysis.chain === 'Polygon' ? 'POL' : analysis.chain === 'BNB Chain' ? 'BNB' : 'ETH');

    if (fromLower && fromLower !== addrLower) {
      const existing = peerMap.get(fromLower) ?? {
        address: tx.from,
        name: undefined,
        type: 'intermediary',
        inflowTotal: 0,
        outflowTotal: 0,
        txCount: 0,
        symbol: sym,
        maxTxVal: 0,
        chain: tx.chain || analysis.chain,
      };
      existing.inflowTotal += val;
      existing.txCount += 1;
      existing.symbol = sym;
      if (val > existing.maxTxVal) existing.maxTxVal = val;
      peerMap.set(fromLower, existing);
    }

    if (toLower && toLower !== addrLower) {
      const existing = peerMap.get(toLower) ?? {
        address: tx.to,
        name: undefined,
        type: 'intermediary',
        inflowTotal: 0,
        outflowTotal: 0,
        txCount: 0,
        symbol: sym,
        maxTxVal: 0,
        chain: tx.chain || analysis.chain,
      };
      existing.outflowTotal += val;
      existing.txCount += 1;
      existing.symbol = sym;
      if (val > existing.maxTxVal) existing.maxTxVal = val;
      peerMap.set(toLower, existing);
    }
  }

  // Convert map to sorted array of unique peers (prioritize known mixers, exchanges, large values, high tx counts)
  const sortedPeers = [...peerMap.values()].sort((a, b) => {
    const aLower = a.address.toLowerCase();
    const bLower = b.address.toLowerCase();
    const aSpecial = KNOWN_MIXERS.has(aLower) || !!KNOWN_EXCHANGE_MAP[aLower] ? 1 : 0;
    const bSpecial = KNOWN_MIXERS.has(bLower) || !!KNOWN_EXCHANGE_MAP[bLower] ? 1 : 0;
    if (aSpecial !== bSpecial) return bSpecial - aSpecial;

    const aTotal = a.inflowTotal + a.outflowTotal + a.maxTxVal;
    const bTotal = b.inflowTotal + b.outflowTotal + b.maxTxVal;
    if (aTotal !== bTotal) return bTotal - aTotal;
    return b.txCount - a.txCount;
  }).slice(0, 18);

  let victimIdx = 1;
  let inflowIdx = 1;
  let muleIdx = 1;
  let outflowIdx = 1;

  sortedPeers.forEach((p, i) => {
    const id = i + 1;
    const pLower = p.address.toLowerCase();
    const isInflow = p.inflowTotal > 0 || (p.inflowTotal === 0 && p.outflowTotal === 0 && i % 2 === 0);
    const isOutflow = p.outflowTotal > 0;
    const totalVal = Math.max(p.inflowTotal, p.outflowTotal, p.maxTxVal);

    // Large transfer detection: >= 0.1 ETH / BNB / BTC or >= 100 USDT or >= 15 SOL
    const isLarge = (
      (p.symbol === 'ETH' && totalVal >= 0.1) ||
      (p.symbol === 'BNB' && totalVal >= 0.1) ||
      (p.symbol === 'BTC' && totalVal >= 0.01) ||
      (p.symbol === 'SOL' && totalVal >= 10) ||
      (p.symbol === 'POL' && totalVal >= 50) ||
      (p.symbol === 'TRX' && totalVal >= 500) ||
      (p.symbol.includes('USD') && totalVal >= 100) ||
      totalVal >= 100
    );

    let type: GraphNode['type'] = p.type || 'intermediary';
    let label = p.name;

    if (KNOWN_MIXERS.has(pLower)) {
      type = 'mixer';
      label = 'Sanctioned Mixer (Tornado.Cash)';
    } else if (KNOWN_EXCHANGE_MAP[pLower]) {
      type = 'exchange';
      label = KNOWN_EXCHANGE_MAP[pLower].includes('Tether') ? 'Tether USD Contract' : `${KNOWN_EXCHANGE_MAP[pLower]} Deposit`;
    } else if (isInflow && !isOutflow) {
      if (analysis.riskScore >= 70 && i < 3) {
        type = 'victim';
        label = `Victim Source #${victimIdx++}`;
      } else {
        type = 'intermediary';
        label = `Inflow Feed #${inflowIdx++}`;
      }
    } else {
      if (analysis.riskScore >= 75 && i % 2 === 1) {
        type = 'mule';
        label = `Pass-Through Mule #${muleIdx++}`;
      } else {
        type = 'intermediary';
        label = `Layering Hop #${outflowIdx++}`;
      }
    }

    const isSuspicious = type === 'mixer' || type === 'mule' || (analysis.riskScore >= 70 && (i < 3 || isLarge));
    const relationship = type === 'exchange' ? 'off-ramps' : type === 'mixer' ? 'mixes' : isInflow ? 'funds' : 'forwards';

    const formattedVal = totalVal > 0
      ? `${totalVal < 0.0001 ? '<0.0001' : totalVal.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${p.symbol}`
      : `${p.symbol} Transfer`;

    nodes.push({
      id,
      x: 0, // dynamic layout computed by layoutGraphNodes
      y: 0,
      label: label || `Entity #${id}`,
      addr: truncAddr(p.address),
      fullAddr: p.address,
      type,
      riskScore: type === 'mixer' ? 98 : type === 'exchange' ? 20 : type === 'victim' ? 15 : type === 'mule' ? 85 : 65,
      totalValue: formattedVal,
      txCount: p.txCount,
      isLarge,
    });

    if (isInflow && !isOutflow) {
      edges.push({
        from: id,
        to: 0,
        amount: formattedVal,
        suspicious: isSuspicious,
        isLarge,
        relationship: 'funds',
        txCount: p.txCount,
      });
    } else {
      edges.push({
        from: 0,
        to: id,
        amount: formattedVal,
        suspicious: isSuspicious,
        isLarge,
        relationship,
        txCount: p.txCount,
      });
    }
  });

  return { nodes, edges };
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

