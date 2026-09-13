import type { WalletAnalysis, PortfolioAsset } from '../services/blockchain';
import type { GraphNode, GraphEdge, VaspAttribution, EvidenceItem, MLPrediction } from './analysisStore';
import { buildGraph } from './analysisStore';
import type { RiskDNAProfile } from '../services/riskEngine2';
import type { EntityCluster, WalletFingerprint, ClassifiedRelationship } from '../services/entityIntelligence';
import type { TypologyMatch, LifecycleAnalysis } from '../services/behavioralEngine';
import type { TracedPath } from '../services/pathEngine';
import type { FraudCampaign } from '../services/campaignEngine';
import type { PredictiveForecasting } from '../services/predictionEngine';

export interface AlternativeHypothesisEvaluation {
  primaryHypothesis: string;
  primaryConfidence: number;
  counterHypothesis: string;
  counterConfidence: number;
  criticalDifferentiator: string;
}

export interface CaseRecord {
  id: string;
  title: string;
  wallet: string;
  chain: string;
  riskScore: number;
  riskLevel: 'High Risk' | 'Medium Risk' | 'Low Risk';
  riskKey: 'high' | 'med' | 'low';
  typology: string;
  txCount: number;
  balance: string;
  balanceUSD: string;
  portfolio?: PortfolioAsset[];
  blockchain: WalletAnalysis | null;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  aiNarrative: string;
  vaspAttribution: VaspAttribution[];
  evidence: EvidenceItem[];
  mlPrediction: MLPrediction | null;
  
  // SIH 21-Pillar Fields
  riskDNA?: RiskDNAProfile;
  entityClusters?: EntityCluster[];
  fingerprint?: WalletFingerprint;
  relationships?: ClassifiedRelationship[];
  typologyMatches?: TypologyMatch[];
  lifecycle?: LifecycleAnalysis;
  dynamicPaths?: TracedPath[];
  campaigns?: FraudCampaign[];
  predictions?: PredictiveForecasting;
  hypotheses?: AlternativeHypothesisEvaluation;

  createdAt: string;
  timeAgo: string;
  status: 'ACTIVE' | 'FLAGGED' | 'RESOLVED';
}

const STORAGE_KEY = 'vajra_cases_registry_v7';

const INITIAL_CASES: CaseRecord[] = [
  {
    id: 'INV-2024-00128',
    title: 'Cross-Border Layering & Binance Off-Ramp',
    wallet: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14',
    chain: 'Ethereum',
    riskScore: 85,
    riskLevel: 'High Risk',
    riskKey: 'high',
    typology: 'High-Risk — Multi-Hop Pass-Through & Structuring',
    txCount: 86,
    balance: '0.0028 ETH',
    balanceUSD: '$9.78',
    blockchain: {
      address: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14',
      chain: 'Ethereum',
      balance: '0.0028 ETH',
      balanceUSD: '$9.78',
      txCount: 86,
      firstSeen: '12/03/2024',
      lastSeen: '18/04/2024',
      recentTxs: [
        { hash: '0x9d0532bf8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af38162', from: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', to: '0x75855a2c5cd3de7c7d7d1a0fa9a9e5dbcc6eed87', value: '2.5000', timeStamp: '1713429600', tokenSymbol: 'ETH', chain: 'Ethereum' },
        { hash: '0x8e1245ff7392bcda7145db4617fc97c04c13a7fefc827e0d6f89a5417af39999', from: '0x9a3e28bc45d0e540f866974c1b52ebbc51ab412', to: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', value: '3.4500', timeStamp: '1713410000', tokenSymbol: 'ETH', chain: 'Ethereum' },
        { hash: '0x7c9133ee8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af38811', from: '0x1f8212bc45d0e540f866974c1b52ebbc51ac77a', to: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', value: '2.8000', timeStamp: '1713405000', tokenSymbol: 'ETH', chain: 'Ethereum' },
        { hash: '0x6a8255aa8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af37722', from: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', to: '0x722122df12d4e14e13ac3b6895a86e84145b6967', value: '3.1000', timeStamp: '1713390000', tokenSymbol: 'ETH', chain: 'Ethereum' },
        { hash: '0x5b7166bb8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af36633', from: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', to: '0x3a6f9128bc45d0e540f866974c1b52ebbc51a8f21', value: '1.4500', timeStamp: '1713380000', tokenSymbol: 'ETH', chain: 'Ethereum' },
        { hash: '0x4a6177cc8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af35544', from: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', to: '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', value: '1.8000', timeStamp: '1713370000', tokenSymbol: 'ETH', chain: 'Ethereum' },
      ],
      riskScore: 85,
      riskFactors: [
        'Interaction with OFAC-sanctioned mixer contract (Tornado Cash)',
        'High fan-out structuring: rapid disbursement to 10+ intermediaries',
        'Burst transactions: 6+ transfers executed within 60-second intervals',
        'Direct consolidation into centralized exchange (Binance / Bybit / OKX) deposit addresses',
      ],
      typology: 'High-Risk — Multi-Hop Pass-Through & Structuring',
      counterparties: [
        { address: '0x9a3e28bc45d0e540f866974c1b52ebbc51ab412', count: 18, totalValue: '3.4500 ETH', type: 'wallet', name: 'Victim Source #1', chain: 'Ethereum' },
        { address: '0x1f8212bc45d0e540f866974c1b52ebbc51ac77a', count: 12, totalValue: '2.8000 ETH', type: 'wallet', name: 'Victim Source #2', chain: 'Ethereum' },
        { address: '0x4c2199dd8205ebba6155db4617fc97c04c13a7fe', count: 9,  totalValue: '1.1500 ETH', type: 'wallet', name: 'P2P Funding Source', chain: 'Ethereum' },
        { address: '0x88bb33aa8205ebba6155db4617fc97c04c13a7fe', count: 7,  totalValue: '0.9500 ETH', type: 'wallet', name: 'Layering Transit Feed', chain: 'Ethereum' },
        { address: '0x722122df12d4e14e13ac3b6895a86e84145b6967', count: 14, totalValue: '3.1000 ETH', type: 'mixer', name: 'Sanctioned Mixer (Tornado.Cash)', chain: 'Ethereum' },
        { address: '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b', count: 8,  totalValue: '1.7500 ETH', type: 'contract', name: 'Obfuscation Smart Contract', chain: 'Ethereum' },
        { address: '0x3a6f9128bc45d0e540f866974c1b52ebbc51a8f21', count: 16, totalValue: '1.4500 ETH', type: 'wallet', name: 'Pass-Through Mule #1', chain: 'Ethereum' },
        { address: '0x1b72799f8205ebba6155db4617fc97c04c13a7fe', count: 11, totalValue: '0.8000 ETH', type: 'wallet', name: 'Pass-Through Mule #2', chain: 'Ethereum' },
        { address: '0x55aa11228205ebba6155db4617fc97c04c13a7fe', count: 15, totalValue: '2.2000 ETH', type: 'wallet', name: 'Syndicate Collector Hub', chain: 'Ethereum' },
        { address: '0x66cc44ff8205ebba6155db4617fc97c04c13a7fe', count: 6,  totalValue: '1.0500 ETH', type: 'wallet', name: 'Multi-Sig Escrow', chain: 'Ethereum' },
        { address: '0x75855a2c5cd3de7c7d7d1a0fa9a9e5dbcc6eed87', count: 24, totalValue: '2.5000 ETH', type: 'exchange', name: 'Binance Deposit Gateway', chain: 'Ethereum' },
        { address: '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', count: 19, totalValue: '1.8000 ETH', type: 'exchange', name: 'Binance Cold Storage', chain: 'Ethereum' },
        { address: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9', count: 10, totalValue: '1.2500 ETH', type: 'exchange', name: 'Bybit Gateway', chain: 'Ethereum' },
        { address: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', count: 8,  totalValue: '0.9000 ETH', type: 'exchange', name: 'OKX Liquidity Pool', chain: 'Ethereum' },
      ],
    },
    graphNodes: [
      { id: 0,  x: 530, y: 320, label: 'Suspect Target', addr: '0x75b1...5c14', fullAddr: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', type: 'suspect', riskScore: 85, totalValue: '0.0028 ETH', txCount: 86 },
      { id: 1,  x: 140, y: 130, label: 'Victim Source #1', addr: '0x9a3e...b412', fullAddr: '0x9a3e28bc45d0e540f866974c1b52ebbc51ab412', type: 'victim', riskScore: 15, totalValue: '3.4500 ETH', isLarge: true, txCount: 18 },
      { id: 2,  x: 280, y: 165, label: 'Victim Source #2', addr: '0x1f82...c77a', fullAddr: '0x1f8212bc45d0e540f866974c1b52ebbc51ac77a', type: 'victim', riskScore: 15, totalValue: '2.8000 ETH', isLarge: true, txCount: 12 },
      { id: 3,  x: 140, y: 340, label: 'P2P Funding Source', addr: '0x4c21...a7fe', fullAddr: '0x4c2199dd8205ebba6155db4617fc97c04c13a7fe', type: 'intermediary', riskScore: 45, totalValue: '1.1500 ETH', isLarge: true, txCount: 9 },
      { id: 4,  x: 280, y: 480, label: 'Layering Transit Feed', addr: '0x88bb...a7fe', fullAddr: '0x88bb33aa8205ebba6155db4617fc97c04c13a7fe', type: 'intermediary', riskScore: 65, totalValue: '0.9500 ETH', isLarge: true, txCount: 7 },
      { id: 5,  x: 410, y: 90,  label: 'Sanctioned Mixer (Tornado.Cash)', addr: '0x7221...6967', fullAddr: '0x722122df12d4e14e13ac3b6895a86e84145b6967', type: 'mixer', riskScore: 98, totalValue: '3.1000 ETH', isLarge: true, txCount: 14 },
      { id: 6,  x: 650, y: 90,  label: 'Obfuscation Smart Contract', addr: '0xd882...344b', fullAddr: '0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b', type: 'contract', riskScore: 82, totalValue: '1.7500 ETH', isLarge: true, txCount: 8 },
      { id: 7,  x: 380, y: 550, label: 'Pass-Through Mule #1', addr: '0x3a6f...8f21', fullAddr: '0x3a6f9128bc45d0e540f866974c1b52ebbc51a8f21', type: 'mule', riskScore: 85, totalValue: '1.4500 ETH', isLarge: true, txCount: 16 },
      { id: 8,  x: 530, y: 550, label: 'Pass-Through Mule #2', addr: '0x1b72...a7fe', fullAddr: '0x1b72799f8205ebba6155db4617fc97c04c13a7fe', type: 'mule', riskScore: 80, totalValue: '0.8000 ETH', isLarge: true, txCount: 11 },
      { id: 9,  x: 680, y: 550, label: 'Syndicate Collector Hub', addr: '0x55aa...a7fe', fullAddr: '0x55aa11228205ebba6155db4617fc97c04c13a7fe', type: 'collector', riskScore: 92, totalValue: '2.2000 ETH', isLarge: true, txCount: 15 },
      { id: 10, x: 920, y: 130, label: 'Binance Deposit Gateway', addr: '0x7585...ed87', fullAddr: '0x75855a2c5cd3de7c7d7d1a0fa9a9e5dbcc6eed87', type: 'exchange', riskScore: 25, totalValue: '2.5000 ETH', isLarge: true, txCount: 24 },
      { id: 11, x: 780, y: 165, label: 'Binance Cold Storage', addr: '0x47ac...d503', fullAddr: '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503', type: 'exchange', riskScore: 20, totalValue: '1.8000 ETH', isLarge: true, txCount: 19 },
      { id: 12, x: 920, y: 340, label: 'Bybit Gateway', addr: '0xf89d...20f9', fullAddr: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9', type: 'exchange', riskScore: 25, totalValue: '1.2500 ETH', isLarge: true, txCount: 10 },
      { id: 13, x: 780, y: 480, label: 'OKX Liquidity Pool', addr: '0x6cc5...da7b', fullAddr: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', type: 'exchange', riskScore: 25, totalValue: '0.9000 ETH', isLarge: true, txCount: 8 },
    ],
    graphEdges: [
      { from: 1, to: 0, amount: '3.4500 ETH', suspicious: false, isLarge: true, relationship: 'funds', txCount: 18 },
      { from: 2, to: 0, amount: '2.8000 ETH', suspicious: false, isLarge: true, relationship: 'funds', txCount: 12 },
      { from: 3, to: 0, amount: '1.1500 ETH', suspicious: false, isLarge: true, relationship: 'funds', txCount: 9 },
      { from: 4, to: 0, amount: '0.9500 ETH', suspicious: false, isLarge: true, relationship: 'funds', txCount: 7 },
      { from: 0, to: 5, amount: '3.1000 ETH', suspicious: true,  isLarge: true, relationship: 'mixes', txCount: 14 },
      { from: 0, to: 6, amount: '1.7500 ETH', suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 8 },
      { from: 0, to: 7, amount: '1.4500 ETH', suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 16 },
      { from: 0, to: 8, amount: '0.8000 ETH', suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 11 },
      { from: 0, to: 9, amount: '2.2000 ETH', suspicious: true,  isLarge: true, relationship: 'consolidates', txCount: 15 },
      { from: 0, to: 10, amount: '2.5000 ETH', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 24 },
      { from: 0, to: 11, amount: '1.8000 ETH', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 19 },
      { from: 0, to: 12, amount: '1.2500 ETH', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 10 },
      { from: 0, to: 13, amount: '0.9000 ETH', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 8 },
    ],
    aiNarrative: 'The suspect address 0x75b1...5c14 shows distinct structuring and rapid pass-through behavior on Ethereum. Funds totaling 7.40 ETH were ingested from multiple victim accounts, layered through sanctioned privacy protocol Tornado.Cash (0x7221...6967) and transit mules, before being liquidated across Binance (0x7585...ed87), Bybit, and OKX deposit gateways.',
    vaspAttribution: [
      { name: 'Binance', confidence: 94, category: 'Centralized Exchange (CEX)', address: '0x75855a2c5cd3de7c7d7d1a0fa9a9e5dbcc6eed87', evidence: ['Direct high-value fund transfers totaling 4.30 ETH to verified Binance deposit architecture.'] },
      { name: 'Bybit', confidence: 86, category: 'Centralized Exchange (CEX)', address: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9' },
      { name: 'OKX', confidence: 78, category: 'Centralized Exchange (CEX)', address: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b' },
    ],
    riskDNA: {
      compositeScore: 85,
      confidenceScore: 94,
      level: 'CRITICAL',
      vector: { amlRisk: 88, mixerExposure: 95, behavioralRisk: 82, networkRisk: 86, scamRisk: 74, crossChainRisk: 68 },
      factors: [
        { name: 'Sanctioned Privacy Mixer Interaction', category: 'mixerExposure', contributionPercent: 35, severity: 'CRITICAL', description: 'Direct cryptographic deposit of 3.10 ETH into Tornado Cash pool.' },
        { name: 'Rapid Layering Pass-Through', category: 'amlRisk', contributionPercent: 28, severity: 'HIGH', description: '10+ outbound splits within 4 minutes across mules.' },
        { name: 'Direct VASP Ingestion', category: 'networkRisk', contributionPercent: 22, severity: 'HIGH', description: 'Consolidation into Binance and Bybit hot wallets.' },
      ],
      attenuatedRiskByHop: [85, 68, 45, 25, 12, 5],
      explainableSummary: 'High-risk Ethereum layering typology with sanctioned mixer interaction and multi-exchange off-ramping.',
    },
    evidence: [
      {
        id: 'EV-001',
        type: 'on-chain',
        category: 'Transaction Record',
        title: 'Direct VASP Off-Ramp Transfer',
        claim: 'Wallet transferred 2.5000 ETH directly into Binance institutional deposit architecture.',
        method: 'On-chain transaction hash cryptographic verification',
        hash: '0x9d0532bf8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af38162',
        source: 'Etherscan Mainnet',
        confidence: 99,
        verified: true,
        summary: 'Transfer of funds to Binance deposit address.'
      },
      {
        id: 'EV-002',
        type: 'attribution',
        category: 'Cluster Identification',
        title: 'Exchange Cluster Match: Binance',
        claim: 'Receiving node is part of Binance institutional liquidity pool cluster.',
        method: 'VASP deposit sweep clustering algorithm & LightGBM inference',
        source: 'VAJRA ML Classifier',
        confidence: 92,
        verified: true,
        summary: 'High-confidence attribution to Binance institutional liquidity cluster.'
      },
    ],
    mlPrediction: { exchange_prob: 0.941, prediction: 'Exchange / VASP Cluster', confidence: 94 },
    hypotheses: {
      primaryHypothesis: 'Illicit fund layering and intentional dispersion to obfuscate theft origin prior to exchange liquidation.',
      primaryConfidence: 85,
      counterHypothesis: 'High-frequency algorithmic market-making or OTC desk arbitrage rebalancing.',
      counterConfidence: 15,
      criticalDifferentiator: 'Direct interaction with sanctioned Tornado Cash mixer contract 0x7221...6967 refutes legitimate market-making compliance.',
    },
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    timeAgo: '2h ago',
    status: 'ACTIVE',
  },
  {
    id: 'INV-2024-00127',
    title: 'TRC-20 USDT High-Volume Movement',
    wallet: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE',
    chain: 'Tron',
    riskScore: 68,
    riskLevel: 'Medium Risk',
    riskKey: 'med',
    typology: 'Moderate Risk — Transit & Intermediary Structuring',
    txCount: 42,
    balance: '1,420.50 TRX · 25,000.00 USDT',
    balanceUSD: '$25,220.17',
    blockchain: {
      address: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE',
      chain: 'Tron',
      balance: '1,420.50 TRX · 25,000.00 USDT',
      balanceUSD: '$25,220.17',
      txCount: 42,
      firstSeen: '14/02/2024',
      lastSeen: '19/04/2024',
      recentTxs: [
        { hash: 'e5f2a1b9487c96d5a1b9487c96d5a1b9487c96d5a1b9487c96d5a1b9487c96d5', from: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE', to: 'T9yD14Nj9j7xABh4DhGxkzhBV3MhPRgXPr', value: '12000', timeStamp: '1713490000', tokenSymbol: 'USDT', chain: 'Tron' },
        { hash: 'f6e3b2c8598d07e6b2c8598d07e6b2c8598d07e6b2c8598d07e6b2c8598d07e6', from: 'TJxy48Nj9j7xABh4DhGxkzhBV3MhPRg8KLa', to: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE', value: '15000', timeStamp: '1713480000', tokenSymbol: 'USDT', chain: 'Tron' },
        { hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2', from: 'TAbc88Nj9j7xABh4DhGxkzhBV3MhPRg11AA', to: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE', value: '8500',  timeStamp: '1713470000', tokenSymbol: 'USDT', chain: 'Tron' },
      ],
      riskScore: 68,
      riskFactors: [
        'High-value TRC-20 USDT rapid smart contract movement (> $25,000 USDT)',
        'Frequent intermediary hop transit to secondary P2P hawala dealers',
        'Burst velocity in Tether settlement window',
      ],
      typology: 'Moderate Risk — Transit & Intermediary Structuring',
      counterparties: [
        { address: 'TJxy48Nj9j7xABh4DhGxkzhBV3MhPRg8KLa', count: 14, totalValue: '15,000.00 USDT', type: 'wallet', name: 'Victim Wire Source #1', chain: 'Tron' },
        { address: 'TAbc88Nj9j7xABh4DhGxkzhBV3MhPRg11AA', count: 9,  totalValue: '8,500.00 USDT',  type: 'wallet', name: 'Victim Wire Source #2', chain: 'Tron' },
        { address: 'TDde99Nj9j7xABh4DhGxkzhBV3MhPRg22BB', count: 6,  totalValue: '4,200.00 USDT',  type: 'wallet', name: 'OTC Liquidity Broker', chain: 'Tron' },
        { address: 'TSunSwapRouterContractTronGrid001', count: 11, totalValue: '6,500.00 USDT',  type: 'contract', name: 'SunSwap DEX Pool', chain: 'Tron' },
        { address: 'TMuleTransitAlphaTronChain0001',     count: 8,  totalValue: '3,800.00 USDT',  type: 'wallet', name: 'Pass-Through Mule #1', chain: 'Tron' },
        { address: 'TMuleTransitBetaTronChain0002',      count: 7,  totalValue: '2,900.00 USDT',  type: 'wallet', name: 'Pass-Through Mule #2', chain: 'Tron' },
        { address: 'T9yD14Nj9j7xABh4DhGxkzhBV3MhPRgXPr', count: 22, totalValue: '12,000.00 USDT', type: 'exchange', name: 'Binance Tron Hot', chain: 'Tron' },
        { address: 'TOkxDepositSweepAddressTron0001',    count: 15, totalValue: '7,500.00 USDT',  type: 'exchange', name: 'OKX Tron Gateway', chain: 'Tron' },
        { address: 'THtxHuobiGlobalSweepAddress0001',   count: 10, totalValue: '5,000.00 USDT',  type: 'exchange', name: 'HTX / Huobi Deposit', chain: 'Tron' },
      ],
    },
    graphNodes: [
      { id: 0,  x: 530, y: 320, label: 'Suspect Target', addr: 'TKNV...hmFE', fullAddr: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE', type: 'suspect', riskScore: 68, totalValue: '25,000.00 USDT', txCount: 42 },
      { id: 1,  x: 160, y: 150, label: 'Victim Wire Source #1', addr: 'TJxy...8KLa', fullAddr: 'TJxy48Nj9j7xABh4DhGxkzhBV3MhPRg8KLa', type: 'victim', riskScore: 15, totalValue: '15,000.00 USDT', isLarge: true, txCount: 14 },
      { id: 2,  x: 160, y: 320, label: 'Victim Wire Source #2', addr: 'TAbc...11AA', fullAddr: 'TAbc88Nj9j7xABh4DhGxkzhBV3MhPRg11AA', type: 'victim', riskScore: 15, totalValue: '8,500.00 USDT', isLarge: true, txCount: 9 },
      { id: 3,  x: 160, y: 490, label: 'OTC Liquidity Broker', addr: 'TDde...22BB', fullAddr: 'TDde99Nj9j7xABh4DhGxkzhBV3MhPRg22BB', type: 'intermediary', riskScore: 50, totalValue: '4,200.00 USDT', isLarge: true, txCount: 6 },
      { id: 4,  x: 530, y: 90,  label: 'SunSwap DEX Pool', addr: 'TSun...0001', fullAddr: 'TSunSwapRouterContractTronGrid001', type: 'contract', riskScore: 40, totalValue: '6,500.00 USDT', isLarge: true, txCount: 11 },
      { id: 5,  x: 410, y: 550, label: 'Pass-Through Mule #1', addr: 'TMul...0001', fullAddr: 'TMuleTransitAlphaTronChain0001', type: 'mule', riskScore: 82, totalValue: '3,800.00 USDT', isLarge: true, txCount: 8 },
      { id: 6,  x: 650, y: 550, label: 'Pass-Through Mule #2', addr: 'TMul...0002', fullAddr: 'TMuleTransitBetaTronChain0002', type: 'mule', riskScore: 78, totalValue: '2,900.00 USDT', isLarge: true, txCount: 7 },
      { id: 7,  x: 880, y: 150, label: 'Binance Tron Hot', addr: 'T9yD...xqPr', fullAddr: 'T9yD14Nj9j7xABh4DhGxkzhBV3MhPRgXPr', type: 'exchange', riskScore: 20, totalValue: '12,000.00 USDT', isLarge: true, txCount: 22 },
      { id: 8,  x: 880, y: 320, label: 'OKX Tron Gateway', addr: 'TOkx...0001', fullAddr: 'TOkxDepositSweepAddressTron0001', type: 'exchange', riskScore: 20, totalValue: '7,500.00 USDT', isLarge: true, txCount: 15 },
      { id: 9,  x: 880, y: 490, label: 'HTX / Huobi Deposit', addr: 'THtx...0001', fullAddr: 'THtxHuobiGlobalSweepAddress0001', type: 'exchange', riskScore: 20, totalValue: '5,000.00 USDT', isLarge: true, txCount: 10 },
    ],
    graphEdges: [
      { from: 1, to: 0, amount: '15,000 USDT', suspicious: false, isLarge: true, relationship: 'funds', txCount: 14 },
      { from: 2, to: 0, amount: '8,500 USDT',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 9 },
      { from: 3, to: 0, amount: '4,200 USDT',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 6 },
      { from: 0, to: 4, amount: '6,500 USDT',  suspicious: false, isLarge: true, relationship: 'swaps', txCount: 11 },
      { from: 0, to: 5, amount: '3,800 USDT',  suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 8 },
      { from: 0, to: 6, amount: '2,900 USDT',  suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 7 },
      { from: 0, to: 7, amount: '12,000 USDT', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 22 },
      { from: 0, to: 8, amount: '7,500 USDT',  suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 15 },
      { from: 0, to: 9, amount: '5,000 USDT',  suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 10 },
    ],
    aiNarrative: 'Significant TRC-20 USDT token transfers identified on Tron network. Counterparty clustering indicates high-value liquidity routing ($27,700 USDT) through peer hawala dealers and instant off-ramping into Binance Tron (T9yD...xqPr) and OKX.',
    vaspAttribution: [
      { name: 'Binance Tron Hot Wallet', confidence: 92, category: 'Centralized Exchange (CEX)', address: 'T9yD14Nj9j7xABh4DhGxkzhBV3MhPRgXPr' },
      { name: 'OKX Tron', confidence: 84, category: 'Centralized Exchange (CEX)' },
    ],
    riskDNA: {
      compositeScore: 68,
      confidenceScore: 89,
      level: 'MEDIUM',
      vector: { amlRisk: 68, mixerExposure: 15, behavioralRisk: 75, networkRisk: 65, scamRisk: 55, crossChainRisk: 52 },
      factors: [
        { name: 'TRC-20 Stablecoin Velocity', category: 'behavioralRisk', contributionPercent: 42, severity: 'MEDIUM', description: '25,000 USDT transferred within 15 minutes of receipt.' },
        { name: 'P2P Intermediary Routing', category: 'networkRisk', contributionPercent: 35, severity: 'MEDIUM', description: 'Repeated hops through unhosted OTC broker wallets.' },
      ],
      attenuatedRiskByHop: [68, 50, 32, 18, 8, 3],
      explainableSummary: 'Moderate-risk TRC-20 stablecoin pass-through on Tron with rapid exchange deposit routing.',
    },
    evidence: [
      {
        id: 'EV-003',
        type: 'on-chain',
        category: 'Smart Contract Transfer',
        title: 'TRC-20 USDT Smart Contract Execution',
        claim: 'TRC-20 Transfer method triggered for 12,000.00 USDT to destination exchange hot wallet.',
        method: 'TronGrid Event Log Parsing',
        source: 'TronGrid API',
        confidence: 99,
        verified: true,
        summary: 'Transfer of 12,000 USDT.'
      },
    ],
    mlPrediction: { exchange_prob: 0.88, prediction: 'Exchange / VASP Cluster', confidence: 88 },
    hypotheses: {
      primaryHypothesis: 'Informal value transfer / hawala settlement via TRC-20 USDT token transfers.',
      primaryConfidence: 68,
      counterHypothesis: 'Standard commercial remittance or freelance merchant payment.',
      counterConfidence: 32,
      criticalDifferentiator: 'Absence of registered commercial merchant smart contracts and rapid off-ramp velocity.',
    },
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    timeAgo: '5h ago',
    status: 'ACTIVE',
  },
  {
    id: 'INV-2024-00125',
    title: 'Solana Phishing Drainer & Wormhole Bridge',
    wallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    chain: 'Solana',
    riskScore: 94,
    riskLevel: 'High Risk',
    riskKey: 'high',
    typology: 'Critical Risk — Phishing Drainer & Cross-Chain Dispersion',
    txCount: 128,
    balance: '142.80 SOL',
    balanceUSD: '$22,134.00',
    blockchain: {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      chain: 'Solana',
      balance: '142.80 SOL',
      balanceUSD: '$22,134.00',
      txCount: 128,
      firstSeen: '10/04/2024',
      lastSeen: '21/04/2024',
      recentTxs: [
        { hash: '4x912...soltx', from: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', to: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', value: '45.00', timeStamp: '1713600000', tokenSymbol: 'SOL', chain: 'Solana' },
      ],
      riskScore: 94,
      riskFactors: [
        'Automated victim wallet draining signatures (4 distinct victims)',
        'Cross-chain Wormhole bridging (90.00 SOL) to evade Solana freezes',
        'Swept liquidity through Raydium and Jupiter DEX swaps',
      ],
      typology: 'Critical Risk — Phishing Drainer & Cross-Chain Dispersion',
      counterparties: [
        { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', count: 32, totalValue: '142.80 SOL', type: 'exchange', name: 'Raydium DEX', chain: 'Solana' },
      ],
    },
    graphNodes: [
      { id: 0,  x: 530, y: 320, label: 'Suspect Drainer', addr: '9WzD...AWWM', fullAddr: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', type: 'suspect', riskScore: 94, totalValue: '142.80 SOL', txCount: 128 },
      { id: 1,  x: 140, y: 130, label: 'Victim Keypair #1', addr: '4vJz...99AA', fullAddr: '4vJz11VictimSolanaKeypair0000111199AA', type: 'victim', riskScore: 15, totalValue: '48.50 SOL', isLarge: true, txCount: 18 },
      { id: 2,  x: 280, y: 165, label: 'Victim Keypair #2', addr: '7kMm...88BB', fullAddr: '7kMm22VictimSolanaKeypair0000222288BB', type: 'victim', riskScore: 15, totalValue: '34.20 SOL', isLarge: true, txCount: 14 },
      { id: 3,  x: 140, y: 340, label: 'Victim Keypair #3', addr: '2nPp...77CC', fullAddr: '2nPp33VictimSolanaKeypair0000333377CC', type: 'victim', riskScore: 15, totalValue: '28.10 SOL', isLarge: true, txCount: 10 },
      { id: 4,  x: 280, y: 480, label: 'Victim Keypair #4', addr: '9qRr...66DD', fullAddr: '9qRr44VictimSolanaKeypair0000444466DD', type: 'victim', riskScore: 15, totalValue: '32.00 SOL', isLarge: true, txCount: 12 },
      { id: 5,  x: 410, y: 90,  label: 'Wormhole Bridge Portal', addr: 'worm...88AA', fullAddr: 'worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth', type: 'contract', riskScore: 90, totalValue: '90.00 SOL', isLarge: true, txCount: 25 },
      { id: 6,  x: 650, y: 90,  label: 'Jupiter Aggregator', addr: 'JUP6...77BB', fullAddr: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4', type: 'contract', riskScore: 50, totalValue: '35.00 SOL', isLarge: true, txCount: 16 },
      { id: 7,  x: 410, y: 550, label: 'Pass-Through Mule #1', addr: 'SolM...11AA', fullAddr: 'SolMuleTransitAlphaKeypair000011AA', type: 'mule', riskScore: 88, totalValue: '24.00 SOL', isLarge: true, txCount: 15 },
      { id: 8,  x: 650, y: 550, label: 'Syndicate Cashout Mule', addr: 'SolM...22BB', fullAddr: 'SolMuleTransitBetaKeypair000022BB', type: 'mule', riskScore: 92, totalValue: '18.50 SOL', isLarge: true, txCount: 9 },
      { id: 9,  x: 920, y: 160, label: 'Raydium DEX Swap Pool', addr: 'Token...Q5DA', fullAddr: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', type: 'exchange', riskScore: 35, totalValue: '45.00 SOL', isLarge: true, txCount: 32 },
      { id: 10, x: 920, y: 460, label: 'Bybit Solana Gateway', addr: 'Bybi...99CC', fullAddr: 'BybitSolanaInstitutionalDeposit0001', type: 'exchange', riskScore: 25, totalValue: '38.00 SOL', isLarge: true, txCount: 20 },
    ],
    graphEdges: [
      { from: 1, to: 0, amount: '48.50 SOL', suspicious: true, isLarge: true, relationship: 'funds', txCount: 18 },
      { from: 2, to: 0, amount: '34.20 SOL', suspicious: true, isLarge: true, relationship: 'funds', txCount: 14 },
      { from: 3, to: 0, amount: '28.10 SOL', suspicious: true, isLarge: true, relationship: 'funds', txCount: 10 },
      { from: 4, to: 0, amount: '32.00 SOL', suspicious: true, isLarge: true, relationship: 'funds', txCount: 12 },
      { from: 0, to: 5, amount: '90.00 SOL', suspicious: true, isLarge: true, relationship: 'bridges', txCount: 25 },
      { from: 0, to: 6, amount: '35.00 SOL', suspicious: false, isLarge: true, relationship: 'swaps', txCount: 16 },
      { from: 0, to: 7, amount: '24.00 SOL', suspicious: true, isLarge: true, relationship: 'forwards', txCount: 15 },
      { from: 0, to: 8, amount: '18.50 SOL', suspicious: true, isLarge: true, relationship: 'forwards', txCount: 9 },
      { from: 0, to: 9, amount: '45.00 SOL', suspicious: false, isLarge: true, relationship: 'swaps', txCount: 32 },
      { from: 0, to: 10, amount: '38.00 SOL', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 20 },
    ],
    aiNarrative: 'Critical-risk Solana phishing drainer syndicate. Ingests victim authorizations across 4 drained accounts ($142.80 SOL), swaps tokens via Raydium and Jupiter DEX, and bridges 90 SOL to Ethereum via Wormhole Portal to evade local blacklist freezes.',
    vaspAttribution: [
      { name: 'Raydium DEX & Wormhole Portal', confidence: 95, category: 'DEX / Bridge' },
      { name: 'Bybit', confidence: 88, category: 'Centralized Exchange (CEX)' },
    ],
    riskDNA: {
      compositeScore: 94,
      confidenceScore: 96,
      level: 'CRITICAL',
      vector: { amlRisk: 92, mixerExposure: 88, behavioralRisk: 96, networkRisk: 95, scamRisk: 98, crossChainRisk: 94 },
      factors: [
        { name: 'Malicious Permit/Approval Drain Pattern', category: 'scamRisk', contributionPercent: 45, severity: 'CRITICAL', description: 'Swept funds via programmatic authorization exploits.' },
        { name: 'Cross-Chain Bridge Dispersion', category: 'crossChainRisk', contributionPercent: 35, severity: 'CRITICAL', description: 'Immediate bridging to Wormhole contract.' },
      ],
      attenuatedRiskByHop: [94, 78, 55, 32, 18, 6],
      explainableSummary: 'Active Solana phishing drainer executing cross-chain capital evasion.',
    },
    evidence: [
      {
        id: 'EV-005',
        type: 'behavioral',
        category: 'Drainer Signature',
        title: 'Programmatic Token Sweep Execution',
        claim: 'Wallet executed batch drain instructions across 18 victim accounts in under 90 seconds.',
        method: 'Solana RPC Instruction Disassembly',
        source: 'Solana Mainnet Ledger',
        confidence: 99,
        verified: true,
        summary: 'High-speed automated drain signature.'
      },
    ],
    mlPrediction: { exchange_prob: 0.95, prediction: 'Drainer / Exploit Cluster', confidence: 95 },
    hypotheses: {
      primaryHypothesis: 'Programmatic phishing drainer syndicate operating fake Web3 air-drop portals.',
      primaryConfidence: 94,
      counterHypothesis: 'Arbitrage bot liquidation.',
      counterConfidence: 6,
      criticalDifferentiator: 'Direct victim authorization sweeps match 1930 Helpline fraud complaints.',
    },
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    timeAgo: '1d ago',
    status: 'ACTIVE',
  },
  {
    id: 'INV-2024-00124',
    title: 'BSC High-Yield Ponzi & Tumbler',
    wallet: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    chain: 'BNB Chain',
    riskScore: 91,
    riskLevel: 'High Risk',
    riskKey: 'high',
    typology: 'Critical Risk — Ponzi Scheme & Token Tumbler',
    txCount: 215,
    balance: '18.45 BNB',
    balanceUSD: '$10,701.00',
    blockchain: {
      address: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
      chain: 'BNB Chain',
      balance: '18.45 BNB',
      balanceUSD: '$10,701.00',
      txCount: 215,
      firstSeen: '05/03/2024',
      lastSeen: '21/04/2024',
      recentTxs: [
        { hash: '0x3344...bsctx', from: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', to: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9', value: '15.00', timeStamp: '1713650000', tokenSymbol: 'BNB', chain: 'BNB Chain' },
      ],
      riskScore: 91,
      riskFactors: [
        'Multi-victim retail deposit aggregation (120+ contributors)',
        'Pyramidal fund return recirculation',
        'Direct liquidation at Bybit deposit gateway',
      ],
      typology: 'Critical Risk — Ponzi Scheme & Token Tumbler',
      counterparties: [
        { address: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9', count: 45, totalValue: '18.45 BNB', type: 'exchange', name: 'Bybit', chain: 'BNB Chain' },
      ],
    },
    graphNodes: [
      { id: 0,  x: 530, y: 320, label: 'Ponzi Pool Subject', addr: '0x3f5c...f0be', fullAddr: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', type: 'suspect', riskScore: 91, totalValue: '18.45 BNB', txCount: 215 },
      { id: 1,  x: 140, y: 130, label: 'Retail Victim #1', addr: '0x11aa...99bb', fullAddr: '0x11aa22bb33cc44dd55ee66ff77aa88bb99bb11aa', type: 'victim', riskScore: 15, totalValue: '4.50 BNB', isLarge: true, txCount: 14 },
      { id: 2,  x: 280, y: 165, label: 'Retail Victim #2', addr: '0x22bb...88cc', fullAddr: '0x22bb33cc44dd55ee66ff77aa88bb99bb22bb88cc', type: 'victim', riskScore: 15, totalValue: '3.80 BNB', isLarge: true, txCount: 11 },
      { id: 3,  x: 140, y: 340, label: 'Retail Victim #3', addr: '0x33cc...77dd', fullAddr: '0x33cc44dd55ee66ff77aa88bb99bb33cc77dd33cc', type: 'victim', riskScore: 15, totalValue: '2.90 BNB', isLarge: true, txCount: 8 },
      { id: 4,  x: 280, y: 480, label: 'Retail Victim #4', addr: '0x44dd...66ee', fullAddr: '0x44dd55ee66ff77aa88bb99bb44dd66ee44dd55ee', type: 'victim', riskScore: 15, totalValue: '3.20 BNB', isLarge: true, txCount: 9 },
      { id: 5,  x: 410, y: 90,  label: 'BSC Token Tumbler', addr: '0xTumb...0001', fullAddr: '0xTumblerSmartContractBSCMainnet0001', type: 'mixer', riskScore: 96, totalValue: '8.50 BNB', isLarge: true, txCount: 22 },
      { id: 6,  x: 650, y: 90,  label: 'PancakeSwap Router', addr: '0x10ED...4C10', fullAddr: '0x10ED43C718714eb63d5aA57B78B54704E256024E', type: 'contract', riskScore: 30, totalValue: '6.00 BNB', isLarge: true, txCount: 18 },
      { id: 7,  x: 410, y: 550, label: 'Sweeper Mule #1', addr: '0xMule...1111', fullAddr: '0xMuleSweeperAddressBSCChain0001', type: 'mule', riskScore: 86, totalValue: '3.50 BNB', isLarge: true, txCount: 14 },
      { id: 8,  x: 650, y: 550, label: 'Sweeper Mule #2', addr: '0xMule...2222', fullAddr: '0xMuleSweeperAddressBSCChain0002', type: 'mule', riskScore: 84, totalValue: '2.80 BNB', isLarge: true, txCount: 10 },
      { id: 9,  x: 920, y: 160, label: 'Bybit Gateway', addr: '0xf89d...20f9', fullAddr: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9', type: 'exchange', riskScore: 25, totalValue: '15.00 BNB', isLarge: true, txCount: 45 },
      { id: 10, x: 920, y: 460, label: 'Binance BSC Hot', addr: '0x8894...d4e3', fullAddr: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3', type: 'exchange', riskScore: 20, totalValue: '7.20 BNB', isLarge: true, txCount: 28 },
    ],
    graphEdges: [
      { from: 1, to: 0, amount: '4.50 BNB',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 14 },
      { from: 2, to: 0, amount: '3.80 BNB',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 11 },
      { from: 3, to: 0, amount: '2.90 BNB',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 8 },
      { from: 4, to: 0, amount: '3.20 BNB',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 9 },
      { from: 0, to: 5, amount: '8.50 BNB',  suspicious: true,  isLarge: true, relationship: 'mixes', txCount: 22 },
      { from: 0, to: 6, amount: '6.00 BNB',  suspicious: false, isLarge: true, relationship: 'swaps', txCount: 18 },
      { from: 0, to: 7, amount: '3.50 BNB',  suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 14 },
      { from: 0, to: 8, amount: '2.80 BNB',  suspicious: true,  isLarge: true, relationship: 'forwards', txCount: 10 },
      { from: 0, to: 9, amount: '15.00 BNB', suspicious: false, isLarge: true, relationship: 'consolidates', txCount: 45 },
      { from: 0, to: 10, amount: '7.20 BNB', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 28 },
    ],
    aiNarrative: 'BNB Chain smart contract aggregation hub exhibiting classic Ponzi recycling topology. Over 120 retail deposits were aggregated, tumbled through smart contracts, and funnelled to Bybit (0xf89d...20f9) and Binance BSC hot wallets.',
    vaspAttribution: [
      { name: 'Bybit Exchange', confidence: 91, category: 'Centralized Exchange (CEX)', address: '0xf89d7b9c370f57f34b656b2f153a5fe699d520f9' },
      { name: 'Binance BSC', confidence: 85, category: 'Centralized Exchange (CEX)' },
    ],
    riskDNA: {
      compositeScore: 91,
      confidenceScore: 95,
      level: 'CRITICAL',
      vector: { amlRisk: 90, mixerExposure: 78, behavioralRisk: 94, networkRisk: 92, scamRisk: 96, crossChainRisk: 72 },
      factors: [
        { name: 'Retail Aggregation Smurfing', category: 'scamRisk', contributionPercent: 50, severity: 'CRITICAL', description: 'Over 120 distinct low-value incoming victim deposits.' },
      ],
      attenuatedRiskByHop: [91, 72, 48, 26, 12, 4],
      explainableSummary: 'High-density BNB Chain fraudulent investment pool with CEX off-ramping.',
    },
    evidence: [
      {
        id: 'EV-006',
        type: 'campaign',
        category: 'Syndicate Profile',
        title: 'High-Yield Investment Syndicate (HYIP-2024)',
        claim: 'Hub wallet acts as collection treasury for fake Telegram crypto doubling scheme.',
        method: 'Cluster Topology & NCRP Victim Matching',
        source: 'VAJRA Threat Intel',
        confidence: 94,
        verified: true,
        summary: 'Matches 28 complaints logged on 1930 Helpline.'
      },
    ],
    mlPrediction: { exchange_prob: 0.89, prediction: 'Ponzi / High-Risk Hub', confidence: 89 },
    hypotheses: {
      primaryHypothesis: 'Multi-tiered fraudulent crypto investment scam (BNS Sec 318).',
      primaryConfidence: 91,
      counterHypothesis: 'Community staking validator pool.',
      counterConfidence: 9,
      criticalDifferentiator: 'No proof of validator consensus generation or registered staking smart contracts.',
    },
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    timeAgo: '2d ago',
    status: 'ACTIVE',
  },
  {
    id: 'INV-2024-00126',
    title: 'BTC Cold Storage & Whitelist Inflows',
    wallet: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    chain: 'Bitcoin',
    riskScore: 24,
    riskLevel: 'Low Risk',
    riskKey: 'low',
    typology: 'Low Risk — Typical Peer Transfers & Mining Inflows',
    txCount: 8,
    balance: '68.20 BTC',
    balanceUSD: '$4,398,900.00',
    blockchain: {
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      chain: 'Bitcoin',
      balance: '68.20 BTC',
      balanceUSD: '$4,398,900.00',
      txCount: 8,
      firstSeen: '03/01/2009',
      lastSeen: '12/04/2024',
      recentTxs: [
        { hash: '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b', from: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', to: '12cbqbqevefngk3jvsrwhln1vdmg79bznk', value: '0.05', timeStamp: '1712900000', tokenSymbol: 'BTC', chain: 'Bitcoin' },
      ],
      riskScore: 24,
      riskFactors: [
        'Historical Genesis block recipient',
        'Standard peer-to-peer unspent transaction outputs (UTXOs)',
      ],
      typology: 'Low Risk — Typical Peer Transfers & Mining Inflows',
      counterparties: [
        { address: '12cbqbqevefngk3jvsrwhln1vdmg79bznk', count: 24, totalValue: '0.85 BTC', type: 'wallet', chain: 'Bitcoin' },
      ],
    },
    graphNodes: [
      { id: 0, x: 530, y: 320, label: 'Genesis Custody Keypair', addr: '1A1z...vfNa', fullAddr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', type: 'suspect', riskScore: 24, totalValue: '68.20 BTC', txCount: 8 },
      { id: 1, x: 180, y: 160, label: 'Genesis Block Inflow', addr: 'Coin...0001', fullAddr: 'CoinbaseGenesisRewardBlock00000', type: 'victim', riskScore: 5, totalValue: '50.00 BTC', isLarge: true, txCount: 1 },
      { id: 2, x: 180, y: 320, label: 'Mining Pool Treasury', addr: '1F1t...33AA', fullAddr: '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX', type: 'intermediary', riskScore: 10, totalValue: '12.50 BTC', isLarge: true, txCount: 4 },
      { id: 3, x: 180, y: 480, label: 'P2P Micro Inflow', addr: '12cb...9bznk', fullAddr: '12cbqbqevefngk3jvsrwhln1vdmg79bznk', type: 'intermediary', riskScore: 15, totalValue: '5.70 BTC', isLarge: true, txCount: 3 },
      { id: 4, x: 530, y: 90,  label: 'Multi-Sig Co-Signer Safe', addr: '34xp...4z7e', fullAddr: '34xp4vRRoCGJym3xR7yCVPFHoCNxv4Twseo', type: 'contract', riskScore: 12, totalValue: '8.20 BTC', isLarge: true, txCount: 5 },
      { id: 5, x: 880, y: 220, label: 'Institutional Cold Vault', addr: 'bc1q...99AA', fullAddr: 'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97', type: 'exchange', riskScore: 15, totalValue: '4.50 BTC', isLarge: true, txCount: 6 },
      { id: 6, x: 880, y: 420, label: 'Binance BTC Sweeper', addr: '37xx...88BB', fullAddr: '37xxBinanceInstitutionalSweeper0001', type: 'exchange', riskScore: 20, totalValue: '2.10 BTC', isLarge: true, txCount: 4 },
    ],
    graphEdges: [
      { from: 1, to: 0, amount: '50.00 BTC', suspicious: false, isLarge: true, relationship: 'funds', txCount: 1 },
      { from: 2, to: 0, amount: '12.50 BTC', suspicious: false, isLarge: true, relationship: 'funds', txCount: 4 },
      { from: 3, to: 0, amount: '5.70 BTC',  suspicious: false, isLarge: true, relationship: 'funds', txCount: 3 },
      { from: 0, to: 4, amount: '8.20 BTC',  suspicious: false, isLarge: true, relationship: 'forwards', txCount: 5 },
      { from: 0, to: 5, amount: '4.50 BTC',  suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 6 },
      { from: 0, to: 6, amount: '2.10 BTC',  suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 4 },
    ],
    aiNarrative: 'Historical Bitcoin address with standard peer-to-peer inflows. No interaction with illicit darknet markets or sanctioned entities detected.',
    vaspAttribution: [
      { name: 'Cold Storage / Custodial', confidence: 95, category: 'Custodial' },
    ],
    riskDNA: {
      compositeScore: 24,
      confidenceScore: 98,
      level: 'LOW',
      vector: { amlRisk: 18, mixerExposure: 5, behavioralRisk: 22, networkRisk: 20, scamRisk: 12, crossChainRisk: 10 },
      factors: [
        { name: 'Long-Term Inactivity / Cold Storage', category: 'behavioralRisk', contributionPercent: 55, severity: 'LOW', description: 'Long dormancy periods typical of cold storage vaults.' },
      ],
      attenuatedRiskByHop: [24, 15, 8, 4, 2, 1],
      explainableSummary: 'Low-risk Bitcoin UTXO footprint with zero mixer exposure and standard peer transfers.',
    },
    evidence: [
      {
        id: 'EV-004',
        type: 'on-chain',
        category: 'UTXO Record',
        title: 'Bitcoin Block Verification',
        claim: 'UTXO output confirmed in Genesis Block ledger history.',
        method: 'Raw Merkle Root Verification',
        source: 'Blockstream API',
        confidence: 100,
        verified: true,
        summary: 'Public ledger entry.'
      },
    ],
    mlPrediction: { exchange_prob: 0.32, prediction: 'P2P Wallet', confidence: 68 },
    hypotheses: {
      primaryHypothesis: 'Long-term dormant custody or institutional cold storage archive.',
      primaryConfidence: 88,
      counterHypothesis: 'High-risk unhosted illicit treasury.',
      counterConfidence: 12,
      criticalDifferentiator: 'Clean cryptographic lineage tracing back to block genesis without mixer passes.',
    },
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    timeAgo: '1d ago',
    status: 'RESOLVED',
  },
  {
    id: 'INV-2024-00123',
    title: 'Polygon Merchant Treasury Settlement',
    wallet: '0x1111111254fb6c44bac0bed2854e76f90643097d',
    chain: 'Polygon',
    riskScore: 18,
    riskLevel: 'Low Risk',
    riskKey: 'low',
    typology: 'Low Risk — Legitimate Merchant Treasury & Multi-Sig',
    txCount: 850,
    balance: '4,850.00 POL',
    balanceUSD: '$2,667.50',
    blockchain: {
      address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      chain: 'Polygon',
      balance: '4,850.00 POL',
      balanceUSD: '$2,667.50',
      txCount: 850,
      firstSeen: '01/01/2024',
      lastSeen: '21/04/2024',
      recentTxs: [
        { hash: '0x9988...polytx', from: '0x1111111254fb6c44bac0bed2854e76f90643097d', to: '0x742d35cc6634c0532925a3b844bc454e4438f44e', value: '500.00', timeStamp: '1713700000', tokenSymbol: 'POL', chain: 'Polygon' },
      ],
      riskScore: 18,
      riskFactors: [
        'Verified corporate multi-signature contract',
        'Regular payroll schedule disbursement',
      ],
      typology: 'Low Risk — Legitimate Merchant Treasury & Multi-Sig',
      counterparties: [
        { address: '0x742d35cc6634c0532925a3b844bc454e4438f44e', count: 120, totalValue: '4,850.00 POL', type: 'exchange', name: 'Bitfinex', chain: 'Polygon' },
      ],
    },
    graphNodes: [
      { id: 0, x: 530, y: 320, label: 'Merchant Safe Contract', addr: '0x1111...097d', fullAddr: '0x1111111254fb6c44bac0bed2854e76f90643097d', type: 'contract', riskScore: 18, totalValue: '4,850.00 POL', txCount: 850 },
      { id: 1, x: 180, y: 160, label: 'Client Settlement Feed #1', addr: '0xCli1...11AA', fullAddr: '0xClientSettlementFeed00000000000011AA', type: 'victim', riskScore: 10, totalValue: '1,800.00 POL', isLarge: true, txCount: 35 },
      { id: 2, x: 180, y: 320, label: 'Client Settlement Feed #2', addr: '0xCli2...22BB', fullAddr: '0xClientSettlementFeed00000000000022BB', type: 'victim', riskScore: 10, totalValue: '1,450.00 POL', isLarge: true, txCount: 28 },
      { id: 3, x: 180, y: 480, label: 'Corporate Liquidity Inflow', addr: '0xCorp...33CC', fullAddr: '0xCorporateLiquidityInflow0000000033CC', type: 'intermediary', riskScore: 15, totalValue: '1,600.00 POL', isLarge: true, txCount: 19 },
      { id: 4, x: 530, y: 90,  label: '1inch DEX Aggregator', addr: '0x1111...097d', fullAddr: '0x1111111254fb6c44bac0bed2854e76f90643097d', type: 'contract', riskScore: 15, totalValue: '950.00 POL', isLarge: true, txCount: 42 },
      { id: 5, x: 880, y: 160, label: 'Bitfinex Settlement Node', addr: '0x742d...f44e', fullAddr: '0x742d35cc6634c0532925a3b844bc454e4438f44e', type: 'exchange', riskScore: 15, totalValue: '1,200.00 POL', isLarge: true, txCount: 65 },
      { id: 6, x: 880, y: 320, label: 'Verified Vendor Payroll #1', addr: '0xPay1...44DD', fullAddr: '0xVerifiedVendorPayroll00000000000044DD', type: 'intermediary', riskScore: 10, totalValue: '850.00 POL', isLarge: true, txCount: 24 },
      { id: 7, x: 880, y: 480, label: 'Verified Vendor Payroll #2', addr: '0xPay2...55EE', fullAddr: '0xVerifiedVendorPayroll00000000000055EE', type: 'intermediary', riskScore: 10, totalValue: '600.00 POL', isLarge: true, txCount: 18 },
    ],
    graphEdges: [
      { from: 1, to: 0, amount: '1,800 POL', suspicious: false, isLarge: true, relationship: 'funds', txCount: 35 },
      { from: 2, to: 0, amount: '1,450 POL', suspicious: false, isLarge: true, relationship: 'funds', txCount: 28 },
      { from: 3, to: 0, amount: '1,600 POL', suspicious: false, isLarge: true, relationship: 'funds', txCount: 19 },
      { from: 0, to: 4, amount: '950 POL',   suspicious: false, isLarge: true, relationship: 'swaps', txCount: 42 },
      { from: 0, to: 5, amount: '1,200 POL', suspicious: false, isLarge: true, relationship: 'off-ramps', txCount: 65 },
      { from: 0, to: 6, amount: '850 POL',   suspicious: false, isLarge: true, relationship: 'forwards', txCount: 24 },
      { from: 0, to: 7, amount: '600 POL',   suspicious: false, isLarge: true, relationship: 'forwards', txCount: 18 },
    ],
    aiNarrative: 'Polygon smart contract treasury operating legitimate commercial settlements and decentralized payroll distributions. Zero sanction or mixer touchpoints.',
    vaspAttribution: [
      { name: '1inch Protocol & Bitfinex', confidence: 92, category: 'DEX / CEX' },
    ],
    riskDNA: {
      compositeScore: 18,
      confidenceScore: 97,
      level: 'LOW',
      vector: { amlRisk: 14, mixerExposure: 0, behavioralRisk: 18, networkRisk: 15, scamRisk: 8, crossChainRisk: 12 },
      factors: [
        { name: 'Verified Commercial Smart Contract', category: 'amlRisk', contributionPercent: 60, severity: 'LOW', description: 'Gnosis Safe Multi-Sig contract with transparent governance.' },
      ],
      attenuatedRiskByHop: [18, 10, 5, 2, 1, 0],
      explainableSummary: 'Transparent commercial treasury on Polygon with audited multi-sig governance.',
    },
    evidence: [
      {
        id: 'EV-007',
        type: 'analytical',
        category: 'Smart Contract Verification',
        title: 'Audited Multi-Sig Governance',
        claim: 'Address corresponds to audited Gnosis Safe Multi-Sig treasury.',
        method: 'Bytecode & Source Code Verification',
        source: 'PolygonScan Verified Contracts',
        confidence: 100,
        verified: true,
        summary: 'Legitimate merchant governance structure.'
      },
    ],
    mlPrediction: { exchange_prob: 0.15, prediction: 'Commercial Multi-Sig', confidence: 88 },
    hypotheses: {
      primaryHypothesis: 'Legitimate business treasury and institutional payment processor.',
      primaryConfidence: 92,
      counterHypothesis: 'Illicit layering gateway.',
      counterConfidence: 8,
      criticalDifferentiator: 'Periodic payroll timings, audited multi-sig signers, and zero mixer interactions.',
    },
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    timeAgo: '3d ago',
    status: 'RESOLVED',
  },
];

function getStorageKey(): string {
  try {
    const session = localStorage.getItem('vajra_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed && parsed.email) {
        const cleanEmail = parsed.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        return `vajra_cases_${cleanEmail}`;
      }
    }
  } catch {}
  return 'vajra_cases_officer_vajra_gov_in';
}

function loadCases(): CaseRecord[] {
  try {
    const key = getStorageKey();
    let raw = localStorage.getItem(key);
    // Migration fallback from v5 or legacy keys
    if (!raw) {
      raw = localStorage.getItem('vajra_cases_registry_v7') || localStorage.getItem('vajra_cases_registry_v5') || localStorage.getItem('vajra_cases_universal_v6');
      if (raw) {
        try {
          localStorage.setItem(key, raw);
        } catch {}
      }
    }
    if (!raw) return INITIAL_CASES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_CASES;

    // Ensure all cases have full multi-node graphs (if they were previously loaded with 3-5 nodes)
    return parsed.map((c: CaseRecord) => {
      const matchingInit = INITIAL_CASES.find((init) => init.id.toLowerCase() === c.id.toLowerCase());
      if (matchingInit && (!c.graphNodes || c.graphNodes.length <= 5)) {
        return {
          ...c,
          graphNodes: matchingInit.graphNodes,
          graphEdges: matchingInit.graphEdges,
          blockchain: matchingInit.blockchain || c.blockchain,
          portfolio: matchingInit.portfolio || c.portfolio,
        };
      }
      if ((!c.graphNodes || c.graphNodes.length <= 5) && c.blockchain) {
        const rebuilt = buildGraph(c.blockchain);
        if (rebuilt.nodes.length > 0) {
          return {
            ...c,
            graphNodes: rebuilt.nodes,
            graphEdges: rebuilt.edges,
          };
        }
      }
      return c;
    });
  } catch {
    return INITIAL_CASES;
  }
}

function saveCases(cases: CaseRecord[]) {
  try {
    const key = getStorageKey();
    const data = JSON.stringify(cases);
    localStorage.setItem(key, data);
    localStorage.setItem('vajra_cases_registry_v7', data);
    localStorage.setItem('vajra_cases_registry_v5', data);
    localStorage.setItem('vajra_cases_universal_v6', data);
  } catch (e) {
    console.warn('Failed to save cases to localStorage:', e);
  }
}

let _cases: CaseRecord[] = loadCases();
const _caseListeners = new Set<() => void>();

function notifyCaseListeners() {
  _caseListeners.forEach((fn) => fn());
}

export const caseStore = {
  reload(): CaseRecord[] {
    _cases = loadCases();
    notifyCaseListeners();
    return _cases;
  },

  getAll(): CaseRecord[] {
    if (!_cases || _cases.length === 0) {
      _cases = loadCases();
    }
    return _cases;
  },

  getById(id: string): CaseRecord | undefined {
    return _cases.find((c) => c.id.toLowerCase() === id.toLowerCase());
  },

  addOrUpdate(caseData: Partial<CaseRecord> & { id: string; wallet: string }): CaseRecord {
    const now = new Date();
    const existingIndex = _cases.findIndex((c) => c.id.toLowerCase() === caseData.id.toLowerCase());

    const score = caseData.riskScore ?? 50;
    const riskLevel: CaseRecord['riskLevel'] = score >= 75 ? 'High Risk' : score >= 45 ? 'Medium Risk' : 'Low Risk';
    const riskKey: CaseRecord['riskKey'] = score >= 75 ? 'high' : score >= 45 ? 'med' : 'low';

    const fullRecord: CaseRecord = {
      id: caseData.id,
      title: caseData.title || `Investigation ${caseData.id}`,
      wallet: caseData.wallet,
      chain: caseData.chain || 'Ethereum',
      riskScore: score,
      riskLevel,
      riskKey,
      typology: caseData.typology || 'Multi-Hop Analysis',
      txCount: caseData.txCount ?? (caseData.blockchain?.txCount || 0),
      balance: caseData.balance || (caseData.blockchain?.balance || '0.00'),
      balanceUSD: caseData.balanceUSD || (caseData.blockchain?.balanceUSD || '$0.00'),
      blockchain: caseData.blockchain ?? null,
      graphNodes: caseData.graphNodes || [],
      graphEdges: caseData.graphEdges || [],
      portfolio: caseData.portfolio || caseData.blockchain?.portfolio || [],
      aiNarrative: caseData.aiNarrative || '',
      vaspAttribution: caseData.vaspAttribution || [],
      evidence: caseData.evidence || [],
      mlPrediction: caseData.mlPrediction || null,
      
      riskDNA: caseData.riskDNA,
      entityClusters: caseData.entityClusters || [],
      fingerprint: caseData.fingerprint,
      relationships: caseData.relationships || [],
      typologyMatches: caseData.typologyMatches || [],
      lifecycle: caseData.lifecycle,
      dynamicPaths: caseData.dynamicPaths || [],
      campaigns: caseData.campaigns || [],
      predictions: caseData.predictions,
      hypotheses: caseData.hypotheses,

      createdAt: caseData.createdAt || now.toISOString(),
      timeAgo: 'Just now',
      status: caseData.status || 'ACTIVE',
    };

    if (existingIndex >= 0) {
      _cases[existingIndex] = { ..._cases[existingIndex], ...fullRecord };
    } else {
      _cases = [fullRecord, ..._cases];
    }

    saveCases(_cases);
    notifyCaseListeners();
    return fullRecord;
  },

  getStats() {
    const totalCases = _cases.length;
    const activeCases = _cases.filter((c) => c.status === 'ACTIVE').length;
    const highRiskAlerts = _cases.filter((c) => c.riskScore >= 70).length;
    
    const uniqueWallets = new Set<string>();
    _cases.forEach((c) => {
      if (c.wallet) uniqueWallets.add(c.wallet.toLowerCase());
      c.graphNodes?.forEach((n) => {
        if (n.addr) uniqueWallets.add(n.addr.toLowerCase());
      });
    });

    const vaspSet = new Set<string>();
    _cases.forEach((c) => {
      c.vaspAttribution?.forEach((v) => {
        if (v.name && v.name !== 'Unknown VASP') vaspSet.add(v.name);
      });
    });

    return {
      totalCases,
      activeCases,
      highRiskAlerts,
      walletsAnalyzed: uniqueWallets.size || 48,
      vaspCount: vaspSet.size || 6,
    };
  },

  subscribe(fn: () => void): () => void {
    _caseListeners.add(fn);
    return () => _caseListeners.delete(fn);
  },
};
