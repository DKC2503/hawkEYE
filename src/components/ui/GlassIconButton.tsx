import React from 'react';

export interface GlassIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: 'surface' | 'elevated' | 'subtle' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  icon,
  ariaLabel,
  variant = 'surface',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center focus-ring transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-95 shrink-0';

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl text-sm min-h-[44px] min-w-[44px]',
    md: 'w-12 h-12 rounded-2xl text-base min-h-[48px] min-w-[48px]',
    lg: 'w-14 h-14 rounded-2xl text-lg min-h-[56px] min-w-[56px]',
  }[size];

  const variantClasses = {
    surface: 'glass-surface text-slate-700 hover:text-slate-950 hover:border-slate-300',
    elevated: 'glass-elevated text-slate-800 hover:text-slate-950 shadow-md',
    subtle: 'glass-subtle text-slate-600 hover:text-slate-900',
    accent: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-600/20',
  }[variant];

  return (
    <button
      aria-label={ariaLabel}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};
