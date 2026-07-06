import React, { useEffect } from 'react';

export type ToastProps = {
  id?: string;
  type?: 'success' | 'error' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: () => void;
};

export const ToastNotification: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-slate-900/95 border-emerald-500/40 text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-400',
          icon: (
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 border-rose-500/40 text-rose-300',
          badge: 'bg-rose-500/20 text-rose-400',
          icon: (
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      default:
        return {
          bg: 'bg-slate-900/95 border-amber-500/40 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-400',
          icon: (
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const style = getStyles();

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full font-sans animate-slideUp">
      <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start justify-between gap-3 ${style.bg}`}>
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-xl shrink-0 ${style.badge}`}>{style.icon}</div>
          <div className="space-y-0.5">
            {title && <h4 className="text-xs font-bold font-mono tracking-wide text-white">{title}</h4>}
            <p className="text-xs font-medium text-slate-200">{message}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white font-bold text-base leading-none p-1 transition-colors"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
