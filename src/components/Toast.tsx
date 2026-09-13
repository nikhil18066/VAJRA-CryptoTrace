import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  sub?: string;
}

const ICONS: Record<ToastType, React.ReactElement> = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'rgba(0,214,143,0.12)',  border: 'rgba(0,214,143,0.3)',  icon: '#00d68f', text: '#00d68f'  },
  error:   { bg: 'rgba(255,61,90,0.12)',  border: 'rgba(255,61,90,0.3)',  icon: '#ff3d5a', text: '#ff3d5a'  },
  info:    { bg: 'rgba(0,242,254,0.1)',   border: 'rgba(0,242,254,0.25)', icon: '#00f2fe', text: '#00f2fe'  },
  warning: { bg: 'rgba(245,166,35,0.12)', border: 'rgba(245,166,35,0.3)', icon: '#f5a623', text: '#f5a623'  },
};

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [exiting, setExiting] = useState(false);
  const c = COLORS[toast.type];

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2700);
    const t2 = setTimeout(() => onDismiss(toast.id), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      className={exiting ? 'toast-exit' : 'toast-enter'}
      style={{
        background: 'rgba(10,18,40,0.96)',
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.icon}`,
        borderRadius: 14,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 16px ${c.icon}22`,
        maxWidth: 340,
        marginBottom: 8,
      }}
    >
      <div style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>{ICONS[toast.type]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>{toast.message}</p>
        {toast.sub && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0' }}>{toast.sub}</p>
        )}
      </div>
      <button onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 200); }}
              style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, padding: '0 2px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ToastStackProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'absolute',
      top: 56,
      left: 12,
      right: 12,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
    }}>
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}
