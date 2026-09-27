import type { ReactNode } from 'react';
import { useTheme } from '../context/theme';

type Tab = 'DASHBOARD' | 'INVESTIGATE' | 'ALERTS' | 'PROFILE';

interface BottomNavProps {
  active: Tab;
  onNavigate: (tab: Tab) => void;
  alertCount?: number;
}

export default function BottomNav({ active, onNavigate, alertCount = 3 }: BottomNavProps) {
  const { t } = useTheme();
  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    {
      id: 'DASHBOARD',
      label: 'Home',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'INVESTIGATE',
      label: 'Investigate',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      id: 'ALERTS',
      label: 'Alerts',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: 'PROFILE',
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="md:hidden flex-shrink-0 px-2 py-2 flex justify-around items-center"
         style={{ background: t.card, borderTop: `1px solid ${t.border}` }}>
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className="relative flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all duration-200"
            style={{ color: isActive ? (t.mode === 'light' ? '#1d4ed8' : '#00f2fe') : t.textMuted }}
          >
            {tab.id === 'ALERTS' && alertCount > 0 && (
              <span className="absolute -top-0.5 right-2.5 w-4 h-4 bg-[#ff3d5a] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {alertCount}
              </span>
            )}
            <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {isActive && (
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full ${t.mode === 'light' ? 'bg-blue-700' : 'bg-[#00f2fe]'}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
