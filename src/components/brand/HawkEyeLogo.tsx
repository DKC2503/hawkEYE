import React from 'react';
import logoImg from '../../assets/logo.png';

interface HawkEyeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'custom';
}

export const HawkEyeLogo: React.FC<HawkEyeLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-14 w-auto',
    custom: '',
  };

  return (
    <img
      src={logoImg}
      alt="hawkEYE Logo"
      className={`object-contain transition-transform duration-200 select-none ${sizeClasses[size]} ${className}`}
      loading="eager"
    />
  );
};
