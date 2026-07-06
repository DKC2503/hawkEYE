import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassSurface } from '../../components/ui/GlassSurface';

export const PrimaryReportAction: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GlassSurface
      variant="elevated"
      rounded="3xl"
      interactive
      onClick={() => navigate('/report')}
      className="p-6 sm:p-8 bg-gradient-to-br from-amber-50/90 via-amber-100/40 to-white/95 border-amber-300/70 shadow-xl relative overflow-hidden group"
    >
      {/* Specular Ambient Glow Accent */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-200/40 blur-2xl group-hover:bg-amber-300/40 transition-all duration-300 pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/90 border border-amber-300/80 text-amber-900 text-xs font-extrabold uppercase tracking-wider">
            <span>Primary Citizen Action</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Report an Issue
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-lg leading-relaxed font-normal">
            Spotted a pothole, broken streetlight, or garbage overflow? Capture a photo and report civic hazards directly to city authorities.
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate('/report');
          }}
          className="w-full sm:w-auto min-h-[56px] px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-base flex items-center justify-center gap-3 shadow-lg shadow-amber-600/25 transition-transform active:scale-95 touch-target shrink-0"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Report Now</span>
        </button>
      </div>
    </GlassSurface>
  );
};
