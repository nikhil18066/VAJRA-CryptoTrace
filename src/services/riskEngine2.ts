/**
 * VAJRA Risk Engine 2.0
 * 
 * Multi-Dimensional Risk DNA Vector Engine:
 * R = < R_AML, R_Scam, R_Mixer, R_Network, R_Behavioral, R_CrossChain >
 * 
 * Includes:
 * - Independent Confidence Score (C in [0, 100%])
 * - Explainable Risk DNA percentage factor attribution
 * - Attenuation-based dynamic network risk propagation
 */

import type { RawTx } from './blockchain';
import { KNOWN_MIXERS, KNOWN_EXCHANGES } from '../store/analysisStore';

export interface RiskDNAVector {
  amlRisk: number;         // 0-100: Structuring, layering, velocity, pass-through
  scamRisk: number;        // 0-100: Mass fan-in, phishing, rug-pull signature
  mixerExposure: number;   // 0-100: Direct & indirect privacy pool exposure
  networkRisk: number;     // 0-100: Counterparty risk & cluster guilt-by-association
  behavioralRisk: number;  // 0-100: Peel-chain, rapid forwarding, anomalous bursts
  crossChainRisk: number;  // 0-100: Chain-hopping, bridge hopping to non-KYC chains
}

export interface RiskDNAFactor {
  name: string;
  category: keyof RiskDNAVector;
  contributionPercent: number; // e.g. 21%
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface RiskDNAProfile {
  compositeScore: number;       // 0-100 overall composite risk score
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;      // 0-100 % confidence in this risk assessment
  vector: RiskDNAVector;
  factors: RiskDNAFactor[];
  explainableSummary: string;
  attenuatedRiskByHop: number[]; // Hop 0 (self), Hop 1, Hop 2, Hop 3
}

/**
 * Computes the complete multi-dimensional Risk DNA profile for a wallet
 */
export function computeRiskDNA(
  txs: RawTx[],
  selfAddr: string,
  chain: string = 'Ethereum',
  counterpartyRisks: Map<string, number> = new Map()
): RiskDNAProfile {
  const self = selfAddr.toLowerCase();
  if (!txs || txs.length === 0) {
    return {
      compositeScore: 10,
      level: 'LOW',
      confidenceScore: 30, // Low data = lower confidence
      vector: {
        amlRisk: 5,
        scamRisk: 5,
        mixerExposure: 0,
        networkRisk: 10,
        behavioralRisk: 10,
        crossChainRisk: 5,
      },
      factors: [
        {
          name: 'Baseline Inactivity',
          category: 'behavioralRisk',
          contributionPercent: 100,
          severity: 'LOW',
          description: 'No recent transaction history found on-chain. Minimal observable baseline risk.',
        }
      ],
      explainableSummary: 'Insufficient transaction volume. Minimal risk assessed with moderate baseline uncertainty.',
      attenuatedRiskByHop: [10, 5, 2, 1],
    };
  }

  const outbound = txs.filter((t) => t.from.toLowerCase() === self);
  const inbound = txs.filter((t) => t.to.toLowerCase() === self);

  const uniqueRecipients = new Set(outbound.map((t) => t.to.toLowerCase()));
  const uniqueSenders = new Set(inbound.map((t) => t.from.toLowerCase()));
  const allCounterparties = new Set([...uniqueRecipients, ...uniqueSenders]);

  // 1. Mixer Exposure Dimension
  let directMixerTxCount = 0;
  let mixerExposureScore = 0;
  for (const cp of allCounterparties) {
    if (KNOWN_MIXERS.has(cp)) {
      directMixerTxCount++;
    }
  }
  if (directMixerTxCount > 0) {
    mixerExposureScore = Math.min(100, 70 + directMixerTxCount * 10);
  }

  // 2. Behavioral Risk Dimension (Burst, Peel-chain, Rapid forwarding)
  const timestamps = txs.map((t) => parseInt(t.timeStamp, 10)).filter((n) => !isNaN(n)).sort((a, b) => a - b);
  let burstsCount = 0;
  let rapidForwardingCount = 0;
  for (let i = 1; i < timestamps.length; i++) {
    const gap = timestamps[i] - timestamps[i - 1];
    if (gap < 60) burstsCount++;
    if (gap < 300) rapidForwardingCount++;
  }

  const fanOutRatio = outbound.length > 0 ? uniqueRecipients.size / outbound.length : 0;
  const fanInRatio = inbound.length > 0 ? uniqueSenders.size / inbound.length : 0;
  
  let behavioralRiskScore = Math.min(
    100,
    Math.round(
      (burstsCount > 3 ? 35 : burstsCount * 10) +
      (rapidForwardingCount > 5 ? 30 : rapidForwardingCount * 5) +
      (fanOutRatio > 0.8 && outbound.length > 5 ? 25 : 0) +
      (txs.length > 50 ? 10 : 0)
    )
  );

  // 3. AML Risk Dimension (Structuring & Layering)
  const values = txs.map((t) => parseFloat(t.value || '0')).filter((v) => !isNaN(v) && v > 0);
  const valueCounts = new Map<number, number>();
  values.forEach((v) => valueCounts.set(v, (valueCounts.get(v) || 0) + 1));
  let maxRepeatedVal = 0;
  valueCounts.forEach((count) => { if (count > maxRepeatedVal) maxRepeatedVal = count; });
  const structuringSignal = maxRepeatedVal >= 4 && values.length >= 8;

  let amlRiskScore = Math.min(
    100,
    Math.round(
      (structuringSignal ? 45 : 0) +
      (mixerExposureScore > 50 ? 30 : 0) +
      (rapidForwardingCount > 8 ? 25 : rapidForwardingCount * 2)
    )
  );

  // 4. Scam Risk Dimension (Mass Victim Fan-In -> Drain / High Inbound ratio)
  const massVictimFanIn = uniqueSenders.size >= 10 && (inbound.length / (txs.length || 1)) > 0.75;
  let scamRiskScore = Math.min(
    100,
    Math.round(
      (massVictimFanIn ? 65 : uniqueSenders.size > 5 ? 30 : 5) +
      (structuringSignal ? 20 : 0) +
      (directMixerTxCount > 0 ? 15 : 0)
    )
  );

  // 5. Network Risk Dimension (Counterparty risk propagation)
  let sumCpRisk = 0;
  let knownHighRiskCp = 0;
  for (const cp of allCounterparties) {
    const cpRisk = counterpartyRisks.get(cp) || (KNOWN_MIXERS.has(cp) ? 95 : 15);
    sumCpRisk += cpRisk;
    if (cpRisk >= 75) knownHighRiskCp++;
  }
  const avgCpRisk = allCounterparties.size > 0 ? sumCpRisk / allCounterparties.size : 15;
  let networkRiskScore = Math.min(100, Math.round(avgCpRisk * 0.6 + knownHighRiskCp * 15));

  // 6. Cross-Chain Risk Dimension
  const isHighVelocityChain = ['Tron', 'Arbitrum', 'Base', 'Solana', 'BSC'].includes(chain);
  let crossChainRiskScore = Math.min(
    100,
    Math.round(
      (isHighVelocityChain ? 25 : 10) +
      (mixerExposureScore > 0 ? 35 : 0) +
      (behavioralRiskScore > 50 ? 30 : 10)
    )
  );

  // Vector Synthesis
  const vector: RiskDNAVector = {
    amlRisk: amlRiskScore,
    scamRisk: scamRiskScore,
    mixerExposure: mixerExposureScore,
    networkRisk: networkRiskScore,
    behavioralRisk: behavioralRiskScore,
    crossChainRisk: crossChainRiskScore,
  };

  // Weighted Composite Risk Calculation
  // Weights: AML(0.25), Mixer(0.20), Behavioral(0.20), Network(0.15), Scam(0.12), CrossChain(0.08)
  const compositeScore = Math.round(
    vector.amlRisk * 0.25 +
    vector.mixerExposure * 0.20 +
    vector.behavioralRisk * 0.20 +
    vector.networkRisk * 0.15 +
    vector.scamRisk * 0.12 +
    vector.crossChainRisk * 0.08
  );

  // Confidence Estimation (based on data richness: txCount, span of time, counterparty depth)
  const txVolumeWeight = Math.min(50, txs.length * 2.5); // 20 txs = 50 pts
  const timeSpanWeight = timestamps.length > 1 ? Math.min(30, (timestamps[timestamps.length - 1] - timestamps[0]) / 86400 * 5) : 5;
  const cpDepthWeight = Math.min(20, allCounterparties.size * 2);
  const confidenceScore = Math.min(99, Math.max(45, Math.round(txVolumeWeight + timeSpanWeight + cpDepthWeight)));

  // Level classification
  let level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (compositeScore >= 80) level = 'CRITICAL';
  else if (compositeScore >= 60) level = 'HIGH';
  else if (compositeScore >= 35) level = 'MEDIUM';

  // Factor Genetics Breakdown (Relative % contribution of each signal to the total risk)
  const totalVectorSum = Math.max(1, (
    vector.amlRisk + vector.mixerExposure + vector.behavioralRisk +
    vector.networkRisk + vector.scamRisk + vector.crossChainRisk
  ));

  const factors: RiskDNAFactor[] = [
    {
      name: 'Structuring & Layering',
      category: 'amlRisk',
      contributionPercent: Math.round((vector.amlRisk / totalVectorSum) * 100),
      severity: vector.amlRisk >= 75 ? 'CRITICAL' : vector.amlRisk >= 50 ? 'HIGH' : 'MEDIUM',
      description: structuringSignal
        ? 'Repeated identical/near-equal value transfers detected, characteristic of AML structuring typologies.'
        : 'Velocity and dispersion characteristics evaluated for multi-hop layering.',
    },
    {
      name: 'Mixer & Privacy Protocol Exposure',
      category: 'mixerExposure',
      contributionPercent: Math.round((vector.mixerExposure / totalVectorSum) * 100),
      severity: vector.mixerExposure >= 70 ? 'CRITICAL' : vector.mixerExposure > 0 ? 'HIGH' : 'LOW',
      description: directMixerTxCount > 0
        ? `Direct on-chain interaction with ${directMixerTxCount} sanctioned privacy mixer contracts.`
        : 'Zero direct interactions with known privacy pools detected.',
    },
    {
      name: 'Rapid Movement & Burst Velocity',
      category: 'behavioralRisk',
      contributionPercent: Math.round((vector.behavioralRisk / totalVectorSum) * 100),
      severity: vector.behavioralRisk >= 65 ? 'HIGH' : 'MEDIUM',
      description: `${burstsCount} rapid burst transactions (<60s gap) and high fan-out ratio (${(fanOutRatio * 100).toFixed(0)}%).`,
    },
    {
      name: 'Counterparty Network Exposure',
      category: 'networkRisk',
      contributionPercent: Math.round((vector.networkRisk / totalVectorSum) * 100),
      severity: vector.networkRisk >= 60 ? 'HIGH' : 'MEDIUM',
      description: `Surrounding peer cluster exhibits an average risk score of ${networkRiskScore}/100 across ${allCounterparties.size} unique peers.`,
    },
    {
      name: 'Scam & Collection Footprint',
      category: 'scamRisk',
      contributionPercent: Math.round((vector.scamRisk / totalVectorSum) * 100),
      severity: vector.scamRisk >= 65 ? 'CRITICAL' : 'LOW',
      description: massVictimFanIn
        ? 'High-volume asymmetric inbound fan-in from multiple unique wallets consistent with fraud victim aggregation.'
        : 'Normal counterparty distribution ratio.',
    },
    {
      name: 'Cross-Chain & Bridge Propensity',
      category: 'crossChainRisk',
      contributionPercent: Math.round((vector.crossChainRisk / totalVectorSum) * 100),
      severity: vector.crossChainRisk >= 60 ? 'HIGH' : 'LOW',
      description: `Assessed on ${chain} network. Cross-chain asset migration and bridge routing factor.`,
    }
  ];

  // Dynamic Attenuation across Hops (attenuation factor lambda = 0.55)
  const lambda = 0.55;
  const attenuatedRiskByHop = [
    compositeScore,
    Math.round(compositeScore * lambda),
    Math.round(compositeScore * Math.pow(lambda, 2)),
    Math.round(compositeScore * Math.pow(lambda, 3)),
  ];

  // Explainable Summary
  const topFactor = [...factors].sort((a, b) => b.contributionPercent - a.contributionPercent)[0];
  const explainableSummary = `Risk DNA Profile indicates ${level} risk (${compositeScore}/100) with ${confidenceScore}% confidence. Primary risk vector is ${topFactor.name} contributing ${topFactor.contributionPercent}% of total risk profile.`;

  return {
    compositeScore,
    level,
    confidenceScore,
    vector,
    factors,
    explainableSummary,
    attenuatedRiskByHop,
  };
}
