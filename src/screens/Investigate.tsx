import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../context/theme';
import QRScannerModal from '../components/QRScannerModal';
import type { ScannedCryptoTarget } from '../components/QRScannerModal';
import { caseStore } from '../store/caseStore';
import type { CaseRecord } from '../store/caseStore';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';

interface InvestigateProps {
  onNavigate: (tab: Tab) => void;
  onStartAnalysis: (wallet: string, chain: string, caseId: string) => void;
  onOpenCase?: (caseId: string) => void;
  activeTab: Tab;
  initialWallet?: string;
  initialChain?: string;
}

const CHAINS = [
  'Auto Detect',
  'Ethereum (ETH)',
  'Tron (TRX)',
  'Bitcoin (BTC)',
  'BNB Chain',
  'Polygon',
  'Arbitrum',
  'Base',
  'Optimism',
  'Solana (SOL)',
  'Avalanche'
];

const DEMO_WALLETS = [
  { addr: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14', chain: 'Ethereum (ETH)', label: 'ETH Structuring (85 Risk)' },
  { addr: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE', chain: 'Tron (TRX)', label: 'Tron TRC-20 USDT (58 Risk)' },
  { addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'Bitcoin (BTC)', label: 'BTC Genesis (24 Risk)' },
  { addr: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', chain: 'Solana (SOL)', label: 'SOL Phishing Drainer (94 Risk)' },
  { addr: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be', chain: 'BNB Chain', label: 'BSC Ponzi Tumbler (91 Risk)' },
  { addr: '0x1111111254fb6c44bac0bed2854e76f90643097d', chain: 'Polygon', label: 'Polygon Safe Multi-Sig (18 Risk)' },
];

export default function Investigate({
  onNavigate,
  onStartAnalysis,
  onOpenCase,
  activeTab,
  initialWallet = '',
  initialChain = 'Auto Detect'
}: InvestigateProps) {
  const { t } = useTheme();
  const [wallet, setWallet]             = useState(initialWallet);
  const [chain, setChain]               = useState(initialChain);
  const [caseId, setCaseId]             = useState('');
  const [caseDesc, setCaseDesc]         = useState('');
  const [showDrop, setShowDrop]         = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);
  const [duplicateCase, setDuplicateCase] = useState<CaseRecord | null>(null);
  
  // Path Engine Options
  const [maxHops, setMaxHops]       = useState(5);
  const [minValUSD, setMinValUSD]   = useState(50);
  const [direction, setDirection]   = useState<'FORWARD' | 'BACKWARD'>('FORWARD');

  const [error, setError]           = useState('');

  const handleStart = (forceNewId: boolean = false) => {
    const isForced = typeof forceNewId === 'boolean' && forceNewId === true;
    const trimmed = wallet.trim();
    if (!trimmed) {
      setError('Please enter a wallet address or scan a QR code.');
      return;
    }
    setError('');

    // If not forced, check if this target address or Case ID already exists in registry
    if (!isForced) {
      const existingByWallet = caseStore.getByWallet(trimmed);
      const existingById = caseId.trim() ? caseStore.getById(caseId.trim()) : undefined;
      const existing = existingByWallet || existingById;

      if (existing) {
        setDuplicateCase(existing);
        return;
      }
    }

    onStartAnalysis(
      trimmed,
      chain,
      caseId.trim() || `INV-2024-${Math.floor(10000 + Math.random() * 90000)}`
    );
  };

  const handleQRScanned = (target: ScannedCryptoTarget) => {
    setWallet(target.address);
    if (target.chain && target.chain !== 'Auto Detect') {
      const match = CHAINS.find((c) => c.toLowerCase().includes(target.chain.toLowerCase().split(' ')[0])) || target.chain;
      setChain(match);
    }
    setError('');
    
    const existing = caseStore.getByWallet(target.address);
    if (existing) {
      setScannedAlert(`QR Ingested: ${target.address.slice(0, 8)}...${target.address.slice(-6)} • Existing Case [${existing.id}] Found`);
    } else {
      setScannedAlert(`QR Ingested: ${target.address.slice(0, 8)}...${target.address.slice(-6)} (${target.chain})`);
    }
  };

  const InputRow = ({ label, placeholder, value, onChange, mono = false }:
    { label: string; placeholder: string; value: string; onChange: (v: string) => void; mono?: boolean }) => (
    <div>
      <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest block mb-1.5"
             style={{ color: t.textSub }}>
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3.5 rounded-xl text-[13px] placeholder-white/20 outline-none transition-all duration-200"
        style={{
          background: t.card2,
          border: `1.5px solid ${t.border}`,
          color: t.text,
          fontFamily: mono ? "'Inter', monospace" : undefined,
        }}
        onFocus={(e) => { e.target.style.borderColor = '#00f2fe'; }}
        onBlur={(e)  => { e.target.style.borderColor = t.border; }}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: t.bg }}>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-12 md:pt-4 pb-6 space-y-4">

          {/* Header */}
          <div>
            <h1 className="text-[20px] md:text-[24px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
              New Case Registration & Trace Ingestion
            </h1>
            <p className="text-[11px] md:text-[12px] text-white/40 mt-0.5" style={{ color: t.textMuted }}>
              Multi-Chain Address Ingestion, 6D Risk DNA Vectoring & Autonomous Graph Reconstruction
            </p>
          </div>

          {/* ── 2-Column Responsive Layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Case Registration Form (7 cols on desktop) */}
            <div className="lg:col-span-7 space-y-4">

              {/* Suspect / Target Wallet */}
              <div className="rounded-2xl p-5 space-y-3.5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <h2 className="text-[14px] font-bold text-white tracking-wide" style={{ color: t.text, fontFamily: "'Rajdhani', sans-serif" }}>
                      Suspect / Target Wallet Address
                    </h2>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">Manual Input & QR Camera Supported</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter 0x..., Tron (T...), Bitcoin (1/3/bc1), or Solana address"
                    value={wallet}
                    onChange={(e) => { setWallet(e.target.value); setError(''); setScannedAlert(null); }}
                    className="w-full px-4 pr-32 py-3.5 rounded-xl text-[13px] placeholder-white/20 outline-none transition-all duration-200"
                    style={{
                      background: t.card2,
                      border: `1.5px solid ${t.border}`,
                      color: t.text,
                      fontFamily: "'Inter', monospace",
                    }}
                  />
                  {/* Integrated QR Scanner Button */}
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 rounded-lg font-bold text-[12px] flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
                    style={{
                      background: t.mode === 'light' ? 'rgba(2,132,199,0.12)' : 'rgba(0,242,254,0.15)',
                      color: t.mode === 'light' ? '#0284c7' : '#00f2fe',
                      border: `1px solid ${t.mode === 'light' ? 'rgba(2,132,199,0.3)' : 'rgba(0,242,254,0.3)'}`,
                    }}
                  >
                    <span className="text-sm">📷</span>
                    <span>Scan QR</span>
                  </button>
                </div>

                {/* Scanned Badge */}
                {scannedAlert && (
                  <div className="px-3.5 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                      <p className="text-[12px] font-mono text-emerald-300 truncate font-semibold">
                        ✓ {scannedAlert}
                      </p>
                    </div>
                    <button
                      onClick={() => setScannedAlert(null)}
                      className="text-xs text-white/40 hover:text-white px-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-[12px] text-[#ff3d5a] flex items-center gap-1.5 font-medium">
                    <span>⚠</span> {error}
                  </p>
                )}
              </div>

              {/* Blockchain Selector */}
              <div className="rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-[14px] font-bold text-white tracking-wide" style={{ color: t.text, fontFamily: "'Rajdhani', sans-serif" }}>
                    Target Blockchain / Protocol
                  </h2>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowDrop(!showDrop)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13px] transition-all"
                    style={{ background: t.card2, border: `1.5px solid ${showDrop ? '#00f2fe' : t.border}`, color: t.text }}
                  >
                    <span className="font-medium">{chain}</span>
                    <span className="text-white/40 text-xs">▼</span>
                  </button>

                  {showDrop && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30 shadow-2xl max-h-56 overflow-y-auto"
                      style={{ background: t.card2, border: `1.5px solid ${t.borderAccent}` }}
                    >
                      {CHAINS.map((c) => (
                        <button
                          key={c}
                          onClick={() => { setChain(c); setShowDrop(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] transition-colors"
                          style={{
                            color: c === chain ? '#00f2fe' : t.textSub,
                            background: c === chain ? 'rgba(0,242,254,0.08)' : 'transparent',
                          }}
                        >
                          <span>{c}</span>
                          {c === chain && <span className="text-cyan-400 font-bold">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Forensic Path Config */}
              <div className="rounded-2xl p-5 space-y-3.5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-cyan-400 font-mono">⚡ DYNAMIC PATH ENGINE PARAMETERS</span>
                  </div>
                  <span className="text-xs text-white/40">{showAdvanced ? '▲ Hide' : '▼ Expand'}</span>
                </button>

                {showAdvanced && (
                  <div className="space-y-3.5 pt-3 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/60">Max Traversal Hops:</span>
                      <div className="flex gap-2">
                        {[3, 5, 8, 10].map((h) => (
                          <button
                            key={h}
                            onClick={() => setMaxHops(h)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                              maxHops === h ? 'bg-blue-600 text-white font-bold' : 'bg-white/10 text-white/60 hover:bg-white/15'
                            }`}
                          >
                            {h} Hops
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-white/60">Min Value Threshold ($):</span>
                      <input
                        type="number"
                        value={minValUSD}
                        onChange={(e) => setMinValUSD(Number(e.target.value))}
                        className="w-28 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-right text-cyan-400 font-mono text-xs"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]">
                      <span className="text-white/60">Traversal Direction:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDirection('FORWARD')}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            direction === 'FORWARD' ? 'bg-cyan-600 text-white font-bold' : 'bg-white/10 text-white/60 hover:bg-white/15'
                          }`}
                        >
                          Forward Dispersion
                        </button>
                        <button
                          onClick={() => setDirection('BACKWARD')}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${
                            direction === 'BACKWARD' ? 'bg-cyan-600 text-white font-bold' : 'bg-white/10 text-white/60 hover:bg-white/15'
                          }`}
                        >
                          Reverse Origin Source
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Case Details */}
              <div className="rounded-2xl p-5 space-y-4" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <InputRow
                  label="Case ID / FIR Reference"
                  placeholder="e.g. CYB-2024-00129"
                  value={caseId}
                  onChange={setCaseId}
                />
                <InputRow
                  label="Crime Typology / Brief Description"
                  placeholder="Investment scam, phishing sweep, mule transit..."
                  value={caseDesc}
                  onChange={setCaseDesc}
                />
              </div>

              {/* Start Button */}
              <button
                onClick={() => handleStart(false)}
                className="w-full text-white font-bold py-4 rounded-2xl text-[16px] tracking-widest active:scale-95 transition-all shadow-xl"
                style={{
                  background: wallet.trim()
                    ? 'linear-gradient(135deg, #1e5fff, #0033cc)'
                    : 'rgba(30,95,255,0.3)',
                  fontFamily: "'Rajdhani', sans-serif",
                }}
              >
                START FORENSIC ANALYSIS
              </button>
            </div>

            {/* Right Column: Demo Targets & Multi-Chain Node Intelligence (5 cols on desktop) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Sample Forensic Vectors */}
              <div className="rounded-2xl p-5" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[14px] font-bold text-white tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                    Sample Forensic Test Vectors
                  </h3>
                  <span className="text-[10px] text-cyan-400 font-mono">1-Click Load</span>
                </div>
                <p className="text-[11px] text-white/50 mb-3" style={{ color: t.textMuted }}>
                  Click any verified test target below to auto-populate address & chain parameters for immediate forensic tracing:
                </p>
                <div className="space-y-2.5">
                  {DEMO_WALLETS.map((item) => (
                    <button
                      key={item.addr}
                      onClick={() => { setWallet(item.addr); setChain(item.chain); setScannedAlert(null); setError(''); }}
                      className="w-full rounded-xl p-3 text-left transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-between group"
                      style={{ background: t.card2, border: `1px solid ${t.border}` }}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[12px] font-bold" style={{ color: t.mode === 'light' ? '#0284c7' : '#00f2fe' }}>
                          {item.label}
                        </div>
                        <div className="text-[10px] font-mono truncate mt-0.5" style={{ color: t.textMuted }}>
                          {item.addr}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold flex-shrink-0">
                        {item.chain.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-Chain Radar & Legal Standard */}
              <div className="rounded-2xl p-5 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
                <div className="flex items-center gap-2 text-[13px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Statutory Evidence Compliance
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: t.textSub }}>
                  Analyses executed through VAJRA generate tamper-evident SHA-256 sealed exhibits compliant with <strong>Section 91 CrPC</strong> / <strong>Section 94 BNSS 2023</strong> and Section 65B Indian Evidence Act standards for legal admissibility.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t text-[10px] font-mono" style={{ borderColor: t.border, color: t.textMuted }}>
                  <span>🔒 256-Bit Cryptographic Dossier Generation Active</span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      <BottomNav active={activeTab} onNavigate={onNavigate} />

      {/* Industrial-Grade QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScanned}
      />

      {/* Duplicate / Existing Case Ingestion Modal */}
      {duplicateCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp"
            style={{
              background: t.card,
              border: `1.5px solid ${t.mode === 'light' ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.5)'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 text-amber-500 border border-amber-500/30 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[17px] font-bold tracking-wide" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                    Case Already Registered in Registry
                  </h3>
                  <p className="text-[11px]" style={{ color: t.textMuted }}>
                    This target wallet address is already actively indexed in VAJRA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDuplicateCase(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                style={{ color: t.textMuted }}
              >
                ✕
              </button>
            </div>

            {/* Existing Case Snapshot Card */}
            <div className="p-4 rounded-xl space-y-2.5" style={{ background: t.card2, border: `1px solid ${t.border}` }}>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold font-mono" style={{ color: t.mode === 'light' ? '#0284c7' : '#00f2fe' }}>
                  {duplicateCase.id}
                </span>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase"
                  style={{
                    background: duplicateCase.riskScore >= 70 ? 'rgba(255,61,90,0.15)' : 'rgba(245,166,35,0.15)',
                    color: duplicateCase.riskScore >= 70 ? '#ff3d5a' : '#f5a623',
                  }}
                >
                  {duplicateCase.riskLevel} ({duplicateCase.riskScore}/100)
                </span>
              </div>
              
              <div className="text-[11px] font-mono break-all leading-relaxed" style={{ color: t.textSub }}>
                <span className="font-semibold" style={{ color: t.textMuted }}>Target Address: </span>
                {duplicateCase.wallet}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t text-[11px]" style={{ borderColor: t.border }}>
                <div>
                  <span className="block text-[10px]" style={{ color: t.textMuted }}>Chain</span>
                  <strong style={{ color: t.text }}>{duplicateCase.chain}</strong>
                </div>
                <div>
                  <span className="block text-[10px]" style={{ color: t.textMuted }}>Typology</span>
                  <strong className="truncate block" style={{ color: t.text }}>{duplicateCase.typology}</strong>
                </div>
                <div>
                  <span className="block text-[10px]" style={{ color: t.textMuted }}>Tx Count</span>
                  <strong style={{ color: t.text }}>{duplicateCase.txCount} txns</strong>
                </div>
              </div>
            </div>

            {/* Prompt explanation */}
            <p className="text-[12px] leading-relaxed" style={{ color: t.textSub }}>
              To prevent duplicate docket entries and split audit trails, you can navigate directly to this existing dossier or run an in-place forensic re-scan.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* Primary: Open Existing Case */}
              <button
                onClick={() => {
                  const targetId = duplicateCase.id;
                  setDuplicateCase(null);
                  if (onOpenCase) {
                    onOpenCase(targetId);
                  } else {
                    onNavigate('DASHBOARD');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md active:scale-95 transition-all"
              >
                <span>🔍</span> Open Existing Case Dossier ({duplicateCase.id})
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Secondary: Re-Scan existing case */}
                <button
                  onClick={() => {
                    const existingId = duplicateCase.id;
                    setDuplicateCase(null);
                    onStartAnalysis(wallet.trim(), chain, existingId);
                  }}
                  className="w-full py-2.5 rounded-xl text-[12px] font-bold text-center active:scale-95 transition-all"
                  style={{
                    background: t.mode === 'light' ? 'rgba(30,95,255,0.08)' : 'rgba(0,242,254,0.1)',
                    color: t.mode === 'light' ? '#1e5fff' : '#00f2fe',
                    border: `1px solid ${t.mode === 'light' ? 'rgba(30,95,255,0.25)' : 'rgba(0,242,254,0.3)'}`,
                  }}
                >
                  🔄 Re-Scan & Update Trace
                </button>

                {/* Cancel */}
                <button
                  onClick={() => setDuplicateCase(null)}
                  className="w-full py-2.5 rounded-xl text-[12px] font-medium text-center active:scale-95 transition-all"
                  style={{ background: t.card2, color: t.textMuted, border: `1px solid ${t.border}` }}
                >
                  Cancel
                </button>
              </div>

              {/* Force separate case button */}
              <div className="text-center pt-1">
                <button
                  onClick={() => {
                    setDuplicateCase(null);
                    handleStart(true);
                  }}
                  className="text-[11px] underline hover:opacity-80 transition-opacity"
                  style={{ color: t.textMuted }}
                >
                  Create separate new docket with unique FIR ID anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
