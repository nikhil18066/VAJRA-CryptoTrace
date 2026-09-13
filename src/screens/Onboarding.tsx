import { useState } from 'react';
import { VajraLogo, BlockchainStack, Cube3D, NetworkDecoration } from '../components/Graphics';
import { useTheme } from '../context/theme';

interface Slide {
  title: string;
  subtitle: string;
  desc: string;
  visual: 'logo' | 'stack' | 'cube';
  accent: string;
}

const SLIDES: Slide[] = [
  {
    title: 'VAJRA',
    subtitle: 'Virtual Analytics for Judicial Risk & Attribution',
    desc: 'Real-Time Crypto Fraud Intelligence & VASP Attribution System — purpose-built for Law Enforcement.',
    visual: 'logo',
    accent: '#d4af37',
  },
  {
    title: 'TRACE',
    subtitle: 'Multi-Chain Transaction Retrieval',
    desc: 'Automatically reconstruct fund-flow graphs across complex layering, mixing wallets and bridge hops.',
    visual: 'stack',
    accent: '#00f2fe',
  },
  {
    title: 'ANALYZE & ATTRIBUTE',
    subtitle: 'Explainable Risk Scoring',
    desc: 'Identify probable VASP / exchange endpoints with evidence-backed confidence scores and audit trails.',
    visual: 'cube',
    accent: '#4facfe',
  },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { t } = useTheme();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      try {
        localStorage.setItem('vajra_onboarded', 'true');
      } catch {}
      onComplete();
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden"
         style={{ background: t.bg }}>

      {/* Network dot grid */}
      <NetworkDecoration />

      {/* Radial glow behind visual */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-72 h-72 rounded-full"
             style={{
               background: `radial-gradient(circle, ${slide.accent}18 0%, transparent 70%)`,
               transition: 'background 0.6s ease',
             }} />
      </div>

      {/* Top status bar spacing */}
      <div className="h-12 flex-shrink-0" />

      {/* Logo watermark top-right */}
      <div className="absolute top-14 right-4 opacity-10">
        <VajraLogo className="w-16 h-16" />
      </div>

      {/* Visual area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10">
        <div className="mb-8 anim-float">
          {slide.visual === 'logo'  && <VajraLogo className="w-40 h-40" />}
          {slide.visual === 'stack' && <BlockchainStack className="w-52 h-52" />}
          {slide.visual === 'cube'  && <Cube3D className="w-40 h-40" />}
        </div>

        {/* Text content */}
        <div key={step} className="text-center anim-fade-up">
          <h1 className="text-display text-4xl font-700 tracking-widest mb-1"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                background: `linear-gradient(135deg, #f3e5ab, ${slide.accent})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
            {slide.title}
          </h1>

          <p className="text-[13px] font-semibold text-white/80 mb-3 leading-snug" style={{ color: t.textSub }}>
            {slide.subtitle}
          </p>

          <p className="text-[12px] text-white/45 leading-relaxed max-w-[280px] mx-auto" style={{ color: t.textMuted }}>
            {slide.desc}
          </p>

          {step === 0 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {['TRACE', 'ANALYZE', 'ATTRIBUTE'].map((w) => (
                <span key={w} className="text-[10px] font-bold tracking-widest"
                      style={{ color: slide.accent }}>
                  {w}
                </span>
              )).reduce((acc: React.ReactNode[], el, i) => [
                ...acc,
                i > 0 ? <span key={`dot-${i}`} className="w-1 h-1 rounded-full bg-white/20" /> : null,
                el,
              ], [])}
            </div>
          )}
        </div>
      </div>

      {/* Bottom area */}
      <div className="z-10 px-6 pb-10 flex flex-col items-center gap-6 flex-shrink-0">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width:   i === step ? 24 : 8,
                      height:  8,
                      background: i === step ? '#d4af37' : 'rgba(255,255,255,0.2)',
                    }} />
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleNext}
                className="w-full text-white font-semibold py-4 rounded-2xl text-[15px] transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #1e5fff, #0044cc)',
                  boxShadow:  '0 4px 24px rgba(30,95,255,0.4)',
                }}>
          {step === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
        </button>

        {step < SLIDES.length - 1 && (
          <button onClick={onComplete}
                  className="text-[12px] text-white/30 tracking-wide" style={{ color: t.textMuted }}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
