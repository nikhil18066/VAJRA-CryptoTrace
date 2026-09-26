import { useState } from 'react';
import { VajraLogo, NetworkDecoration } from '../components/Graphics';
import { useTheme } from '../context/theme';

const AUTH_OFFICER_EMAIL = 'officer@vajra.gov.in';
const AUTH_OFFICER_PASS  = 'Vajra@Police2026';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const { t } = useTheme();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');

  const fillDemoCredentials = () => {
    setEmail(AUTH_OFFICER_EMAIL);
    setPassword(AUTH_OFFICER_PASS);
    setError('');
  };

  const handleLogin = () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your authorized police email address.');
      return;
    }
    if (!password) {
      setError('Please enter your secure access password.');
      return;
    }
    
    // Strict authorized credential enforcement
    if (trimmedEmail !== AUTH_OFFICER_EMAIL.toLowerCase() || password !== AUTH_OFFICER_PASS) {
      setError('Access Denied: Invalid credentials. Access is strictly restricted to authorized Law Enforcement personnel (officer@vajra.gov.in).');
      return;
    }

    try {
      localStorage.setItem('vajra_session', JSON.stringify({
        email: AUTH_OFFICER_EMAIL,
        officerName: 'Rohit Sharma',
        badge: 'LEO-2026-IND-23',
        unit: 'Cyber Crime Investigation Cell, Unit 23',
        loginAt: new Date().toISOString(),
      }));
      localStorage.setItem('vajra_onboarded', 'true');
    } catch {}

    setError('');
    onLogin();
  };

  const handleSsoLogin = () => {
    setEmail(AUTH_OFFICER_EMAIL);
    setPassword(AUTH_OFFICER_PASS);
    try {
      localStorage.setItem('vajra_session', JSON.stringify({
        email: AUTH_OFFICER_EMAIL,
        officerName: 'Rohit Sharma',
        badge: 'LEO-2026-IND-23',
        unit: 'Cyber Crime Investigation Cell, Unit 23',
        loginAt: new Date().toISOString(),
      }));
      localStorage.setItem('vajra_onboarded', 'true');
    } catch {}
    onLogin();
  };

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ background: t.bg }}>
      <div className="flex flex-col h-full w-full md:max-w-md md:h-auto md:max-h-[92vh] md:rounded-3xl md:overflow-hidden md:shadow-2xl md:border md:border-white/15 relative">

        {/* ── Top dark branding half ── */}
        <div className="relative flex flex-col items-center justify-center pt-14 md:pt-10 pb-8 flex-shrink-0"
             style={{
               background: 'linear-gradient(175deg, #07101f 0%, #0e1c38 100%)',
               borderBottomLeftRadius: 36,
               borderBottomRightRadius: 36,
               boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
               zIndex: 10,
             }}>

          <NetworkDecoration />

          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 rounded-full"
                 style={{ background: 'radial-gradient(circle, rgba(30,95,255,0.15) 0%, transparent 70%)' }} />
          </div>

          <div className="z-10 flex flex-col items-center">
            <VajraLogo className="w-20 h-20 mb-1" />
            <h1 className="text-[32px] font-bold tracking-[0.15em] text-white"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
              VAJRA
            </h1>
            <p className="text-[10px] tracking-[0.12em] text-[#00f2fe]/70 uppercase mt-0.5 font-mono">
              National Crypto Forensics Portal
            </p>
            <div className="mt-2 px-3 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase"
                 style={{ background: 'rgba(0,242,254,0.12)', color: '#00f2fe', border: '1px solid rgba(0,242,254,0.3)' }}>
              Strict Access Control · 256-Bit TLS
            </div>
          </div>
        </div>

        {/* ── Bottom light form half ── */}
        <div className="flex-1 bg-[#f0f2f7] flex flex-col items-center px-6 pt-6 pb-6 overflow-y-auto -mt-3">

          <div className="w-full flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[24px] font-bold text-[#0e1c38] mb-0.5 leading-tight"
                  style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700 }}>
                Officer Authentication
              </h2>
              <p className="text-[12px] text-gray-500">Law Enforcement Portal Access</p>
            </div>

            {/* Quick Fill Demo Credentials */}
            <button
              onClick={fillDemoCredentials}
              type="button"
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#1e5fff] bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
              title="Auto-fill official credentials"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto Fill
            </button>
          </div>

          <div className="w-full space-y-3">
            {/* Email */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Officer Email (officer@vajra.gov.in)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-[14px] text-gray-800 placeholder-gray-400 outline-none transition-all duration-200"
                style={{
                  background: '#fff',
                  border: '1.5px solid #e2e6ef',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1e5fff'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e2e6ef'; }}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password (Vajra@Police2026)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 rounded-xl text-[14px] text-gray-800 placeholder-gray-400 outline-none transition-all duration-200"
                style={{
                  background: '#fff',
                  border: '1.5px solid #e2e6ef',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1e5fff'; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = '#e2e6ef'; }}
              />
              <button onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Credentials info pill */}
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span className="font-medium">Authorized Login:</span>
              <span className="font-mono text-slate-800 font-semibold select-all">officer@vajra.gov.in · Vajra@Police2026</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[12px] text-[#ff3d5a] font-medium flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 leading-snug">{error}</div>
              </div>
            )}

            <button onClick={handleLogin}
                    className="w-full text-white font-bold py-3.5 rounded-xl text-[15px] tracking-widest transition-all duration-200 active:scale-95 shadow-lg"
                    style={{
                      background: 'linear-gradient(90deg, #1e5fff, #0044cc)',
                      boxShadow:  '0 4px 20px rgba(30,95,255,0.45)',
                      fontFamily: "'Rajdhani', sans-serif",
                    }}>
              SECURE LOGIN
            </button>
          </div>

          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-[11px] text-gray-400 uppercase tracking-wider font-mono">Government Auth</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button
            onClick={handleSsoLogin}
            className="w-full bg-white border border-gray-200 text-[#0e1c38] font-semibold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors text-[13px] active:scale-95"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Direct Govt. SSO Single Sign-On
          </button>

          <p className="text-[11px] text-gray-400 mt-4 text-center">
            Restricted Portal. Authorized Law Enforcement personnel only. Unauthorized attempts logged under IT Act Sec 66.
          </p>
        </div>
      </div>
    </div>
  );
}
