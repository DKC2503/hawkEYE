import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';

export const MapLegend: React.FC = () => {
  return (
    <GlassSurface variant="subtle" rounded="xl" className="p-3 space-y-2 text-xs border-slate-200/80 backdrop-blur-md bg-white/80">
      <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
        Map Legend
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-sm" />
          <span>Critical Hazard</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
          <span>High Priority</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-sm" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <span>Resolved</span>
        </div>
      </div>
    </GlassSurface>
  );
};
