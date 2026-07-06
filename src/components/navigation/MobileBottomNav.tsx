import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../types/navigation';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (iconName: string, isActive: boolean) => {
    const strokeWidth = isActive ? 2.5 : 1.8;
    switch (iconName) {
      case 'home':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'map':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        );
      case 'report':
        return (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'issues':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-3 pb-[max(0.75rem,var(--sab))] pt-2 transition-all duration-300"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="glass-elevated rounded-3xl p-1.5 flex items-center justify-around shadow-xl backdrop-blur-2xl border-slate-200/90 max-w-lg mx-auto bg-white/92">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.route;
          if (item.isPrimaryAction) {
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                aria-label={item.label}
                className="relative -top-3 flex flex-col items-center justify-center p-2 focus-ring touch-target transition-transform duration-200 active:scale-90"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-600 to-amber-700 text-white ring-4 ring-amber-400/30 scale-105'
                      : 'bg-gradient-to-tr from-amber-600 to-amber-700 text-white hover:scale-105'
                  }`}
                >
                  {getIcon(item.iconName, isActive)}
                </div>
                <span className="text-[10px] font-extrabold text-amber-800 mt-1 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl focus-ring touch-target transition-all duration-200 ${
                isActive
                  ? 'text-slate-900 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'glass-subtle bg-amber-500/10 border-amber-500/30 text-amber-800' : ''
                }`}
              >
                {getIcon(item.iconName, isActive)}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
