/* ── VAJRA Graphics ── SVG components for branding and 3D visuals ── */

export const VajraLogo = ({ className = "w-24 h-24" }: { className?: string }) => (
  <svg viewBox="0 0 220 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="goldG" x1="0%" y1="0%" x2="100%" y2="120%">
        <stop offset="0%"   stopColor="#f3e5ab" />
        <stop offset="40%"  stopColor="#d4af37" />
        <stop offset="100%" stopColor="#8a6100" />
      </linearGradient>
      <linearGradient id="goldGDark" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#c5a017" />
        <stop offset="100%" stopColor="#6a4800" />
      </linearGradient>
      <linearGradient id="shieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#0e1c38" />
        <stop offset="100%" stopColor="#07101f" />
      </linearGradient>
      <filter id="logoGlow" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="innerGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Outer shield glow */}
    <path d="M110 8 L196 42 L196 130 C196 196 128 238 110 250 C92 238 24 196 24 130 L24 42 Z"
          stroke="url(#goldG)" strokeWidth="2" fill="none" opacity="0.3" filter="url(#logoGlow)" />

    {/* Main shield body */}
    <path d="M110 12 L192 44 L192 128 C192 192 126 234 110 246 C94 234 28 192 28 128 L28 44 Z"
          fill="url(#shieldFill)" stroke="url(#goldG)" strokeWidth="5" filter="url(#innerGlow)" />

    {/* Inner shield ring */}
    <path d="M110 28 L172 54 L172 124 C172 174 122 208 110 218 C98 208 48 174 48 124 L48 54 Z"
          fill="none" stroke="url(#goldGDark)" strokeWidth="2.5" />

    {/* V mark — fully solid gold */}
    <path d="M68 78 L110 174 L152 78 L130 78 L110 132 L90 78 Z"
          fill="url(#goldG)" filter="url(#innerGlow)" />

    {/* Accent line under V */}
    <line x1="86" y1="188" x2="134" y2="188" stroke="url(#goldG)" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* ── 3D Isometric Cube (blockchain block) ── */
export const Cube3D = ({ className = "w-36 h-36" }: { className?: string }) => (
  <div className={`relative ${className} anim-float`}>
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <defs>
        <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4facfe" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1e5fff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#0033cc" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="cubeRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00f2fe" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0044aa" stopOpacity="0.2" />
        </linearGradient>
        <filter id="cubeGlow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Glow halo */}
      <ellipse cx="100" cy="182" rx="50" ry="10" fill="#00f2fe" opacity="0.15" />

      {/* Top face */}
      <polygon points="100,18 178,58 100,98 22,58"
               fill="url(#cubeTop)" stroke="#00f2fe" strokeWidth="1.5" filter="url(#cubeGlow)" />
      {/* Left face */}
      <polygon points="22,58 100,98 100,178 22,138"
               fill="url(#cubeLeft)" stroke="#4facfe" strokeWidth="1.5" />
      {/* Right face */}
      <polygon points="100,98 178,58 178,138 100,178"
               fill="url(#cubeRight)" stroke="#00f2fe" strokeWidth="1.5" />

      {/* V emblem on top face */}
      <text x="100" y="68" textAnchor="middle" fill="#00f2fe" fontSize="18"
            fontFamily="'Rajdhani', sans-serif" fontWeight="700" opacity="0.8">V</text>

      {/* Corner nodes */}
      {[[100,18],[178,58],[22,58],[100,98],[100,178],[22,138],[178,138]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="4" fill="#00f2fe" opacity="0.9" />
      ))}

      {/* Connection lines on faces */}
      <line x1="100" y1="18" x2="100" y2="98" stroke="#00f2fe" strokeWidth="0.8" opacity="0.3" />
      <line x1="22"  y1="58" x2="178" y2="58" stroke="#00f2fe" strokeWidth="0.8" opacity="0.3" />
    </svg>
  </div>
);

/* ── Blockchain Stack (3 layered cubes) ── */
export const BlockchainStack = ({ className = "w-48 h-48" }: { className?: string }) => (
  <div className={`relative ${className} anim-float`}>
    <svg viewBox="0 0 240 280" className="w-full h-full">
      <defs>
        <linearGradient id="bTop1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#4facfe" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="bLeft1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1e5fff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0022aa" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="bRight1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#00d4ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#003399" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Bottom cube */}
      <g opacity="0.6">
        <polygon points="120,170 196,200 120,230 44,200" fill="url(#bTop1)" stroke="#00f2fe" strokeWidth="1.2" />
        <polygon points="44,200 120,230 120,260 44,230"  fill="url(#bLeft1)" stroke="#4facfe" strokeWidth="1.2" />
        <polygon points="120,230 196,200 196,230 120,260" fill="url(#bRight1)" stroke="#00f2fe" strokeWidth="1.2" />
      </g>

      {/* Middle cube */}
      <g opacity="0.8">
        <polygon points="120,110 196,140 120,170 44,140" fill="url(#bTop1)" stroke="#00f2fe" strokeWidth="1.5" />
        <polygon points="44,140 120,170 120,200 44,170"  fill="url(#bLeft1)" stroke="#4facfe" strokeWidth="1.5" />
        <polygon points="120,170 196,140 196,170 120,200" fill="url(#bRight1)" stroke="#00f2fe" strokeWidth="1.5" />
      </g>

      {/* Top cube (most prominent) */}
      <g filter="url(#cubeGlow2)">
        <polygon points="120,50 196,80 120,110 44,80" fill="url(#bTop1)" stroke="#00f2fe" strokeWidth="2" />
        <polygon points="44,80 120,110 120,140 44,110"  fill="url(#bLeft1)" stroke="#4facfe" strokeWidth="2" />
        <polygon points="120,110 196,80 196,110 120,140" fill="url(#bRight1)" stroke="#00f2fe" strokeWidth="2" />
      </g>

      <filter id="cubeGlow2">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* V on top */}
      <text x="120" y="94" textAnchor="middle" fill="#fff" fontSize="16"
            fontFamily="'Rajdhani', sans-serif" fontWeight="700" opacity="0.9">V</text>

      {/* Glow base */}
      <ellipse cx="120" cy="260" rx="60" ry="12" fill="#1e5fff" opacity="0.12" />

      {/* Corner dots */}
      {[[120,50],[196,80],[44,80],[120,110]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="3.5" fill="#00f2fe" opacity="0.9" />
      ))}
    </svg>
  </div>
);

/* ── Network Grid Background Decoration ── */
export const NetworkDecoration = ({ className = "absolute inset-0" }: { className?: string }) => (
  <div className={`${className} pointer-events-none overflow-hidden`}>
    <svg className="w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="netGrid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#00f2fe" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#netGrid)" />
    </svg>
    {/* Diagonal glow lines */}
    <svg className="absolute inset-0 w-full h-full" opacity="0.05">
      <line x1="0" y1="0" x2="100%" y2="100%" stroke="#00f2fe" strokeWidth="1" />
      <line x1="100%" y1="0" x2="0" y2="100%" stroke="#00f2fe" strokeWidth="1" />
      <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#1e5fff" strokeWidth="0.5" />
    </svg>
  </div>
);

/* ── VAJRA Wordmark for Splash ── */
export const VajraWordmark = () => (
  <div className="flex flex-col items-center">
    <VajraLogo className="w-28 h-28" />
    <h1 className="text-display text-5xl font-700 mt-2"
        style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                 background: "linear-gradient(135deg, #f3e5ab, #d4af37, #aa7c11)",
                 WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      VAJRA
    </h1>
    <p className="text-[11px] text-white/50 tracking-[0.2em] uppercase mt-0.5">
      Virtual Analytics for Judicial Risk & Attribution
    </p>
  </div>
);
