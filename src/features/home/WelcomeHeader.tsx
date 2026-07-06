import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';

export const WelcomeHeader: React.FC = () => {
  return (
    <GlassSurface variant="surface" rounded="2xl" className="p-4 sm:p-5 flex items-center justify-between gap-4 border-slate-200/80">
      <div className="space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Welcome, Citizen
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Select city on map</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-subtle text-xs text-slate-700 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>HawkEYE Safety Network</span>
      </div>
    </GlassSurface>
  );
};
