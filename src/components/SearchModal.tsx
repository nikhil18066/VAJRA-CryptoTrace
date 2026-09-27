import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from '../context/theme';
import { caseStore } from '../store/caseStore';

interface SearchResult {
  type: 'case' | 'wallet' | 'vasp' | 'typology' | 'campaign';
  id: string;
  title: string;
  sub: string;
  risk?: string;
  riskKey?: string;
}

const RISK_COLOR: Record<string, string> = {
  high: '#ff3d5a', med: '#f5a623', low: '#00d68f',
};

const TYPE_ICON: Record<string, ReactNode> = {
  case: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  wallet: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9" />
    </svg>
  ),
  vasp: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  typology: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  campaign: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  case:     { bg: 'rgba(30,95,255,0.12)',  color: '#4facfe' },
  wallet:   { bg: 'rgba(0,242,254,0.1)',   color: '#00f2fe' },
  vasp:     { bg: 'rgba(0,214,143,0.1)',   color: '#00d68f' },
  typology: { bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
  campaign: { bg: 'rgba(245,166,35,0.12)', color: '#f5a623' },
};

interface SearchModalProps {
  onClose: () => void;
  onOpenCase: (caseId: string) => void;
  onStartAnalysis?: (wallet: string, chain: string, caseId: string) => void;
}

export default function SearchModal({ onClose, onOpenCase, onStartAnalysis }: SearchModalProps) {
  const { t } = useTheme();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'wallets' | 'typologies' | 'campaigns'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const cases = caseStore.getAll();
  const dynamicResults: SearchResult[] = [];

  cases.forEach((c) => {
    dynamicResults.push({
      type: 'case',
      id: c.id,
      title: c.id,
      sub: `${c.wallet ? c.wallet.slice(0, 8) + '...' : ''} · ${c.chain} · ${c.typology}`,
      risk: c.riskLevel,
      riskKey: c.riskKey,
    });

    if (c.wallet) {
      dynamicResults.push({
        type: 'wallet',
        id: c.id,
        title: c.wallet,
        sub: `${c.chain} · ${c.riskLevel} · ${c.txCount} txns · ${c.typology}`,
        risk: c.riskLevel,
        riskKey: c.riskKey,
      });
    }

    if (c.typology) {
      dynamicResults.push({
        type: 'typology',
        id: c.id,
        title: c.typology,
        sub: `Matched in case ${c.id} (${c.chain}) · Risk Score ${c.riskScore}/100`,
        risk: c.riskLevel,
        riskKey: c.riskKey,
      });
    }

    c.vaspAttribution?.forEach((v) => {
      if (v.name && v.name !== 'Unknown VASP') {
        dynamicResults.push({
          type: 'vasp',
          id: c.id,
          title: v.name,
          sub: `${v.category || 'Exchange'} · ${v.confidence}% confidence (Linked to ${c.id})`,
        });
      }
    });

    c.campaigns?.forEach((cmp) => {
      dynamicResults.push({
        type: 'campaign',
        id: c.id,
        title: cmp.name,
        sub: `${cmp.typology} · Damages: $${cmp.totalDamagesUSD.toLocaleString()} · Linked to ${c.id}`,
        risk: 'High Risk',
        riskKey: 'high',
      });
    });
  });

  const isAddressQuery = query.trim().startsWith('0x') || query.trim().startsWith('T') || query.trim().length >= 26;

  const filtered = dynamicResults.filter((r) => {
    if (activeFilter === 'wallets') return r.type === 'wallet' || r.type === 'case';
    if (activeFilter === 'typologies') return r.type === 'typology';
    if (activeFilter === 'campaigns') return r.type === 'campaign' || r.type === 'vasp';
    return true;
  });

  const results = query.trim().length < 1
    ? filtered.slice(0, 8)
    : filtered.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.sub.toLowerCase().includes(query.toLowerCase())
      );

  const handleStartLiveTrace = (addr: string) => {
    if (onStartAnalysis) {
      const newCaseId = `INV-2024-${Math.floor(10000 + Math.random() * 90000)}`;
      onStartAnalysis(addr.trim(), 'Auto Detect', newCaseId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
         style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-lg rounded-2xl p-4 space-y-3"
           style={{ background: t.card, border: `1px solid ${t.borderAccent}` }}>
        
        {/* Search Bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address, typology, VASP, or paste wallet..."
            className="flex-1 bg-transparent text-[13px] outline-none font-mono"
            style={{ color: t.text }}
          />
          <button onClick={onClose} className="text-xs px-2 py-1" style={{ color: t.textMuted }}>
            ESC
          </button>
        </div>

        {/* Live Trace Prompt for pasted / typed addresses */}
        {isAddressQuery && onStartAnalysis && (
          <button
            onClick={() => handleStartLiveTrace(query)}
            className="w-full text-left p-3 rounded-xl flex items-center justify-between bg-cyan-500/10 border border-cyan-500/40 hover:bg-cyan-500/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cyan-500/20 text-cyan-500 font-bold text-sm">
                ⚡
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-cyan-600 truncate">Launch Live On-Chain Trace</p>
                <p className="text-[10px] font-mono truncate" style={{ color: t.textMuted }}>{query.trim()}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-cyan-500/20 text-cyan-600 tracking-wide font-mono">
              ANALYZE ›
            </span>
          </button>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'wallets', label: 'Wallets & Cases' },
            { id: 'typologies', label: 'Laundering Typologies' },
            { id: 'campaigns', label: 'Campaigns & VASPs' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap active:scale-95 shadow-sm"
              style={{
                background: activeFilter === f.id ? (t.mode === 'light' ? '#1d4ed8' : '#1e5fff') : t.inputBg,
                color: activeFilter === f.id ? '#fff' : t.textSub,
                border: `1px solid ${activeFilter === f.id ? (t.mode === 'light' ? '#1d4ed8' : '#1e5fff') : t.border}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto space-y-1.5 pt-1">
          {results.length === 0 && !isAddressQuery ? (
            <p className="text-center text-xs py-6" style={{ color: t.textMuted }}>No matching intelligence artifacts found</p>
          ) : (
            results.map((r, idx) => {
              const tc = TYPE_COLORS[r.type] || { bg: 'rgba(255,255,255,0.1)', color: '#fff' };
              return (
                <button
                  key={idx}
                  onClick={() => { onOpenCase(r.id); onClose(); }}
                  className="w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-all"
                  style={{ background: t.card2, border: `1px solid ${t.border}` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ background: tc.bg, color: tc.color }}>
                      {TYPE_ICON[r.type]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold truncate" style={{ color: t.text }}>{r.title}</p>
                      <p className="text-[10px] truncate" style={{ color: t.textMuted }}>{r.sub}</p>
                    </div>
                  </div>
                  {r.risk && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded"
                          style={{ color: RISK_COLOR[r.riskKey || 'med'] || t.text }}>
                      {r.risk}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
