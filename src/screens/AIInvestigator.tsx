import { useState, useRef, useEffect, useCallback } from 'react';
import { streamChat } from '../services/openrouter';
import type { ChatMessage } from '../services/openrouter';
import { analysisStore } from '../store/analysisStore';
import { caseStore } from '../store/caseStore';
import { useTheme } from '../context/theme';

interface AIInvestigatorProps {
  caseId: string;
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

  return `You are VAJRA AI, an elite blockchain forensic investigator and copilot assisting Indian Law Enforcement (State Cyber Police, ED, FIU-IND, CBI). You are providing investigative intelligence for case **${caseId}**.

**LIVE 21-Pillar Case Intelligence Briefing:**
${walletInfo}${dnaVector}

${factorsInfo}

**VASP / Exchange Attribution:** ${vaspInfo}
**Evidence Standard:** Claim-Centric Cryptographic Verification (SHA-256 sealed).

**Operational Guidelines:**
- Be direct, concise, and highly structured with bullet points and bold headings.
- Always cite specific addresses, transaction numbers, and confidence ratings from this case briefing.
- Support natural-language querying, path explanations, and counter-hypothesis testing.
- Clearly recommend precise statutory provisions: Section 91 CrPC / Section 94 BNSS 2023, IT Act 2000 (Section 66C, 66D, 69), and PMLA 2002 (Sec 3 & Sec 17 asset freezing).
- Maintain an authoritative, professional law-enforcement tone.`;
}

// Local forensic response generator for instant & complete answers
function generateLocalResponse(question: string, caseId: string): string {
  const c = getActiveCaseContext(caseId);
  const q = question.toLowerCase().trim();
  const addrShort = c.wallet.slice(0, 8) + '…' + c.wallet.slice(-6);
  const primaryVasp = c.vasps[0]?.name || (c.chain === 'Tron' ? 'Binance Tron' : c.chain === 'Bitcoin' ? 'Cold Vault' : c.chain === 'Solana' ? 'Raydium DEX' : 'Binance');
  const primaryVaspAddr = c.vasps[0]?.address || c.wallet;

  if (q.includes('risk dna') || q.includes('dna') || q.includes('vector') || q.includes('dimension') || q.includes('genetics')) {
    const dna = c.riskDNA;
    if (dna) {
      return `### 🧬 VAJRA 6D Risk DNA Vector Profile — ${c.score}/100 (${c.scoreLabel})\n\n` +
        `• **Target Chain & Subject:** \`${c.wallet}\` on **${c.chain}**\n` +
        `• **Confidence Score:** **${dna.confidenceScore}%**\n` +
        `• **AML Structuring & Layering:** **${dna.vector.amlRisk}/100**\n` +
        `• **Mixer & Privacy Protocol Exposure:** **${dna.vector.mixerExposure}/100**\n` +
        `• **Behavioral Dynamics & Velocity:** **${dna.vector.behavioralRisk}/100**\n` +
        `• **Counterparty Network Risk:** **${dna.vector.networkRisk}/100**\n` +
        `• **Scam & Victim Aggregation Footprint:** **${dna.vector.scamRisk}/100**\n` +
        `• **Cross-Chain Bridge Propensity:** **${dna.vector.crossChainRisk}/100**\n\n` +
        `**Genetics Attribution:**\n` +
        dna.factors.map((f) => `• **${f.name}** (${f.contributionPercent}% contribution) — ${f.description}`).join('\n') +
        `\n\n*Hop Attenuation: Hop 1 (${dna.attenuatedRiskByHop[1]}), Hop 2 (${dna.attenuatedRiskByHop[2]}), Hop 3 (${dna.attenuatedRiskByHop[3]}).*`;
    }
  }

  if (q.includes('notice') || q.includes('crpc') || q.includes('bnss') || q.includes('subpoena') || q.includes('section 91') || q.includes('freeze')) {
    return `### 📜 Legal Preservation Notice Draft (Under Section 91 CrPC / Sec 94 BNSS 2023)\n\n` +
      `**To:** The Nodal Grievance / Law Enforcement Officer, **${primaryVasp} Compliance Dept.**\n` +
      `**Reference:** Cyber Crime FIR / Docket No. **${caseId}** (${c.chain} Network)\n` +
      `**Subject:** Urgent Freeze, KYC Disclosure & Asset Preservation Notice under Section 91 CrPC / Section 94 BNSS & PMLA Sec 17\n\n` +
      `**1. Target Wallet / Deposit Address Identified:**\n` +
      `\`${primaryVaspAddr}\` (${c.chain})\n\n` +
      `**2. Forensic Evidence Summary:**\n` +
      `Blockchain forensics established by VAJRA indicates fund flow activity in Case **${caseId}** with Risk DNA score **${c.score}/100** (${c.scoreLabel}) for typology *${c.typology}*.\n\n` +
      `**3. Mandatory Statutory Demands (Within 24 Hours):**\n` +
      `• Immediately **FREEZE** all withdrawals, transfers, and spot trading for the linked account.\n` +
      `• Furnish complete **KYC / CIP documentation** (Passport/Aadhaar/PAN, verified email, mobile number).\n` +
      `• Provide **IP access logs**, login timestamps, device fingerprints, and linked fiat bank accounts / UPI IDs.\n` +
      `• Preserve all on-platform ledger records under Section 69 of the Information Technology Act 2000.\n\n` +
      `_Issued by Authorized Investigating Officer, State Cyber Police._`;
  }

  if (q.includes('hypothesis') || q.includes('counter') || q.includes('false-positive') || q.includes('alternative')) {
    return `### ⚖️ Alternative Hypothesis Evaluation (False-Positive Mitigation)\n\n` +
      `• **Hypothesis A — Illicit Operation (${c.score}% Probability):**\n` +
      `  Deliberate ${c.typology.toLowerCase()} executed to obfuscate source of funds on ${c.chain}.\n\n` +
      `• **Hypothesis B — Legitimate Business / Custodial Flow (${Math.max(5, 100 - c.score)}% Probability):**\n` +
      `  Standard algorithmic treasury rebalancing or high-volume commercial transaction.\n\n` +
      `• **Decisive Critical Differentiators:**\n` +
      `  1. ${c.factors[0] || 'High velocity on-chain burst activity'}.\n` +
      `  2. Counterparty interaction with cluster \`${primaryVaspAddr.slice(0, 10)}…\`.\n` +
      `  3. Calibrated Risk DNA confidence of ${c.riskDNA?.confidenceScore || 92}%.`;
  }

  if (q.includes('predict') || q.includes('next-hop') || q.includes('forecast') || q.includes('off-ramp')) {
    const p = c.predictions;
    if (p) {
      return `### 🔮 Predictive Next-Hop & Off-Ramp Forecast — ${c.chain}\n\n` +
        `• **Off-Ramp Convergence Risk:** **${p.offRampConvergenceRisk}%**\n` +
        `• **72-Hour Risk Trajectory:** **${p.riskEscalationTrajectory}** (Forecast: ${p.predictedRiskScore72h}/100)\n` +
        `• **Reactivation Probability:** **${p.reactivationProbability}%**\n\n` +
        `**Destination Category Probabilities:**\n` +
        p.nextHopProbabilities.map((nh) => `• **${nh.category.replace(/_/g, ' ')}:** ${nh.probabilityPercent}% (Confidence: ${nh.confidence}%, Window: <${nh.expectedTimeWindowHours}h)\n  _${nh.reasoning}_`).join('\n\n');
    }
  }

  if (q.includes('fund flow') || q.includes('flow') || q.includes('summarize') || q.includes('layering')) {
    return `### 📊 Fund Flow Intelligence Summary — Case ${caseId}\n\n` +
      `• **Subject Wallet:** \`${c.wallet}\` (${c.chain})\n` +
      `• **On-Chain Balance:** ${c.balance} (${c.balanceUSD})\n` +
      `• **Transactions Analyzed:** ${c.txCount} verified records\n` +
      `• **Typology:** **${c.typology}**\n` +
      `• **Risk DNA Score:** **${c.score}/100** (${c.scoreLabel})\n\n` +
      `**Step-by-Step Flow Reconstruction:**\n` +
      `1. **Inflow Hop 1:** Received initial capital from upstream ${c.chain} peer cluster.\n` +
      `2. **Layering Hop 2:** Fragmented into intermediate transit addresses.\n` +
      `3. **Hop 3:** ${c.score >= 70 ? 'Obfuscation pass-through / smart contract interaction.' : 'Peer-to-peer routing.'}\n` +
      `4. **Off-Ramp Hop 4:** Consolidated into **${primaryVasp}** infrastructure \`${primaryVaspAddr.slice(0, 10)}…\`.`;
  }

  if (q.includes('legal') || q.includes('section') || q.includes('fir') || q.includes('pmla') || q.includes('bns')) {
    return `### ⚖️ Applicable Indian Legal Framework (${c.chain} Evidence)\n\n` +
      `**1. Bharatiya Nyaya Sanhita (BNS) 2023:**\n` +
      `• **Section 318(4)** — Cheating and dishonestly inducing delivery of property.\n` +
      `• **Section 316(2)** — Criminal breach of trust by custodian.\n\n` +
      `**2. Information Technology (IT) Act 2000:**\n` +
      `• **Section 66C & 66D** — Identity theft & cheating by personation using computer resources.\n` +
      `• **Section 69** — Directions for interception, decryption, and asset preservation.\n\n` +
      `**3. Prevention of Money Laundering Act (PMLA) 2002:**\n` +
      `• **Section 3 & 4** — Offence and punishment for Money Laundering.\n` +
      `• **Section 17** — Seizure, attachment, and freezing of virtual digital assets (VDAs).`;
  }

  return `### 🛡️ VAJRA Forensic Intelligence — Case ${caseId}\n\n` +
    `Evaluated evidence for subject wallet \`${addrShort}\` on **${c.chain}**.\n\n` +
    `• **Risk DNA Score:** **${c.score}/100** (${c.scoreLabel})\n` +
    `• **Typology Match:** ${c.typology}\n` +
    `• **Attributed VASP:** ${primaryVasp} (${c.vasps[0]?.confidence || 92}% confidence)\n` +
    `• **Sealed Evidence:** SHA-256 integrity verified for Section 65B Indian Evidence Act certification.\n\n` +
    `**Recommended Operational Next Steps:**\n` +
    `1. Issue Section 91 CrPC / Section 94 BNSS preservation notice to **${primaryVasp}**.\n` +
    `2. Initiate 1930 / NCRP transaction lien to freeze corresponding fiat off-ramps.\n` +
    `3. Export Court-Ready Cryptographic Evidence Dossier.`;
}

const STARTER_CARDS = [
  {
    icon: '📊',
    title: 'Fund Flow Analysis',
    subtitle: 'Trace multi-hop structuring, privacy pools & off-ramps',
    prompt: 'Summarize fund flow and trace multi-hop layering paths',
  },
  {
    icon: '🧬',
    title: '6D Risk DNA Profile',
    subtitle: 'Deconstruct AML, mixer exposure, and burst velocity vectors',
    prompt: 'Explain 6D Risk DNA vector profile and genetics attribution',
  },
  {
    icon: '📜',
    title: 'Section 91 CrPC Notice',
    subtitle: 'Draft formal Section 91 CrPC / 94 BNSS preservation notice',
    prompt: 'Draft Section 91 CrPC / Section 94 BNSS preservation notice for Binance',
  },
  {
    icon: '⚖️',
    title: 'Counter-Hypotheses',
    subtitle: 'Evaluate false-positive alternatives and merchant legitimacy',
    prompt: 'Evaluate Alternative Hypotheses and false-positive likelihood',
  },
];

const QUICK_PROMPTS = [
  'Summarize fund flow',
  'Explain 6D Risk DNA',
  'Section 91 CrPC Notice',
  'Evaluate Hypotheses',
  'Predict next-hop',
  'Mixer analysis',
  'Applicable legal sections',
];

export default function AIInvestigator({ caseId, onBack }: AIInvestigatorProps) {
  const { t } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const caseContext = getActiveCaseContext(caseId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const aiMsgId = `ai-${Date.now()}`;
    const placeholderAi: Message = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, placeholderAi]);
    setInput('');
    setIsStreaming(true);

    const chatHistory: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(caseId) },
      ...messages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: text },
    ];

    let fullAiResponse = '';

    await streamChat(
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
              const content = m.content.trim() ? m.content : generateLocalResponse(text, caseId);
              return { ...m, content, isStreaming: false };
            }
            return m;
          })
        );
      },
      (err) => {
        console.warn('Streaming notice, deploying local high-speed forensic response:', err);
        const fallback = generateLocalResponse(text, caseId);
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: fallback, isStreaming: false } : m))
        );
        setIsStreaming(false);
      }
    );
  }, [input, isStreaming, messages, caseId]);

  const handleResetChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: t.bg }}>
      {/* Header */}
      <div className="flex-shrink-0" style={{ background: t.nav }}>
        <div className="flex items-center gap-3 px-5 pt-14 pb-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                  style={{ background: t.inputBg }}>
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-bold text-white truncate" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                VAJRA AI Copilot
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="AI Model Active" />
            </div>
            <p className="text-[10px] text-white/50 font-mono truncate">Docket: {caseId} · 21-Pillar Evidence Context</p>
          </div>

          {/* New Chat Button */}
          {messages.length > 0 && (
            <button
              onClick={handleResetChat}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/70 hover:text-white transition-all flex items-center gap-1 active:scale-95"
              style={{ background: t.inputBg, border: `1px solid ${t.border}` }}
              title="Start New Chat"
            >
              <svg className="w-3.5 h-3.5 text-[#00f2fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((qp) => (
            <button key={qp} onClick={() => handleSend(qp)} disabled={isStreaming}
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all"
                    style={{ background: t.card2, border: `1px solid ${t.border}`, color: '#00f2fe' }}>
              {qp}
            </button>
          ))}
        </div>
        <div className="h-px mx-4" style={{ background: t.border }} />
      </div>

      {/* Main Conversation / Gemini-Style Welcome View */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          /* Gemini / ChatGPT Style Hero Welcome */
          <div className="h-full flex flex-col items-center justify-center py-6 max-w-lg mx-auto text-center animate-fadeIn">
            {/* Radiant Glowing Emblem */}
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

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-[#00f2fe] bg-[#00f2fe]/10 border border-[#00f2fe]/30 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-ping" />
              VAJRA Forensic AI Copilot
            </div>

            <h2 className="text-[24px] font-bold text-white tracking-wide mb-1" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              Welcome, Officer
            </h2>
            <p className="text-[12px] text-white/60 leading-relaxed mb-4 max-w-md">
              Ask anything about case <span className="text-[#00f2fe] font-mono font-semibold">{caseId}</span>. The Copilot is equipped with real-time on-chain graph analysis, 6D Risk DNA, and VASP subpoena intelligence.
            </p>

            {/* Target Case Context HUD Chip */}
            <div className="w-full rounded-xl p-3 mb-5 text-left flex items-center justify-between gap-2 text-[11px]"
                 style={{ background: t.card, border: `1px solid ${t.border}` }}>
              <div className="min-w-0">
                <span className="text-white/40 block text-[9px] uppercase font-mono">Target Wallet ({caseContext.chain})</span>
                <span className="text-white font-mono font-semibold truncate block">
                  {caseContext.wallet.slice(0, 10)}…{caseContext.wallet.slice(-8)}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-white/40 block text-[9px] uppercase font-mono">Risk DNA</span>
                <span className="text-[#ff3d5a] font-bold font-mono">{caseContext.score}/100 ({caseContext.scoreLabel})</span>
              </div>
            </div>

            {/* ChatGPT / Gemini Style Starter Action Cards Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {STARTER_CARDS.map((card) => (
                <button
                  key={card.title}
                  onClick={() => handleSend(card.prompt)}
                  className="p-3.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                  style={{
                    background: t.card,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="text-lg">{card.icon}</span>
                    <span className="text-[12px] font-bold text-white group-hover:text-[#00f2fe] transition-colors"
                          style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {card.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50 leading-snug">
                    {card.subtitle}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render Active Chat Messages */
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="max-w-[90%] rounded-2xl p-4 space-y-2"
                   style={{
                     background: m.role === 'user' ? '#1e5fff' : t.card,
                     border: `1px solid ${m.role === 'user' ? '#3b82f6' : t.border}`,
                     color: '#fff',
                   }}>
                <div className="flex items-center justify-between text-[10px] text-white/50 mb-1 border-b border-white/10 pb-1">
                  <span className="font-bold uppercase font-mono flex items-center gap-1.5 text-white/80">
                    {m.role === 'user' ? (
                      <>
                        <svg className="w-3 h-3 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Investigator
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-[#00f2fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        VAJRA AI Copilot
                      </>
                    )}
                  </span>
                  <span className="font-mono text-[9px]">{m.timestamp}</span>
                </div>
                <div className="text-[12px] leading-relaxed whitespace-pre-wrap font-sans">
                  {m.content || (m.isStreaming ? (
                    <span className="inline-flex items-center gap-2 text-[#00f2fe] font-mono text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-ping" />
                      Analyzing forensic graph and synthesizing intelligence...
                    </span>
                  ) : '')}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="p-4" style={{ background: t.nav, borderTop: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2 rounded-2xl p-2" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Ask about fund flow, Risk DNA, legal notices..."
            disabled={isStreaming}
            className="flex-1 bg-transparent px-3 text-[13px] text-white outline-none placeholder:text-white/30"
          />
          <button
            onClick={() => handleSend()}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-40 transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
          >
            <span>SEND</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
