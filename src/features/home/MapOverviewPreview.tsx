import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';
import { SectionHeader } from '../../components/civic/SectionHeader';

export const MapOverviewPreview: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <SectionHeader
        title="City Overview Map"
        subtitle="Geospatial visualization of local civic reports"
        actionLabel="Full Map"
        onAction={() => navigate('/map')}
      />

      <GlassSurface
        variant="surface"
        rounded="2xl"
        className="p-6 relative overflow-hidden border-slate-200/80 text-center min-h-[220px] flex flex-col items-center justify-center space-y-4 group bg-white/60"
      >
        {/* Light Map Grid Lines */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl glass-elevated text-amber-700 flex items-center justify-center relative z-10 shadow-md">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>

        <div className="space-y-1 relative z-10 max-w-sm">
          <h4 className="text-sm font-bold text-slate-900">Interactive City Map Preview</h4>
          <p className="text-xs text-slate-600">
            Future Leaflet GIS map integration zone. Citizens can inspect active report clusters and road hazards.
          </p>
        </div>

        <div className="relative z-10 pt-1">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => navigate('/map')}
            leftIcon={
              <svg className="w-4 h-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          >
            Explore City Map
          </GlassButton>
        </div>
      </GlassSurface>
    </div>
  );
};
