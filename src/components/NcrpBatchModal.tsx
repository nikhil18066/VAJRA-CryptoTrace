import { useState } from 'react';
import { useTheme } from '../context/theme';
import { caseStore } from '../store/caseStore';

interface NcrpComplaint {
  ackNo: string;
  victim: string;
  city: string;
  date: string;
  amountINR: string;
  suspectWallet: string;
  chain: string;
  txHash: string;
  syndicateGroup?: string;
}

const SAMPLE_NCRP_DATA: NcrpComplaint[] = [
  {
    ackNo: 'NCRP-2026-990142',
    victim: 'Arun Kumar',
    city: 'Mumbai Cyber Cell',
    date: '10-Sep-2026',
    amountINR: '₹4,50,000',
    suspectWallet: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14',
    chain: 'Ethereum',
    txHash: '0x9d0532bf8205ebba6155db4617fc97c04c13a7fefc827e0d6f89a5417af38162',
    syndicateGroup: 'Operation Hydra (Investment Ponzi)',
  },
  {
    ackNo: 'NCRP-2026-990188',
    victim: 'Sneha Patel',
    city: 'Ahmedabad Cyber Crime',
    date: '10-Sep-2026',
    amountINR: '₹12,00,000',
    suspectWallet: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14',
    chain: 'Ethereum',
    txHash: '0x3a19ebba21045dbb6155db4617fc97c04c13a7fefc827e0d6f89a5417af44199',
    syndicateGroup: 'Operation Hydra (Investment Ponzi)',
  },
  {
    ackNo: 'NCRP-2026-990204',
    victim: 'Ramesh Varma',
    city: 'Bengaluru East Division',
    date: '11-Sep-2026',
    amountINR: '₹8,75,000',
    suspectWallet: 'TKNVqhBhqkMSiDrQjP3jHAqkFa7R3nhmFE',
    chain: 'Tron',
    txHash: '7c89f54628a8d79901b54bb4a0912efbc51a5c14902187654bb0981aef123456',
    syndicateGroup: 'TRC-20 USDT Task-Based Fraud Syndicate',
  },
  {
    ackNo: 'NCRP-2026-990311',
    victim: 'Pooja Iyer',
    city: 'Chennai Central Cyber PS',
    date: '11-Sep-2026',
    amountINR: '₹3,20,000',
    suspectWallet: '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be',
    chain: 'BNB Chain',
    txHash: '0x12bb5634c42055806a59e9107ed44d43c426e99b3891456bbfa4321098765432',
    syndicateGroup: 'BSC Fake Yield Farm Ring',
  },
  {
    ackNo: 'NCRP-2026-990355',
    victim: 'Vikram Sethi',
    city: 'Delhi Special Cell (IFSO)',
    date: '12-Sep-2026',
    amountINR: '₹15,40,000',
    suspectWallet: '0x75b17cc9da3d4e540f866974c1b52ebbc51a5c14',
    chain: 'Ethereum',
    txHash: '0x88f2190bbca456711902ebbc51a5c149912048991234aefbca9081234567890',
    syndicateGroup: 'Operation Hydra (Investment Ponzi)',
  },
];

interface NcrpBatchModalProps {
  onClose: () => void;
  onSelectCase: (wallet: string, chain: string, caseId: string) => void;
}

export default function NcrpBatchModal({ onClose, onSelectCase }: NcrpBatchModalProps) {
  const { t } = useTheme();
  const [complaints, setComplaints] = useState<NcrpComplaint[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [syndicateStats, setSyndicateStats] = useState<{
    totalComplaints: number;
    totalLossINR: string;
    identifiedSyndicates: number;
    commonOffRamps: number;
  } | null>(null);

  const handleLoadSample = () => {
    setComplaints(SAMPLE_NCRP_DATA);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setSyndicateStats({
        totalComplaints: 5,
        totalLossINR: '₹43,85,000',
        identifiedSyndicates: 3,
        commonOffRamps: 2,
      });
    }, 900);
  };

  const handleLaunchCase = (c: NcrpComplaint) => {
    onSelectCase(c.suspectWallet, c.chain, `INV-${c.ackNo.replace('NCRP-', '')}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
           style={{ background: t.card, border: `1px solid ${t.borderAccent}` }}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center font-bold">
              🇮🇳
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                National Cybercrime Portal (NCRP / 1930) Batch Importer
              </h2>
              <p className="text-[11px] text-white/40 font-mono">
                Multi-Complaint Batch Ingestion & Syndicate Clustering Engine
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white px-2 py-1 text-sm">✕</button>
        </div>

        {/* Upload / Demo Area */}
        {complaints.length === 0 ? (
          <div className="p-6 rounded-xl border-2 border-dashed border-cyan-500/30 text-center space-y-4 bg-black/20">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center text-xl">
              📂
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">Import 1930 Helpline or NCRP Portal CSV Export</p>
              <p className="text-[11px] text-white/50 max-w-md mx-auto mt-1">
                Upload citizen complaint records containing victim reports, reported transaction hashes, and suspect wallet addresses.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={handleLoadSample}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs tracking-wider active:scale-95 transition-all">
                LOAD LIVE NCRP DEMO DATASET (5 COMPLAINTS)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Clustered Syndicate Intelligence Banner */}
            {syndicateStats && (
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-cyan-400 font-mono">
                    ⚡ AUTOMATED SYNDICATE CLUSTERING COMPLETE
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    {syndicateStats.totalLossINR} TOTAL REPORTED LOSS
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  VAJRA correlated <strong>3 independent complaints</strong> from Mumbai, Ahmedabad, and Delhi to the 
                  <strong className="text-cyan-300"> Operation Hydra Syndicate</strong> targeting the same primary collector wallet and Binance deposit hub.
                </p>
              </div>
            )}

            {/* Complaints Table */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                Imported Victim Complaints ({complaints.length})
              </p>
              <div className="space-y-2">
                {complaints.map((c) => (
                  <div key={c.ackNo} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all">
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">{c.ackNo}</span>
                        <span className="text-[10px] text-white/40 font-mono">· {c.city}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">{c.amountINR}</span>
                      </div>
                      <p className="text-[11px] font-mono text-white/80 truncate">Suspect: {c.suspectWallet}</p>
                      {c.syndicateGroup && (
                        <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">🎯 Matched Syndicate: {c.syndicateGroup}</p>
                      )}
                    </div>
                    <button onClick={() => handleLaunchCase(c)}
                            className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-[11px] whitespace-nowrap active:scale-95">
                      INVESTIGATE →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setComplaints([])} className="text-xs text-white/40 hover:text-white">
                Clear Dataset
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-xs">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
