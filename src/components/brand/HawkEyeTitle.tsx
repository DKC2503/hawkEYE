import React from 'react';
import titleImg from '../../assets/Title.png';

interface HawkEyeTitleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'custom';
}

export const HawkEyeTitle: React.FC<HawkEyeTitleProps> = ({
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-11 w-auto',
    custom: '',
  };

  return (
    <img
      src={titleImg}
      alt="hawkEYE Title"
      className={`object-contain transition-transform duration-200 select-none ${sizeClasses[size]} ${className}`}
      loading="eager"
    />
  );
};
