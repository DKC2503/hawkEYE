import React from 'react';

export type GlassLevel = 'surface' | 'elevated' | 'subtle';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: GlassLevel;
  interactive?: boolean;
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  variant = 'surface',
  interactive = false,
  className = '',
  rounded = '2xl',
  ...props
}) => {
  const levelClass = {
    surface: 'glass-surface',
    elevated: 'glass-elevated',
    subtle: 'glass-subtle',
  }[variant];

  const roundedClass = {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    '2xl': 'rounded-3xl',
    '3xl': 'rounded-[2rem]',
    full: 'rounded-full',
  }[rounded];

  const interactiveClass = interactive
    ? 'transition-all duration-200 cursor-pointer hover:border-amber-300/80 hover:shadow-md active:scale-[0.99]'
    : '';

  return (
    <div
      className={`${levelClass} ${roundedClass} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
