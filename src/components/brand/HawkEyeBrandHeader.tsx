import React from 'react';
import { HawkEyeBrand } from './HawkEyeBrand';

interface HawkEyeBrandHeaderProps {
  compact?: boolean;
  className?: string;
  variant?: 'dark' | 'light';
  onClick?: () => void;
}

export const HawkEyeBrandHeader: React.FC<HawkEyeBrandHeaderProps> = ({
  compact = false,
  className = '',
  variant = 'dark',
  onClick,
}) => {
  return (
    <HawkEyeBrand
      compact={compact}
      className={className}
      variant={variant}
      onClick={onClick}
    />
  );
};
