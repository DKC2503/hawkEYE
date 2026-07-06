import React, { useEffect, type ReactNode } from 'react';

export type LiquidGlassModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  variant?: 'info' | 'warning' | 'danger' | 'success';
  children?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  onClose: () => void;
};

export const LiquidGlassModal: React.FC<LiquidGlassModalProps> = ({
  isOpen,
  title,
  description,
  variant = 'info',
  children,
  primaryAction,
  secondaryAction,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return { iconColor: 'text-amber-400' };
      case 'danger':
        return { iconColor: 'text-rose-400' };
      case 'success':
        return { iconColor: 'text-emerald-400' };
      default:
        return { iconColor: 'text-amber-400' };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300"
    >
      {/* Blurred Liquid Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog Body */}
      <div className="w-full max-w-lg auth-glass-elevated rounded-3xl p-6 sm:p-7 space-y-5 border border-slate-800/80 shadow-2xl relative z-10 font-sans transform transition-all duration-300 scale-100">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${variantStyle.iconColor} bg-current animate-pulse`} />
              <span>{title}</span>
            </h3>
            {description && <p className="text-xs text-slate-400">{description}</p>}
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors font-bold text-xl"
          >
            &times;
          </button>
        </div>

        {children && <div className="space-y-3">{children}</div>}

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800/80">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all font-mono"
            >
              {secondaryAction.label}
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all font-mono flex items-center justify-center gap-2"
            >
              {primaryAction.loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{primaryAction.label}</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
