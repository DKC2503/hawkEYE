import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface DesktopNavProps {
  variant?: 'dark' | 'light';
}

export const DesktopNav: React.FC<DesktopNavProps> = ({ variant = 'dark' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLight = variant === 'light';

  const navItems = [
    { label: 'City Map', route: '/map' },
    { label: 'Report Issue', route: '/report' },
    { label: 'My Reports', route: '/issues' },
    { label: 'How It Works', route: '/transparency' },
  ];

  return (
    <nav
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-sans text-xs transition-all ${
        isLight ? 'liquid-glass-light' : 'liquid-glass'
      }`}
      aria-label="Primary Navigation"
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.route;
        return (
          <button
            key={item.route}
            type="button"
            onClick={() => navigate(item.route)}
            className={`px-4 py-2 rounded-full font-medium tracking-tight transition-all duration-300 relative ${
              isActive
                ? isLight
                  ? 'bg-slate-900 text-white font-semibold shadow-md shadow-slate-900/10'
                  : 'bg-white/20 text-white font-semibold shadow-md shadow-white/10 border border-white/20'
                : isLight
                ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60 hover:-translate-y-0.5'
                : 'text-white/75 hover:text-white hover:bg-white/10 hover:-translate-y-0.5'
            }`}
          >
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
