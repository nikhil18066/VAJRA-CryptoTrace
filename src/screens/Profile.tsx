import { useState } from 'react';
import type { ReactNode } from 'react';
import BottomNav from '../components/BottomNav';
import { VajraLogo } from '../components/Graphics';
import { useTheme } from '../context/theme';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';

interface ProfileProps {
  onNavigate: (tab: Tab) => void;
  onLogout: () => void;
  activeTab: Tab;
}

function SettingIcon({ id }: { id: string }) {
  const icons: Record<string, ReactNode> = {
    user: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    lock: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    bell: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    shield: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    log: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    api: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  };
  return icons[id] || icons['user'];
}

// Animated toggle switch
function ThemeToggle({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className="relative flex-shrink-0"
      style={{
        width: 48, height: 26,
        borderRadius: 13,
        background: isDark ? '#1e5fff' : '#f5a623',
        border: isDark ? '1px solid rgba(30,95,255,0.5)' : '1px solid rgba(245,166,35,0.5)',
        transition: 'background 0.25s ease, border-color 0.25s ease',
        position: 'relative',
      }}
      aria-label="Toggle theme"
    >
      {/* Sun/Moon icon inside track */}
      <span style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        fontSize: 11, transition: 'opacity 0.2s',
        left: isDark ? 6 : 'auto', right: isDark ? 'auto' : 6,
        opacity: 0.9,
      }}>
        {isDark ? '🌙' : '☀️'}
      </span>
      {/* Thumb */}
      <span style={{
        position: 'absolute', top: 3,
        left: isDark ? 'auto' : 3,
        right: isDark ? 3 : 'auto',
        width: 18, height: 18,
        borderRadius: 9,
        background: '#ffffff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.25s cubic-bezier(0.34,1.56,0.64,1), right 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }} />
    </button>
  );
}

export default function Profile({ onNavigate, onLogout, activeTab }: ProfileProps) {
  const { t, toggle } = useTheme();
  const isDark = t.mode === 'dark';
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const STATS = [
    { label: 'Cases',    value: '47' },
    { label: 'VASP IDs', value: '128' },
    { label: 'Reports',  value: '39' },
  ];

  const SETTINGS = [
    {
      group: 'Account',
      items: [
        { id: 'profile', label: 'Profile',         icon: 'user',   desc: 'Personal details & badge ID',    special: false },
        { id: 'passwd',  label: 'Change Password', icon: 'lock',   desc: 'Update your credentials',        special: false },
      ],
    },
    {
      group: 'Preferences',
      items: [
        { id: 'notif',   label: 'Notifications',   icon: 'bell',   desc: 'Alert & push settings',          special: false },
        { id: 'theme',   label: 'Appearance',      icon: 'theme',  desc: isDark ? 'Dark mode' : 'Light mode', special: true },
      ],
    },
    {
      group: 'System',
      items: [
        { id: 'security',label: 'Security & RBAC', icon: 'shield', desc: 'Roles, sessions & audit',        special: false },
        { id: 'audit',   label: 'Audit Log',       icon: 'log',    desc: 'View all user actions',          special: false },
        { id: 'api',     label: 'API Access',      icon: 'api',    desc: 'Manage API keys & scopes',       special: false },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: t.bg }}>

      {/* Header */}
      <div className="flex-shrink-0" style={{ background: t.nav }}>
        <div className="px-5 pt-14 pb-5">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-[22px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
              Profile & Settings
            </h1>
            <VajraLogo className="w-8 h-8 opacity-60" />
          </div>

          {/* User card */}
          <div className="rounded-2xl p-4 flex items-center gap-4"
               style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[24px] font-bold text-white"
                   style={{
                     background: 'linear-gradient(135deg, #1e5fff, #0033cc)',
                     boxShadow: '0 4px 16px rgba(30,95,255,0.35)',
                     fontFamily: "'Rajdhani', sans-serif",
                   }}>
                RS
              </div>
              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#00d68f] border-2"
                   style={{ borderColor: t.card }} />
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                Rohit Sharma
              </p>
              <p className="text-[11px]" style={{ color: t.textSub }}>Investigator · Cyber Cell, Unit 23</p>
              <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(0,242,254,0.7)' }}>
                ID: LEA-CYB-2847
              </p>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: t.itemBg }}>
              <svg className="w-4 h-4" style={{ color: t.textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2.5 mt-3">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                   style={{ background: t.card2, border: `1px solid ${t.border}` }}>
                <p className="text-[20px] font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", color: t.text }}>
                  {s.value}
                </p>
                <p className="text-[10px]" style={{ color: t.textMuted }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings list */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
        {SETTINGS.map((group) => (
          <div key={group.group}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
               style={{ color: t.textMuted }}>
              {group.group}
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${t.border}` }}>
              {group.items.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => item.special ? toggle() : setActiveSection(activeSection === item.id ? null : item.id)}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 transition-all duration-150 text-left"
                  style={{
                    background: i % 2 === 0 ? t.card : t.card2,
                    borderBottom: i < group.items.length - 1 ? `1px solid ${t.border}` : 'none',
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                       style={{ background: 'rgba(0,242,254,0.08)', color: '#00f2fe' }}>
                    {item.id === 'theme' ? (
                      isDark ? (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      ) : (
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )
                    ) : (
                      <SettingIcon id={item.icon} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: t.text }}>{item.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: t.textMuted }}>{item.desc}</p>
                  </div>
                  {item.special ? (
                    <ThemeToggle isDark={isDark} onToggle={toggle} />
                  ) : (
                    <svg className="w-4 h-4" style={{ color: t.textMuted }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* App info */}
        <div className="rounded-xl p-4 text-center" style={{ background: t.card2, border: `1px solid ${t.border}` }}>
          <p className="text-[10px]" style={{ color: t.textMuted }}>VAJRA CryptoTrace · v1.0.0-beta</p>
          <p className="text-[10px] mt-0.5" style={{ color: t.textMuted, opacity: 0.6 }}>
            SIH26183 · Law Enforcement Edition
          </p>
        </div>

        {/* Logout */}
        <button onClick={onLogout}
                className="w-full py-3.5 rounded-xl font-bold text-[14px] tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,61,90,0.08)',
                  border: '1px solid rgba(255,61,90,0.2)',
                  color: '#ff3d5a',
                  fontFamily: "'Rajdhani', sans-serif",
                }}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          LOGOUT
        </button>

        <div className="h-2" />
      </div>

      <BottomNav active={activeTab} onNavigate={onNavigate} />
    </div>
  );
}
