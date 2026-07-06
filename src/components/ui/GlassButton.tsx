import React from 'react';

export type GlassButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: GlassButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium touch-target focus-ring transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]';

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs rounded-xl gap-1.5 min-h-[44px]',
    md: 'px-5 py-2.5 text-sm rounded-2xl gap-2 min-h-[48px]',
    lg: 'px-6 py-3.5 text-base rounded-2xl gap-2.5 min-h-[52px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-md shadow-slate-900/10 border border-slate-700/30',
    secondary:
      'glass-surface text-slate-800 hover:text-slate-950 hover:bg-white border-slate-200/80 shadow-sm',
    accent:
      'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold border border-amber-500/40 shadow-md shadow-amber-600/20',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent',
    danger:
      'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 shadow-sm',
  }[variant];

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
