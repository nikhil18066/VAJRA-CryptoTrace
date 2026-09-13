import { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { useTheme } from '../context/theme';
import QRScannerModal from '../components/QRScannerModal';
import type { ScannedCryptoTarget } from '../components/QRScannerModal';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';

interface InvestigateProps {
  onNavigate: (tab: Tab) => void;
  onStartAnalysis: (wallet: string, chain: string, caseId: string) => void;
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

export default function Investigate({ onNavigate, onStartAnalysis, activeTab, initialWallet = '', initialChain = 'Auto Detect' }: InvestigateProps) {
  const { t } = useTheme();
  const [wallet, setWallet]         = useState(initialWallet);
  const [chain, setChain]           = useState(initialChain);
  const [caseId, setCaseId]         = useState('');
  const [caseDesc, setCaseDesc]     = useState('');
  const [showDrop, setShowDrop]     = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannedAlert, setScannedAlert] = useState<string | null>(null);
  
  // Path Engine Options
  const [maxHops, setMaxHops]       = useState(5);
  const [minValUSD, setMinValUSD]   = useState(50);
  const [direction, setDirection]   = useState<'FORWARD' | 'BACKWARD'>('FORWARD');

  const [error, setError]           = useState('');

  const handleStart = () => {
    if (!wallet.trim()) { setError('Please enter a wallet address or scan a QR code.'); return; }
    setError('');
    onStartAnalysis(wallet.trim(), chain, caseId.trim() || `INV-2024-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleQRScanned = (target: ScannedCryptoTarget) => {
    setWallet(target.address);
    if (target.chain && target.chain !== 'Auto Detect') {
      const match = CHAINS.find((c) => c.toLowerCase().includes(target.chain.toLowerCase().split(' ')[0])) || target.chain;
      setChain(match);
    }
    setError('');
    setScannedAlert(`QR Ingested: ${target.address.slice(0, 8)}...${target.address.slice(-6)} (${target.chain})`);
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
    <div className="flex flex-col h-full" style={{ background: t.bg }}>

      {/* Header */}
      <div className="flex-shrink-0 px-5 pt-14 pb-4" style={{ background: t.nav }}>
        <h1 className="text-[22px] font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
          New Case Registration
        </h1>
        <p className="text-[11px] text-white/40 mt-0.5" style={{ color: t.textMuted }}>
          Multi-Chain Ingestion, 6D Risk DNA & Typology Discovery
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* ── Suspect / Target Wallet (Manual + Single QR Scan Option) ── */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <h2 className="text-[13px] font-semibold text-white" style={{ color: t.text }}>Suspect / Target Wallet</h2>
            </div>
            <span className="text-[10px] text-white/40 font-mono">Manual & QR Supported</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Enter 0x..., Tron (T...), Bitcoin, or Solana address"
              value={wallet}
              onChange={(e) => { setWallet(e.target.value); setError(''); setScannedAlert(null); }}
              className="w-full px-4 pr-28 py-3.5 rounded-xl text-[12px] placeholder-white/20 outline-none transition-all duration-200"
              style={{
                background: t.card2,
                border: `1.5px solid ${t.border}`,
                color: t.text,
                fontFamily: "'Inter', monospace",
              }}
            />
            {/* Single clean Scan QR button integrated directly in the input */}
            <button
              type="button"
              onClick={() => setShowQRScanner(true)}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <span className="text-sm">📷</span>
              <span>Scan QR</span>
            </button>
          </div>

          {/* Scanned Badge */}
          {scannedAlert && (
            <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                <p className="text-[11px] font-mono text-emerald-300 truncate font-semibold">
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
            <p className="text-[11px] text-[#ff3d5a] flex items-center gap-1.5">
              <span>⚠</span> {error}
            </p>
          )}

          {/* Quick fill demo wallets */}
          <div>
            <p className="text-[10px] text-white/30 mb-1.5">Sample Forensic Test Vectors:</p>
            <div className="flex gap-2 flex-wrap">
              {DEMO_WALLETS.map((item) => (
                <button key={item.addr} 
                        onClick={() => { setWallet(item.addr); setChain(item.chain); setScannedAlert(null); }}
                        className="text-[10px] px-2.5 py-1 rounded-lg text-cyan-400 font-medium bg-cyan-500/10 border border-cyan-500/20 active:scale-95">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blockchain selector */}
        <div className="rounded-2xl p-4" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[13px] font-semibold text-white">Target Blockchain</h2>
          </div>

          <div className="relative">
            <button onClick={() => setShowDrop(!showDrop)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[13px] transition-all"
                    style={{ background: t.card2, border: `1.5px solid ${showDrop ? '#00f2fe' : t.border}`, color: t.text }}>
              <span>{chain}</span>
              <span className="text-white/40 text-xs">▼</span>
            </button>

            {showDrop && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-30 shadow-2xl max-h-56 overflow-y-auto"
                   style={{ background: t.card2, border: `1.5px solid ${t.borderAccent}` }}>
                {CHAINS.map((c) => (
                  <button key={c}
                          onClick={() => { setChain(c); setShowDrop(false); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-[12px] transition-colors"
                          style={{
                            color: c === chain ? '#00f2fe' : t.textSub,
                            background: c === chain ? 'rgba(0,242,254,0.08)' : 'transparent',
                          }}>
                    <span>{c}</span>
                    {c === chain && <span className="text-cyan-400 font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Forensic Path Config (Collapsible) */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <button onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-cyan-400 font-mono">⚡ DYNAMIC PATH ENGINE PARAMETERS</span>
            </div>
            <span className="text-xs text-white/40">{showAdvanced ? '▲ Hide' : '▼ Expand'}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-white/60">Max Traversal Hops:</span>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map((h) => (
                    <button key={h} onClick={() => setMaxHops(h)}
                            className={`px-2.5 py-1 rounded text-xs font-mono ${maxHops === h ? 'bg-blue-600 text-white font-bold' : 'bg-white/10 text-white/60'}`}>
                      {h} Hops
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-white/60">Min Value Threshold ($):</span>
                <input
                  type="number"
                  value={minValUSD}
                  onChange={(e) => setMinValUSD(Number(e.target.value))}
                  className="w-24 px-2 py-1 rounded bg-black/40 border border-white/10 text-right text-cyan-400 font-mono text-xs"
                />
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-white/60">Direction:</span>
                <div className="flex gap-2">
                  <button onClick={() => setDirection('FORWARD')}
                          className={`px-2.5 py-1 rounded text-xs ${direction === 'FORWARD' ? 'bg-cyan-600 text-white font-bold' : 'bg-white/10 text-white/60'}`}>
                    Forward Dispersion
                  </button>
                  <button onClick={() => setDirection('BACKWARD')}
                          className={`px-2.5 py-1 rounded text-xs ${direction === 'BACKWARD' ? 'bg-cyan-600 text-white font-bold' : 'bg-white/10 text-white/60'}`}>
                    Reverse Origin Source
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Case details */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <InputRow label="Case ID / FIR Reference" placeholder="e.g. CYB-2024-00129"
                    value={caseId} onChange={setCaseId} />
          <InputRow label="Crime Typology / Brief Description" placeholder="Investment scam, phishing sweep, mule transit..."
                    value={caseDesc} onChange={setCaseDesc} />
        </div>
      </div>

      {/* Start button + nav */}
      <div className="flex-shrink-0">
        <div className="px-5 pb-4 pt-3">
          <button onClick={handleStart}
                  className="w-full text-white font-bold py-4 rounded-2xl text-[15px] tracking-widest active:scale-95 transition-all"
                  style={{
                    background: wallet.trim()
                      ? 'linear-gradient(135deg, #1e5fff, #0033cc)'
                      : 'rgba(30,95,255,0.25)',
                    fontFamily: "'Rajdhani', sans-serif",
                  }}>
            START FORENSIC ANALYSIS
          </button>
        </div>
        <BottomNav active={activeTab} onNavigate={onNavigate} />
      </div>

      {/* Industrial-Grade QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScanned}
      />
    </div>
  );
}
