import React from 'react';

export const AuthorityMapLegend: React.FC = () => {
  return (
    <div className="auth-glass-surface p-3 rounded-xl border border-slate-800 space-y-2 text-[11px] font-mono select-none">
      <span className="text-slate-400 font-bold uppercase tracking-wider block">Operational Legend</span>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="text-rose-300">Critical Hazard Marker</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
          <span className="text-orange-300">High Priority Marker</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-amber-300">Medium Priority Marker</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-emerald-300">Resolved / Verified</span>
        </div>
      </div>
    </div>
  );
};
