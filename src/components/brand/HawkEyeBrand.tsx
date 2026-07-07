import React from 'react';
import logoImg from '../../assets/logo.png';
import titleImg from '../../assets/Title.png';

interface HawkEyeBrandProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

export const HawkEyeBrand: React.FC<HawkEyeBrandProps> = ({
  variant = 'dark',
  compact = false,
  className = '',
  onClick,
}) => {
  const isLight = variant === 'light';

  return (
    <div
      onClick={onClick}
      className={`animate-brand-entrance select-none flex items-center transition-all citizen-mobile-brand ${
        isLight ? 'brand-glass-light' : 'brand-glass'
      } ${onClick ? 'cursor-pointer hover:opacity-95 active:scale-[0.98]' : ''} ${className}`}
      title="hawkEYE — Civic Intelligence Platform"
    >
      {/* Eye Symbol with Glint Entrance */}
      <div className="eye-glint-wrapper shrink-0 flex items-center justify-center">
        <img
          src={logoImg}
          alt="hawkEYE Eye Icon"
          className={`object-contain logo-drop-shadow shrink-0 citizen-mobile-brand-eye ${
            compact ? 'h-6 sm:h-7 w-auto' : 'h-7 sm:h-8 md:h-9 w-auto'
          }`}
          loading="eager"
        />
      </div>

      {/* hawkEYE Wordmark Asset */}
      <img
        src={titleImg}
        alt="hawkEYE Title"
        className={`object-contain logo-drop-shadow shrink-0 citizen-mobile-brand-wordmark ${
          compact ? 'h-7 sm:h-8 w-auto' : 'h-8 sm:h-9 md:h-[38px] w-auto'
        } ${isLight ? 'brightness-90 contrast-125' : ''}`}
        loading="eager"
      />
    </div>
  );
};
