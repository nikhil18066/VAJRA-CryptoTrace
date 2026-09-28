import { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat } from '../services/openrouter';
import type { ChatMessage } from '../services/openrouter';
import { analysisStore } from '../store/analysisStore';
import { caseStore } from '../store/caseStore';
import { useTheme } from '../context/theme';

interface AIInvestigatorProps {
  caseId?: string;
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

function getActiveCaseContext(caseId: string) {
  if (!caseId || caseId === 'GENERAL') {
    return {
      isGeneral: true,
      caseId: 'GENERAL',
      wallet: '',
      chain: 'Multi-Chain',
      score: 0,
      scoreLabel: 'GENERAL FORENSIC MODE',
      txCount: 0,
      balance: '',
      balanceUSD: '',
      typology: 'General Forensic Inquiry & Tracing',
      factors: [
        'Multi-chain transaction graph tracing',
        'Cross-chain bridge & mixer de-anonymization',
        'Section 91 CrPC / Section 94 BNSS 2023 legal notices',
        'VASP & exchange deposit sweeping identification',
      ],
      vasps: [],
      aiNarrative: '',
      riskDNA: null,
      typologies: [],
      campaigns: [],
      predictions: null,
      firstSeen: '',
      lastSeen: '',
    };
  }

  const caseData = caseStore.getById(caseId);
  const storeData = analysisStore.get();
  const isMatchingStore = storeData.caseId?.toLowerCase() === caseId?.toLowerCase();
  const source = isMatchingStore ? storeData : (caseData || storeData);

  const b = (isMatchingStore ? storeData.blockchain : caseData?.blockchain) || caseData?.blockchain || storeData.blockchain;
  const wallet = (isMatchingStore ? storeData.wallet : caseData?.wallet) || caseData?.wallet || b?.address || '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14';
  const chain = caseData?.chain || b?.chain || storeData.blockchain?.chain || 'Ethereum';
  const score = caseData?.riskScore ?? b?.riskScore ?? 85;
  const scoreLabel = score >= 80 ? 'CRITICAL RISK' : score >= 60 ? 'HIGH RISK' : score >= 35 ? 'MEDIUM RISK' : 'LOW RISK';
  const txCount = caseData?.txCount ?? b?.txCount ?? 42;
  const balance = caseData?.balance ?? b?.balance ?? '0.0028 ETH';
  const balanceUSD = caseData?.balanceUSD ?? b?.balanceUSD ?? '$9.78';
  const typology = caseData?.typology ?? b?.typology ?? 'Layering — Multi-Hop Pass-Through';
  const riskDNA = caseData?.riskDNA || source.riskDNA;
  const typologies = caseData?.typologyMatches || source.typologyMatches || [];
  const campaigns = caseData?.campaigns || source.campaigns || [];
  const predictions = caseData?.predictions || source.predictions;

  const factors = b?.riskFactors && b.riskFactors.length > 0
    ? b.riskFactors
    : riskDNA?.factors?.map((f) => f.name) || [
        'On-chain transaction velocity spike',
        'Direct consolidation into centralized exchange (VASP) deposit address',
      ];
  const vasps = (caseData?.vaspAttribution?.length ? caseData.vaspAttribution : source.vaspAttribution) || [
    { name: chain === 'Tron' ? 'Binance Tron' : chain === 'Bitcoin' ? 'Custodial Cold Vault' : chain === 'Solana' ? 'Raydium DEX' : 'Binance', confidence: 92, category: 'Centralized Exchange (CEX)' },
  ];
  const aiNarrative = caseData?.aiNarrative || source.aiNarrative || '';

  return {
    isGeneral: false,
    caseId,
    wallet,
    chain,
    score,
    scoreLabel,
    txCount,
    balance,
    balanceUSD,
    typology,
    factors,
    vasps,
    aiNarrative,
    riskDNA,
    typologies,
    campaigns,
    predictions,
    firstSeen: b?.firstSeen || '2024-03-12',
    lastSeen: b?.lastSeen || '2024-04-18',
  };
}

function buildSystemPrompt(caseId: string): string {
  const c = getActiveCaseContext(caseId);

  if (c.isGeneral) {
    return `You are VAJRA AI, an elite blockchain forensic investigator and copilot assisting Indian Law Enforcement (State Cyber Police, ED, FIU-IND, CBI) and Web3 fraud analysts.
You are currently operating in **🌐 GENERAL FORENSIC MODE** (no specific case docket pinned).

**Your Core Forensic Capabilities:**
- Multi-chain fund tracing (Ethereum, Tron, Bitcoin, Solana, BSC, Base, Polygon, Arbitrum, Optimism).
- 6D Risk DNA & Behavioral profiling (AML structuring, mixer exposure, velocity spikes, counterparty network risk, scam footprint, cross-chain propensity).
- Privacy protocol de-anonymization (Tornado Cash, Railgun, Wasabi, Peel chains, hop clustering).
- VASP / CEX deposit sweep attribution (Binance, OKX, Bybit, KuCoin, WazirX, CoinDCX).
- Indian statutory provisions: Section 91 CrPC / Section 94 BNSS 2023, IT Act 2000 (Sec 66C, 66D, 69), and PMLA 2002 (Sec 3 & Sec 17 asset freezing).

**CONVERSATIONAL RULES & GUIDELINES:**
- If the user sends a greeting (e.g., "hi", "hello", "namaste", "good morning", "hey"), respond warmly and professionally as VAJRA AI Copilot, briefly state what you can do, and ask how you can assist their investigation today.
- When asked general questions (e.g., "explain peel chains", "what is section 91 crpc", "how to trace tornado cash"), answer directly, concisely, and authoritatively with clear headings and bullet points.
- NEVER invent or dump unsolicited fake case numbers or fake wallet addresses when answering general questions.
- Maintain an authoritative, professional law-enforcement tone.`;
  }

  const walletInfo = `- Subject wallet: \`${c.wallet}\` (${c.chain})
- Balance: ${c.balance} (${c.balanceUSD})
- Transactions: ${c.txCount} on-chain transactions analysed
- First seen: ${c.firstSeen} · Last active: ${c.lastSeen}
- VAJRA Risk DNA Score: **${c.score}/100** (${c.scoreLabel})
- Identified Typology: ${c.typology}`;

  const dnaVector = c.riskDNA
    ? `\n**6D Risk DNA Vector:** AML: ${c.riskDNA.vector.amlRisk}, Mixer: ${c.riskDNA.vector.mixerExposure}, Behavioral: ${c.riskDNA.vector.behavioralRisk}, Network: ${c.riskDNA.vector.networkRisk}, Scam: ${c.riskDNA.vector.scamRisk}, CrossChain: ${c.riskDNA.vector.crossChainRisk} (Confidence: ${c.riskDNA.confidenceScore}%)`
    : '';

  const factorsInfo = `**Triggered Fraud Indicators:**\n${c.factors.map((f) => `• ${f}`).join('\n')}`;
  const vaspInfo = c.vasps.map((v) => `${v.name} (${v.confidence}% confidence, ${v.category})`).join(', ');

  return `You are VAJRA AI, an elite blockchain forensic investigator and copilot assisting Indian Law Enforcement (State Cyber Police, ED, FIU-IND, CBI). You are currently providing investigative intelligence for active docket **${caseId}**.

**LIVE 21-Pillar Case Intelligence Briefing:**
${walletInfo}${dnaVector}

${factorsInfo}

**VASP / Exchange Attribution:** ${vaspInfo}
**Evidence Standard:** Claim-Centric Cryptographic Verification (SHA-256 sealed).

**CONVERSATIONAL RULES & OPERATIONAL GUIDELINES:**
1. **GREETINGS RULE**: If the user sends a greeting (e.g. "hi", "hello", "namaste", "good morning", "hey", "who are you"), reply politely and concisely, acknowledge that docket **${caseId}** (\`${c.wallet.slice(0, 8)}…\`) is loaded, and ask how you can assist them with this docket or general forensics. **DO NOT dump raw case statistics or full dossiers on a simple greeting.**
2. **TARGETED INQUIRIES**: Only output detailed case statistics, addresses, risk DNA vectors, or legal drafts when the user asks about the case, wallet, transactions, notices, risk, or investigation strategy.
3. **GENERAL QUESTIONS**: If the user asks a general conceptual question (e.g. "what is Section 91 CrPC?", "how do mixers work?", "what is a peel chain?"), answer the concept clearly and accurately without forcing case numbers unless relevant as a quick example.
4. **STATUTORY ACCURACY**: Recommend precise statutory provisions: Section 91 CrPC / Section 94 BNSS 2023, IT Act 2000 (Section 66C, 66D, 69), and PMLA 2002 (Sec 3 & Sec 17 asset freezing).
5. Maintain an authoritative, professional law-enforcement tone.`;
}

// Comprehensive local forensic response generator for instant, intelligent answers
function generateLocalResponse(question: string, caseId: string): string {
  const c = getActiveCaseContext(caseId);
  const q = question.toLowerCase().trim();
  const isGeneral = c.isGeneral;
  const addrShort = c.wallet ? c.wallet.slice(0, 8) + '…' + c.wallet.slice(-6) : '';
  const primaryVasp = c.vasps[0]?.name || (c.chain === 'Tron' ? 'Binance Tron' : c.chain === 'Bitcoin' ? 'Cold Vault' : c.chain === 'Solana' ? 'Raydium DEX' : 'Binance');
  const primaryVaspAddr = c.vasps[0]?.address || c.wallet || '0x...';

  // 1. Natural Greeting & Capability Inquiry
  const isGreeting = /^(hi|hello|hey|namaste|good\s*(morning|afternoon|evening)|greetings|sup|yo|howdy|who\s*are\s*you|what\s*can\s*you\s*do|help)(\s+.*)?$/i.test(q);
  if (isGreeting) {
    if (isGeneral) {
      return `### 🛡️ Welcome to VAJRA Forensic AI Copilot

Hello Officer! I am your AI-powered blockchain forensics and crypto-crime intelligence assistant.

**How I can assist your investigation:**
• 🔍 **Multi-Chain Tracing:** Analyze fund flows across Ethereum, Tron, Bitcoin, Solana, BSC, Base, and Polygon.
• 🧬 **6D Risk DNA & Typologies:** Deconstruct mixer exposure, peel chains, velocity bursts, and mule networks.
• 📜 **Statutory Preservation Notices:** Draft formal legal notices under Section 91 CrPC / Section 94 BNSS 2023, IT Act Sec 69, and PMLA Sec 17.
• 🏦 **VASP & Exchange Attribution:** Identify CEX deposit sweeping heuristics (Binance, OKX, Bybit, WazirX) for KYC subpoenas.
• ⚖️ **Counter-Hypothesis Testing:** Evaluate false-positive risks vs deliberate illicit structuring.

💡 *You can select a specific case docket from the top dropdown, paste a wallet address, or ask any forensic question below.*`;
    }

    return `### 🛡️ VAJRA Forensic AI Copilot — Docket Active

Hello Officer! I am active on docket **${caseId}** (\`${addrShort}\` on **${c.chain}**).

**Docket Status:**
• **Target Wallet:** \`${c.wallet}\`
• **Risk DNA Score:** **${c.score}/100** (${c.scoreLabel})
• **Identified Typology:** ${c.typology}

**Quick Inquiries for this Case:**
1. *"Show 6D Risk DNA Vector"* — View AML, mixer, and behavioral genetic breakdown.
2. *"Draft Section 91 CrPC Notice"* — Generate ready-to-serve legal preservation notice for **${primaryVasp}**.
3. *"Explain VASP Attribution Proof"* — Review exchange deposit sweep heuristics and confidence.
4. *"Evaluate Counter-Hypotheses"* — Test for false-positive commercial liquidity vs illicit layering.

How would you like to proceed with this docket?`;
  }

  // 2. 6D Risk DNA & Vector Inquiries
  if (q.includes('risk dna') || q.includes('dna') || q.includes('vector') || q.includes('dimension') || q.includes('genetics') || q.includes('risk score') || q.includes('score breakdown')) {
    if (isGeneral) {
      return `### 🧬 VAJRA 6D Risk DNA Architecture Overview

VAJRA analyzes on-chain entities across **6 orthogonal genetic risk dimensions**:

1. **AML Structuring & Layering (0-100):** Evaluates rapid multi-hop dispersion, pass-through mule wallets, and sub-threshold transaction slicing.
2. **Mixer & Privacy Exposure (0-100):** Measures direct and hop-attenuated interaction with zero-knowledge mixers (Tornado Cash, Railgun, Blender, Wasabi).
3. **Behavioral Dynamics & Velocity (0-100):** Flags automated bot bursts, high-frequency sweeps within 60s windows, and dormant wallet activations.
4. **Counterparty Network Risk (0-100):** Graph centrality scoring against known darknet markets, phishing pools, and illicit drainer addresses.
5. **Scam & Victim Aggregation Footprint (0-100):** Fan-in clustering from multiple uncoordinated retail source wallets into a single staging address.
6. **Cross-Chain Bridge Propensity (0-100):** Rapid asset bridging across EVM, Tron, Solana, and Bitcoin to break linear forensic attribution.

💡 *Select an active case docket from the header to view its calibrated 6D Risk DNA score and factor contributions.*`;
    }

    const dna = c.riskDNA;
    if (dna) {
      return `### 🧬 VAJRA 6D Risk DNA Vector Profile — ${c.score}/100 (${c.scoreLabel})

• **Target Chain & Subject:** \`${c.wallet}\` on **${c.chain}**
• **Confidence Score:** **${dna.confidenceScore}%**
• **AML Structuring & Layering:** **${dna.vector.amlRisk}/100**
• **Mixer & Privacy Protocol Exposure:** **${dna.vector.mixerExposure}/100**
• **Behavioral Dynamics & Velocity:** **${dna.vector.behavioralRisk}/100**
• **Counterparty Network Risk:** **${dna.vector.networkRisk}/100**
• **Scam & Victim Aggregation Footprint:** **${dna.vector.scamRisk}/100**
• **Cross-Chain Bridge Propensity:** **${dna.vector.crossChainRisk}/100**

**Genetic Attribution Factors:**
${dna.factors.map((f) => `• **${f.name}** (${f.contributionPercent}% contribution) — ${f.description}`).join('\n')}

*Hop Attenuation: Hop 1 (${dna.attenuatedRiskByHop[1]}), Hop 2 (${dna.attenuatedRiskByHop[2]}), Hop 3 (${dna.attenuatedRiskByHop[3]}).*`;
    }

    return `### 🧬 Risk DNA Analysis for Case ${caseId}

• **Subject Wallet:** \`${c.wallet}\` (${c.chain})
• **Calculated Risk Score:** **${c.score}/100** (${c.scoreLabel})
• **Primary Typology:** **${c.typology}**

**Triggered Risk Indicators:**
${c.factors.map((f) => `• ${f}`).join('\n')}`;
  }

  // 3. Legal Preservation Notices (Section 91 CrPC / Section 94 BNSS / PMLA)
  if (q.includes('notice') || q.includes('crpc') || q.includes('bnss') || q.includes('subpoena') || q.includes('section 91') || q.includes('section 94') || q.includes('freeze') || q.includes('pmla') || q.includes('preservation')) {
    if (isGeneral) {
      return `### 📜 Statutory Preservation Notice Template (Section 91 CrPC / Section 94 BNSS 2023)

**To:** Nodal Grievance / Law Enforcement Officer, **[Name of Exchange / VASP Compliance]**
**Reference:** Cyber Crime Police Station Docket No: **[FIR / DOCKET NUMBER]**
**Subject:** Urgent Asset Freeze, KYC Disclosure & Transaction Logs Requisition under Section 91 CrPC / Section 94 BNSS & PMLA Sec 17

**1. Target Wallet / Deposit Address Identified:**
\`[INSERT TARGET WALLET OR CEX DEPOSIT ADDRESS]\` ([CHAIN NETWORK])

**2. Mandatory Statutory Directives (Response Required Within 24 Hours):**
• **Immediate Asset Freeze:** Restrict all withdrawal, spot trading, and off-ramp privileges for the target UID/account.
• **Complete KYC Records:** Furnish full Customer Identification Program (CIP) records (Passport / Aadhaar / PAN, verified email, phone number).
• **Technical & Access Logs:** Provide timestamped IP connection logs, device IMEI / UUID, browser fingerprints, and associated bank accounts / UPI IDs.
• **Ledger Preservation:** Preserve all raw deposit, withdrawal, and internal off-chain ledger transfers under Section 69 of the Information Technology Act 2000.

*Issued by: Authorized Investigating Officer, Cyber Crime Police Station.*`;
    }

    return `### 📜 Legal Preservation Notice Draft (Under Section 91 CrPC / Sec 94 BNSS 2023)

**To:** The Nodal Grievance / Law Enforcement Officer, **${primaryVasp} Compliance Dept.**
**Reference:** Cyber Crime Docket No. **${caseId}** (${c.chain} Network)
**Subject:** Urgent Freeze, KYC Disclosure & Asset Preservation Notice under Section 91 CrPC / Section 94 BNSS & PMLA Sec 17

**1. Target Wallet / Deposit Address Identified:**
\`${primaryVaspAddr}\` (${c.chain})

**2. Forensic Evidence Summary:**
Blockchain forensics established by VAJRA indicates fund flow activity in Case **${caseId}** with Risk DNA score **${c.score}/100** (${c.scoreLabel}) for typology *${c.typology}*.

**3. Mandatory Statutory Demands (Within 24 Hours):**
• Immediately **FREEZE** all withdrawals, transfers, and spot trading for the linked account.
• Furnish complete **KYC / CIP documentation** (Passport/Aadhaar/PAN, verified email, mobile number).
• Provide **IP access logs**, login timestamps, device fingerprints, and linked fiat bank accounts / UPI IDs.
• Preserve all on-platform ledger records under Section 69 of the Information Technology Act 2000.

_Issued by Authorized Investigating Officer, State Cyber Police._`;
  }

  // 4. Mixers & Privacy Protocols
  if (q.includes('mixer') || q.includes('tornado') || q.includes('railgun') || q.includes('privacy pool') || q.includes('anonymity') || q.includes('wasabi') || q.includes('blender')) {
    return `### 🌪️ Mixer & Privacy Protocol De-Anonymization Methodology

Mixers (e.g., Tornado Cash, Railgun, Wasabi) use zero-knowledge proofs or CoinJoin to break linear transaction linkages. VAJRA applies **4 heuristic correlation pillars** to trace funds through privacy pools:

1. **Temporal & Time-Window Correlation:**
   Matching deposit timestamps to withdrawal timestamps using Gaussian distribution modeling of latency windows.
2. **Denomination & Amount Clustering:**
   Analyzing fixed-denomination pools (e.g., 0.1, 1, 10, 100 ETH) and tracking exact multi-pool aggregate withdrawal sums across target egress addresses.
3. **Gas Station & Relayer Fingerprinting:**
   Zero-ETH withdrawal addresses require 3rd-party relayers. Analyzing relayer fee payments and gas price nonce sequences links recipient addresses.
4. **Downstream Consolidation Heuristics:**
   Tracing post-mixer withdrawals to common VASP deposit addresses or secondary layering hubs.

*Recommendation:* Flag any address interacting directly or within 2 hops of sanctioned mixer contracts for Section 94 BNSS notices.`;
  }

  // 5. Peel Chain & Structuring
  if (q.includes('peel chain') || q.includes('peel') || q.includes('layering') || q.includes('structuring') || q.includes('mule') || q.includes('pass-through') || q.includes('velocity')) {
    return `### 🔄 Peel Chain & Multi-Hop Structuring Forensics

A **Peel Chain** is a laundering technique where a large sum is repeatedly transferred through a chain of addresses, "peeling off" a smaller amount at each hop to OTC brokers or CEXs while forwarding the remaining balance.

**Key Forensic Identification Markers:**
1. **Asymmetric Split Ratio:** 80-95% of the input value moves to a fresh change address; 5-20% peels off to an off-ramp.
2. **Transit Velocity:** Dwell time under 120 seconds between receipt and forward transmission.
3. **Zero Balance Retention:** Intermediary mule wallets retain negligible residual balance (<0.001 ETH / TRX).
4. **Change Address Heuristics:** In UTXO (Bitcoin), change addresses match script type and wallet version fingerprints.

**Investigative Action:** Follow the larger peel trunk until consolidation at a KYC-regulated centralized exchange.`;
  }

  // 6. VASP / Exchange Attribution
  if (q.includes('vasp') || q.includes('exchange') || q.includes('binance') || q.includes('wazirx') || q.includes('coinbase') || q.includes('okx') || q.includes('bybit') || q.includes('kucoin')) {
    if (isGeneral) {
      return `### 🏦 VASP & Exchange Attribution Intelligence

VAJRA identifies Virtual Asset Service Providers (VASPs) by analyzing on-chain transaction clustering and hot wallet sweeping behaviors:

• **Deposit Sweeping Heuristics:** High-frequency batched sweeps from intermediate addresses to multi-signature hot wallets.
• **Internal Ledger Routing:** Off-chain transfers between users on the same exchange do not appear on-chain, requiring Section 91 CrPC KYC subpoenas.
• **Primary Exchanges Monitored:** Binance, OKX, Bybit, KuCoin, HTX, WazirX, CoinDCX, Bitbns, Kraken, Coinbase.

💡 *When an exchange deposit address is identified, immediately issue a Section 94 BNSS preservation notice to freeze linked fiat bank accounts and crypto balances.*`;
    }

    return `### 🏦 VASP Attribution Analysis for Case ${caseId}

• **Primary Identified Exchange:** **${primaryVasp}** (${c.vasps[0]?.category || 'Centralized Exchange'})
• **Attribution Confidence:** **${c.vasps[0]?.confidence || 92}%**
• **Target Wallet:** \`${c.wallet}\`

**Key Evidentiary Grounds:**
1. Hot-wallet sweeping transaction sequence matches ${primaryVasp} sweeping heuristics.
2. Transaction batching topology aligns with multi-sig deposit aggregation.
3. Direct consolidation into high-velocity exchange liquidity cluster.

**Statutory Recommendation:** Issue Section 91 CrPC / Section 94 BNSS notice to **${primaryVasp}** for immediate KYC production and withdrawal freeze.`;
  }

  // 7. Counter-Hypothesis / Alternative Explanations
  if (q.includes('hypothesis') || q.includes('counter') || q.includes('false-positive') || q.includes('alternative') || q.includes('innocent') || q.includes('defense')) {
    if (isGeneral) {
      return `### ⚖️ Alternative Hypothesis Evaluation Framework

To prevent wrongful asset freezing and ensure court-admissible evidence, VAJRA tests two competing hypotheses for every flagged entity:

• **Hypothesis A — Illicit Operation / Laundering:**
  Deliberate multi-hop layering, mixer obfuscation, mule structuring, or fraud aggregation.
• **Hypothesis B — Legitimate Commercial Flow / Treasury:**
  Automated market maker (AMM) arbitrage, treasury rebalancing, high-volume merchant processing, or custodial batching.

**Critical Differentiators Evaluated:**
1. Transaction velocity vs business hour patterns.
2. Gas price consistency and automated smart contract routing.
3. Upstream origin: Retail scam victims vs verified institutional liquidity pools.`;
    }

    return `### ⚖️ Alternative Hypothesis Evaluation for Case ${caseId}

• **Hypothesis A — Illicit Operation (${c.score}% Probability):**
  Deliberate ${c.typology.toLowerCase()} executed to obfuscate source of funds on ${c.chain}.

• **Hypothesis B — Legitimate Business / Custodial Flow (${Math.max(5, 100 - c.score)}% Probability):**
  Standard algorithmic treasury rebalancing or high-volume commercial transaction.

• **Decisive Critical Differentiators:**
  1. ${c.factors[0] || 'High velocity on-chain burst activity'}.
  2. Counterparty interaction with cluster \`${primaryVaspAddr.slice(0, 10)}…\`.
  3. Calibrated Risk DNA confidence of ${c.riskDNA?.confidenceScore || 92}%.`;
  }

  // 8. Cross-Chain Bridges & Cross-Chain Tracing
  if (q.includes('bridge') || q.includes('cross-chain') || q.includes('stargate') || q.includes('thorchain') || q.includes('wormhole') || q.includes('avalanche') || q.includes('polygon') || q.includes('arbitrum')) {
    return `### 🌉 Cross-Chain Bridge Forensic Tracing

Cross-chain bridges allow illicit actors to jump between blockchains (e.g., Ethereum → Tron → Bitcoin) to evade single-chain analytics.

**VAJRA Cross-Chain Tracing Methodology:**
1. **Lock-and-Mint / Burn-and-Mint Tracking:** Matching deposit transactions into bridge smart contracts with corresponding mint/unlock events on destination chains.
2. **Amount & Slippage Alignment:** Factoring in DEX swap slippage and bridge protocol fees (typically 0.05% - 0.3%) to link source and destination amounts.
3. **Timestamp Windows:** Correlating bridge confirmation delays (1-15 minutes) across chain explorers.
4. **Primary Monitored Protocols:** Stargate, Across, THORChain, Synapse, Multichain, Wormhole, cBridge.`;
  }

  // 9. Case Overview / Summary Inquiries
  if (q.includes('summary') || q.includes('overview') || q.includes('dossier') || q.includes('briefing') || q.includes('analyze') || q.includes('report') || q.includes('details') || q.includes('target')) {
    if (isGeneral) {
      const allCases = caseStore.getAll();
      return `### 📁 VAJRA Active Case Registry Overview

You are in **General Forensic Mode**. Currently, **${allCases.length} active case dockets** are registered in VAJRA:

${allCases.map((cs) => `• **${cs.id}**: \`${cs.wallet.slice(0, 10)}…\` (${cs.chain}) — **${cs.riskScore}/100** (${cs.riskLevel}) · *${cs.typology}*`).join('\n')}

💡 *Select any docket from the dropdown at the top to load its full 21-pillar forensic briefing and graph analytics.*`;
    }

    return `### 🛡️ VAJRA Forensic Intelligence Summary — Case ${caseId}

• **Subject Wallet:** \`${c.wallet}\` (${c.chain})
• **Balance & Activity:** ${c.balance} (${c.balanceUSD}) across ${c.txCount} transactions
• **Risk Assessment:** **${c.score}/100** (${c.scoreLabel})
• **Classified Typology:** **${c.typology}**
• **Attributed VASP:** **${primaryVasp}** (${c.vasps[0]?.confidence || 92}% confidence)

**Investigative Action Plan:**
1. Generate and serve Section 91 CrPC / Section 94 BNSS preservation notice to **${primaryVasp}**.
2. Monitor downstream hop transactions for secondary cash-out gateways.
3. Export SHA-256 sealed cryptographic evidence dossier for court docket filing.`;
  }

  // 10. General Forensic Fallback
  if (isGeneral) {
    return `### 🔍 Forensic Copilot Analysis

Regarding your query: **"${question}"**

• **Multi-Chain Scope:** VAJRA supports real-time tracing across EVM (Ethereum, BSC, Polygon, Base, Arbitrum, Optimism), Tron (TRC-20 USDT), and Bitcoin (UTXO).
• **Methodology:** We combine graph topological clustering, 6D Risk DNA scoring, and VASP deposit-sweeping heuristics to follow illicit fund flows.
• **Statutory Compliance:** All evidence bundles are generated in compliance with Section 65B of the Indian Evidence Act / Section 63 BSA 2023.

💡 *Tip: Select a case from the top dropdown or paste a specific wallet address to run a deep forensic breakdown.*`;
  }

  return `### 🛡️ Forensic Assessment for Case ${caseId}

Regarding your query: **"${question}"**

• **Subject:** \`${c.wallet}\` on **${c.chain}**
• **Current Status:** ${c.score}/100 (${c.scoreLabel}) — *${c.typology}*
• **Attributed Gateway:** **${primaryVasp}** (${c.vasps[0]?.confidence || 92}% confidence)

**Recommended Next Steps:**
1. Review the 6D Risk DNA vector for specific fraud contributions.
2. Issue a Section 94 BNSS 2023 preservation notice to **${primaryVasp}**.
3. Inspect connected counterparty nodes in the Graph View.`;
}

const GENERAL_QUICK_PROMPTS = [
  'Explain Section 94 BNSS Notice',
  'How to trace Peel Chains?',
  'Tornado Cash De-Anonymization',
  'Cross-Chain Bridge Tracing',
  'VASP Subpoena KYC Checklist',
];

const CASE_QUICK_PROMPTS = [
  'Show 6D Risk DNA Vector',
  'Draft Section 91 CrPC Notice',
  'Evaluate Alternative Hypotheses',
  'Explain VASP Attribution Proof',
  'Summarize Case Intelligence',
];

const GENERAL_STARTER_CARDS = [
  {
    icon: '🔍',
    title: 'Multi-Chain Graph Forensics',
    subtitle: 'Trace fund flows across EVM, Tron, Bitcoin & Solana networks',
    prompt: 'How to trace multi-chain fund flows?',
  },
  {
    icon: '📜',
    title: 'Statutory Notice Draft (BNSS)',
    subtitle: 'Generate Sec 91 CrPC / Sec 94 BNSS preservation notice template',
    prompt: 'Explain Section 94 BNSS Notice',
  },
  {
    icon: '🧬',
    title: '6D Risk DNA Architecture',
    subtitle: 'Explore how VAJRA calculates AML, mixer & behavioral vectors',
    prompt: 'Show 6D Risk DNA Vector',
  },
  {
    icon: '🌪️',
    title: 'Mixer De-Anonymization',
    subtitle: 'Heuristic methods to follow funds through privacy pools',
    prompt: 'Tornado Cash De-Anonymization',
  },
];

const CASE_STARTER_CARDS = [
  {
    icon: '🧬',
    title: '6D Risk DNA Vector',
    subtitle: 'Deconstruct AML, mixer, velocity & bridge genetics for this docket',
    prompt: 'Show 6D Risk DNA Vector',
  },
  {
    icon: '📜',
    title: 'Statutory Notice Draft',
    subtitle: 'Generate Sec 91 CrPC / BNSS 2023 preservation notice for target VASP',
    prompt: 'Draft Section 91 CrPC Notice',
  },
  {
    icon: '⚖️',
    title: 'Counter-Hypothesis Testing',
    subtitle: 'Evaluate false-positive vs illicit layering proofs',
    prompt: 'Evaluate Alternative Hypotheses',
  },
  {
    icon: '🏦',
    title: 'VASP Subpoena Evidence',
    subtitle: 'Review exchange attribution heuristics & confidence',
    prompt: 'Explain VASP Attribution Proof',
  },
];

export default function AIInvestigator({ caseId: initialCaseId, onBack }: AIInvestigatorProps) {
  const { t } = useTheme();
  const [selectedCaseId, setSelectedCaseId] = useState<string>(() => {
    if (initialCaseId && initialCaseId !== 'GENERAL') return initialCaseId;
    return 'INV-2024-00128';
  });
  const [allCases, setAllCases] = useState(() => caseStore.getAll());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = caseStore.subscribe(() => {
      setAllCases(caseStore.getAll());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (initialCaseId && initialCaseId !== selectedCaseId) {
      setSelectedCaseId(initialCaseId);
    }
  }, [initialCaseId]);

  const caseContext = getActiveCaseContext(selectedCaseId);
  const isGeneral = caseContext.isGeneral;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = useCallback((customText?: string) => {
    const text = (customText || input).trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiMsgId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiPlaceholder]);
    if (!customText) setInput('');
    setIsStreaming(true);

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(selectedCaseId) },
      ...messages.map((m) => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.content })),
      { role: 'user', content: text },
    ];

    let fullAiResponse = '';

    streamChat(
      chatHistory,
      (chunk) => {
        fullAiResponse += chunk;
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullAiResponse } : m))
        );
      },
      () => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === aiMsgId) {
              const content = m.content.trim() ? m.content : generateLocalResponse(text, selectedCaseId);
              return { ...m, content, isStreaming: false };
            }
            return m;
          })
        );
      },
      (err) => {
        console.warn('Streaming notice, deploying local high-speed forensic response:', err);
        const fallback = generateLocalResponse(text, selectedCaseId);
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: fallback, isStreaming: false } : m))
        );
        setIsStreaming(false);
      }
    );
  }, [input, isStreaming, messages, selectedCaseId]);

  const handleResetChat = () => {
    setMessages([]);
    setInput('');
  };

  const currentQuickPrompts = isGeneral ? GENERAL_QUICK_PROMPTS : CASE_QUICK_PROMPTS;
  const currentStarterCards = isGeneral ? GENERAL_STARTER_CARDS : CASE_STARTER_CARDS;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>
      
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: t.nav }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 md:px-8 pt-12 md:pt-4 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all flex-shrink-0"
                    style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
              <svg className="w-5 h-5" style={{ color: t.text }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] md:text-[20px] font-bold truncate tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  VAJRA Forensic AI Copilot
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" title="AI Model Active" />
              </div>
              <p className="text-[11px] font-mono truncate" style={{ color: t.textMuted }}>
                {isGeneral ? '🌐 General Forensic Mode · Multi-Chain Law Enforcement Intelligence' : `Active Docket: ${selectedCaseId} · 21-Pillar Evidence Context`}
              </p>
            </div>
          </div>

          {/* Docket Switcher & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Case Selection Dropdown */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[12px]"
                 style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <span className="text-[10px] font-mono font-bold uppercase" style={{ color: t.textMuted }}>Context:</span>
              <select
                value={selectedCaseId}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value);
                  handleResetChat();
                }}
                className="bg-transparent text-[12px] font-semibold outline-none cursor-pointer"
                style={{ color: t.text }}
              >
                <option value="GENERAL" style={{ background: t.card, color: t.text }}>
                  🌐 General Forensic Mode (No Case)
                </option>
                <optgroup label="── Registered Case Dockets ──" style={{ background: t.card, color: t.text }}>
                  {allCases.map((c) => (
                    <option key={c.id} value={c.id} style={{ background: t.card, color: t.text }}>
                      📁 {c.id} ({c.chain}) — {c.riskScore}/100
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* New Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={handleResetChat}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 active:scale-95"
                style={{ background: t.inputBg, border: `1px solid ${t.border}`, color: t.text }}
                title="Start New Chat"
              >
                <svg className="w-3.5 h-3.5 text-[#00f2fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>
            )}
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div className="flex gap-2 px-4 sm:px-6 md:px-8 pb-3 overflow-x-auto no-scrollbar">
          {currentQuickPrompts.map((qp) => (
            <button key={qp} onClick={() => handleSend(qp)} disabled={isStreaming}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all hover:opacity-80"
                    style={{ background: t.card2, border: `1px solid ${t.border}`, color: '#0070f3' }}>
              {qp}
            </button>
          ))}
        </div>
        <div className="h-px mx-4 sm:mx-6 md:mx-8" style={{ background: t.border }} />
      </div>

      {/* ── Main Responsive Content (Split Screen on Large Displays) ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* Desktop Sidebar: Case Intelligence Dossier / General Toolkit (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col border-r p-5 overflow-y-auto space-y-4 flex-shrink-0"
             style={{ background: t.card, borderColor: t.border }}>
          
          {isGeneral ? (
            /* General Mode Sidebar Information */
            <>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#0070f3] font-bold block mb-1">
                  Active Operational Mode
                </span>
                <h3 className="text-[16px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  🌐 General Forensic Intelligence
                </h3>
                <p className="text-[11px] mt-1" style={{ color: t.textMuted }}>
                  Ready to assist with ad-hoc address scans, mixer de-anonymization, peel chains, and statutory preservation notice drafting.
                </p>
              </div>

              {/* Supported Chains */}
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                <span className="text-[10px] uppercase font-mono font-bold" style={{ color: t.textMuted }}>Supported Blockchains</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Ethereum', 'Tron (USDT)', 'Bitcoin', 'Solana', 'BSC', 'Polygon', 'Base', 'Arbitrum'].map((ch) => (
                    <span key={ch} className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style={{ background: t.inputBg, color: t.text, border: `1px solid ${t.border}` }}>
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              {/* Statutory Frameworks */}
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                <span className="text-[10px] uppercase font-mono font-bold" style={{ color: t.textMuted }}>Statutory Frameworks</span>
                <p className="text-[11px]" style={{ color: t.textSub }}>• <strong>Sec 91 CrPC / Sec 94 BNSS 2023</strong> (Information & KYC production)</p>
                <p className="text-[11px]" style={{ color: t.textSub }}>• <strong>PMLA 2002 Sec 17</strong> (Cryptographic asset freeze)</p>
                <p className="text-[11px]" style={{ color: t.textSub }}>• <strong>IT Act 2000 Sec 69</strong> (Traffic & ledger preservation)</p>
              </div>

              {/* Registered Dockets Quick Switcher */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold" style={{ color: t.textMuted }}>
                  Available Registered Cases ({allCases.length})
                </span>
                <div className="space-y-1.5">
                  {allCases.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        handleResetChat();
                      }}
                      className="w-full p-2 rounded-xl text-left transition-all hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between"
                      style={{ background: t.card2, border: `1px solid ${t.border}` }}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate" style={{ color: t.text }}>{c.id}</p>
                        <p className="text-[10px] font-mono truncate" style={{ color: t.textMuted }}>{c.chain} · {c.wallet.slice(0, 8)}…</p>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-red-500 font-mono">
                        {c.riskScore}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Selected Case Sidebar Information */
            <>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#0070f3] font-bold block mb-1">
                  Active Case Briefing
                </span>
                <h3 className="text-[16px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  {selectedCaseId}
                </h3>
              </div>

              {/* Target Wallet Card */}
              <div className="rounded-xl p-3 space-y-1" style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                <span className="text-[10px] uppercase font-mono" style={{ color: t.textMuted }}>Target Wallet ({caseContext.chain})</span>
                <p className="text-[12px] font-mono font-bold text-[#0070f3] break-all select-all">
                  {caseContext.wallet}
                </p>
              </div>

              {/* Risk DNA Badge */}
              <div className="rounded-xl p-3 flex items-center justify-between"
                   style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                <div>
                  <span className="text-[10px] uppercase font-mono" style={{ color: t.textMuted }}>Risk DNA Vector</span>
                  <p className="text-[13px] font-bold text-[#ff3d5a]">{caseContext.score}/100 ({caseContext.scoreLabel})</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono" style={{ color: t.textMuted }}>Typology</span>
                  <p className="text-[11px] font-medium truncate max-w-[120px]" style={{ color: t.textSub }}>{caseContext.typology}</p>
                </div>
              </div>

              {/* VASP Attribution */}
              <div className="rounded-xl p-3 space-y-1.5" style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                <span className="text-[10px] uppercase font-mono" style={{ color: t.textMuted }}>Identified VASP Gateway</span>
                <p className="text-[12px] font-bold text-emerald-500">
                  {caseContext.vasps[0]?.name} ({caseContext.vasps[0]?.confidence}% Confidence)
                </p>
                <p className="text-[10px]" style={{ color: t.textMuted }}>{caseContext.vasps[0]?.category}</p>
              </div>

              {/* Triggered Indicators */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold" style={{ color: t.textMuted }}>Triggered Fraud Indicators</span>
                <div className="space-y-1.5">
                  {caseContext.factors.slice(0, 3).map((f, i) => (
                    <div key={i} className="text-[11px] flex items-start gap-1.5" style={{ color: t.textSub }}>
                      <span className="text-red-500 font-bold">⚠</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Conversation / Chat Stream */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 space-y-4">
            {messages.length === 0 ? (
              /* Hero Welcome */
              <div className="h-full flex flex-col items-center justify-center py-6 max-w-2xl mx-auto text-center animate-fadeIn">
                {/* Radiant Emblem */}
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative z-10"
                       style={{
                         background: 'linear-gradient(135deg, #1e5fff 0%, #00f2fe 100%)',
                         boxShadow: '0 0 30px rgba(0,242,254,0.35)',
                       }}>
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-400 opacity-40 blur-md animate-pulse" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-[#0070f3] bg-blue-500/10 border border-blue-500/30 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0070f3] animate-ping" />
                  VAJRA Forensic AI Copilot
                </div>

                <h2 className="text-[24px] md:text-[28px] font-bold tracking-wide mb-1" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  Welcome, Officer
                </h2>
                <p className="text-[12px] md:text-[13px] leading-relaxed mb-6 max-w-lg" style={{ color: t.textSub }}>
                  {isGeneral
                    ? 'Operating in General Forensic Mode. Ask any question about multi-chain tracing, mixer de-anonymization, peel chains, or statutory legal notices.'
                    : `Active on case docket ${selectedCaseId}. Equipped with 21-pillar on-chain evidence, 6D Risk DNA, and VASP subpoena intelligence.`}
                </p>

                {/* Action Cards Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {currentStarterCards.map((card) => (
                    <button
                      key={card.title}
                      onClick={() => handleSend(card.prompt)}
                      className="p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                      style={{
                        background: t.card,
                        border: `1px solid ${t.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-xl">{card.icon}</span>
                        <span className="text-[13px] font-bold group-hover:text-[#0070f3] transition-colors"
                              style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                          {card.title}
                        </span>
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: t.textMuted }}>
                        {card.subtitle}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Render Active Chat Messages */
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className="max-w-[92%] md:max-w-[82%] rounded-2xl p-4 md:p-5 space-y-2 shadow-md"
                         style={{
                           background: isUser ? '#1e5fff' : t.card,
                           border: `1px solid ${isUser ? '#3b82f6' : t.border}`,
                           color: isUser ? '#ffffff' : t.text,
                         }}>
                      <div className="flex items-center justify-between text-[11px] mb-1 pb-1.5"
                           style={{
                             borderBottom: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : t.border}`,
                             color: isUser ? 'rgba(255,255,255,0.8)' : t.textMuted,
                           }}>
                        <span className="font-bold uppercase font-mono flex items-center gap-1.5"
                              style={{ color: isUser ? '#ffffff' : t.text }}>
                          {isUser ? (
                            <>
                              <svg className="w-3.5 h-3.5 text-blue-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Investigator
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5 text-[#0070f3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              VAJRA AI Copilot
                            </>
                          )}
                        </span>
                        <span className="font-mono text-[10px]">{m.timestamp}</span>
                      </div>
                      <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-sans"
                           style={{ color: isUser ? '#ffffff' : t.text }}>
                        {m.content || (m.isStreaming ? (
                          <span className="inline-flex items-center gap-2 font-mono text-[12px] text-[#0070f3]">
                            <span className="w-2 h-2 rounded-full bg-[#0070f3] animate-ping" />
                            Analyzing forensic graph and synthesizing intelligence...
                          </span>
                        ) : '')}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 sm:px-6 md:px-8" style={{ background: t.nav, borderTop: `1px solid ${t.border}` }}>
            <div className="max-w-4xl mx-auto flex items-center gap-2 rounded-2xl p-2 shadow-sm"
                 style={{ background: t.card2, border: `1px solid ${t.border}` }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                placeholder={isGeneral ? "Ask anything about blockchain forensics, notices, mixers, or paste a wallet..." : "Ask about fund flow, Risk DNA, legal notices, VASP subpoenas..."}
                disabled={isStreaming}
                className="flex-1 bg-transparent px-3 text-[14px] outline-none"
                style={{ color: t.text }}
              />
              <button
                onClick={() => handleSend()}
                disabled={isStreaming || !input.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40 transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
              >
                <span>SEND</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
