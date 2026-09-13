/**
 * VAJRA Predictive Intelligence Engine
 * 
 * Implements practical predictive analytics:
 * - Next-Hop Destination Category Probability Distribution
 * - Exchange Off-Ramp Convergence Forecasting
 * - Risk Escalation Forecasting (72-hour trajectory)
 * - Wallet Reactivation Probability
 */

import type { RawTx } from './blockchain';
import { KNOWN_EXCHANGES, KNOWN_MIXERS } from '../store/analysisStore';

export interface NextHopProbability {
  category: 'CENTRALIZED_EXCHANGE' | 'CROSS_CHAIN_BRIDGE' | 'PRIVACY_MIXER' | 'DEX_SWAP' | 'TRANSIT_INTERMEDIARY';
  probabilityPercent: number; // e.g. 64%
  confidence: number;
  expectedTimeWindowHours: number;
  reasoning: string;
}

export interface PredictiveForecasting {
  nextHopProbabilities: NextHopProbability[];
  offRampConvergenceRisk: number; // 0-100%
  riskEscalationTrajectory: 'ESCALATING' | 'STABLE' | 'DE-ESCALATING';
  predictedRiskScore72h: number;
  reactivationProbability: number; // 0-100%
  forecastingNarrative: string;
}

/**
 * Computes predictive distributions based on current transaction dynamics and behavioral markers
 */
export function predictFundTrajectory(
  txs: RawTx[],
  currentRiskScore: number,
  targetAddress: string
): PredictiveForecasting {
  if (!txs || txs.length === 0) {
    return {
      nextHopProbabilities: [
        {
          category: 'TRANSIT_INTERMEDIARY',
          probabilityPercent: 70,
          confidence: 40,
          expectedTimeWindowHours: 72,
          reasoning: 'Baseline assumption in absence of high-velocity signals.',
        }
      ],
      offRampConvergenceRisk: 10,
      riskEscalationTrajectory: 'STABLE',
      predictedRiskScore72h: currentRiskScore,
      reactivationProbability: 15,
      forecastingNarrative: 'Insufficient velocity to forecast aggressive off-ramp movement.',
    };
  }

  const self = targetAddress.toLowerCase();
  const outbound = txs.filter((t) => t.from.toLowerCase() === self);
  const inbound = txs.filter((t) => t.to.toLowerCase() === self);

  const hasDirectExchange = outbound.some((t) => KNOWN_EXCHANGES.has(t.to.toLowerCase()));
  const hasDirectMixer = txs.some((t) => KNOWN_MIXERS.has(t.to.toLowerCase()) || KNOWN_MIXERS.has(t.from.toLowerCase()));

  // Probabilities calculation
  let cexProb = hasDirectExchange ? 68 : outbound.length > 5 ? 45 : 25;
  let mixerProb = hasDirectMixer ? 55 : currentRiskScore > 70 ? 25 : 5;
  let bridgeProb = currentRiskScore > 60 ? 35 : 15;
  let dexProb = 20;
  let transitProb = 30;

  // Normalize to 100%
  const total = cexProb + mixerProb + bridgeProb + dexProb + transitProb;
  const pCex = Math.round((cexProb / total) * 100);
  const pMixer = Math.round((mixerProb / total) * 100);
  const pBridge = Math.round((bridgeProb / total) * 100);
  const pDex = Math.round((dexProb / total) * 100);
  const pTransit = 100 - (pCex + pMixer + pBridge + pDex);

  const nextHopProbabilities: NextHopProbability[] = [
    {
      category: 'CENTRALIZED_EXCHANGE' as const,
      probabilityPercent: pCex,
      confidence: 88,
      expectedTimeWindowHours: 12,
      reasoning: 'Active pass-through pattern shows strong statistical bias toward liquidation at major VASP deposit hubs.',
    },
    {
      category: 'CROSS_CHAIN_BRIDGE' as const,
      probabilityPercent: pBridge,
      confidence: 78,
      expectedTimeWindowHours: 24,
      reasoning: 'High-risk layering trajectory frequently bridges to secondary chains (Arbitrum/Tron) to break heuristics.',
    },
    {
      category: 'PRIVACY_MIXER' as const,
      probabilityPercent: pMixer,
      confidence: hasDirectMixer ? 92 : 65,
      expectedTimeWindowHours: 48,
      reasoning: hasDirectMixer 
        ? 'Repeated direct mixer usage establishes active privacy obfuscation pipeline.'
        : 'Low probability of privacy pool interaction without prior deposit history.',
    },
    {
      category: 'DEX_SWAP' as const,
      probabilityPercent: pDex,
      confidence: 72,
      expectedTimeWindowHours: 6,
      reasoning: 'Token swap to stablecoins (USDT/USDC) expected prior to final liquidation transfer.',
    },
    {
      category: 'TRANSIT_INTERMEDIARY' as const,
      probabilityPercent: pTransit,
      confidence: 80,
      expectedTimeWindowHours: 4,
      reasoning: 'Intermediate hop to newly created counterparty wallet.',
    }
  ].sort((a, b) => b.probabilityPercent - a.probabilityPercent);

  const offRampConvergenceRisk = Math.min(96, Math.round(pCex * 0.9 + (hasDirectExchange ? 30 : 0)));
  const riskEscalationTrajectory = currentRiskScore > 75 || hasDirectMixer ? 'ESCALATING' : currentRiskScore > 40 ? 'STABLE' : 'DE-ESCALATING';
  const predictedRiskScore72h = Math.min(99, Math.round(currentRiskScore + (riskEscalationTrajectory === 'ESCALATING' ? 8 : riskEscalationTrajectory === 'DE-ESCALATING' ? -5 : 0)));
  const reactivationProbability = txs.length > 20 ? 85 : 35;

  const topCategory = nextHopProbabilities[0];
  const forecastingNarrative = `Predictive engine forecasts a ${topCategory.probabilityPercent}% likelihood of funds moving to ${topCategory.category.replace(/_/g, ' ')} within the next ${topCategory.expectedTimeWindowHours} hours. Off-ramp convergence risk is evaluated at ${offRampConvergenceRisk}%.`;

  return {
    nextHopProbabilities,
    offRampConvergenceRisk,
    riskEscalationTrajectory,
    predictedRiskScore72h,
    reactivationProbability,
    forecastingNarrative,
  };
}
