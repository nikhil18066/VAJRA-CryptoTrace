import type { RiskDNAProfile } from '../services/riskEngine2';

interface RiskGaugeProps {
  score: number;
  size?: number;
  animate?: boolean;
  riskDNA?: RiskDNAProfile | null;
  showDNABreakdown?: boolean;
}

export default function RiskGauge({ 
  score, 
  size = 130, 
  animate = true, 
  riskDNA, 
  showDNABreakdown = false 
}: RiskGaugeProps) {
  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const fillAmount = (score / 100) * circumference;
  const dashOffset = circumference - fillAmount;

  const color =
    score >= 75 ? '#ff3d5a' :
    score >= 45 ? '#f5a623' :
                  '#00d68f';

  const label =
    score >= 75 ? 'High Risk' :
    score >= 45 ? 'Medium Risk' :
                  'Low Risk';

  const trackColor = 'rgba(128,128,128,0.15)';

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex flex-col items-center relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id={`gaugeGlow-${score}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Track */}
          <circle cx={cx} cy={cy} r={radius}
            fill="none" stroke={trackColor} strokeWidth="10" />

          {/* Fill arc */}
          <circle cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cy})`}
            filter={`url(#gaugeGlow-${score})`}
            style={animate ? {
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
            } : undefined}
          />

          {/* Inner ring */}
          <circle cx={cx} cy={cy} r={radius * 0.75}
            fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />

          {/* Score number */}
          <text x={cx} y={cy - 4}
            textAnchor="middle"
            fill={color}
            fontSize={size * 0.2}
            fontWeight="700"
            fontFamily="'Rajdhani', sans-serif">
            {score}
          </text>
          <text x={cx} y={cy + size * 0.1}
            textAnchor="middle"
            fill={color}
            fontSize={size * 0.082}
            fontFamily="'Inter', sans-serif">
            /100
          </text>

          {/* Dot indicator */}
          <circle
            cx={cx + radius * Math.cos((-90 + (score / 100) * 360) * Math.PI / 180)}
            cy={cy + radius * Math.sin((-90 + (score / 100) * 360) * Math.PI / 180)}
            r="5"
            fill={color}
            filter={`url(#gaugeGlow-${score})`}
          />
        </svg>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-semibold" style={{ color }}>
            {riskDNA ? `${riskDNA.level} RISK` : label}
          </span>
          {riskDNA && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {riskDNA.confidenceScore}% CONFIDENCE
            </span>
          )}
        </div>
      </div>

      {/* Optional Risk DNA 6-Vector Breakdown */}
      {showDNABreakdown && riskDNA && (
        <div className="w-full mt-4 space-y-2.5 pt-3 border-t border-white/10 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 font-semibold mb-1">
            <span>🧬 RISK DNA VECTOR (6D)</span>
            <span>INTENSITY</span>
          </div>

          {[
            { label: 'AML Structuring / Layering', val: riskDNA.vector.amlRisk, color: '#ff3d5a' },
            { label: 'Mixer & Privacy Exposure', val: riskDNA.vector.mixerExposure, color: '#a855f7' },
            { label: 'Burst & Behavioral Dynamics', val: riskDNA.vector.behavioralRisk, color: '#f5a623' },
            { label: 'Counterparty Network Exposure', val: riskDNA.vector.networkRisk, color: '#3b82f6' },
            { label: 'Scam & Victim Aggregation', val: riskDNA.vector.scamRisk, color: '#ec4899' },
            { label: 'Cross-Chain Bridge Propensity', val: riskDNA.vector.crossChainRisk, color: '#00f2fe' },
          ].map((dim, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/70">
                <span>{dim.label}</span>
                <span className="font-mono font-bold" style={{ color: dim.color }}>{dim.val}/100</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-700" 
                  style={{ width: `${dim.val}%`, background: dim.color }} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
