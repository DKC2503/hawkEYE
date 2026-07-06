import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';

export const EmptyIssuesState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <GlassSurface variant="subtle" rounded="3xl" className="p-8 sm:p-12 text-center space-y-5 max-w-lg mx-auto border-slate-200/80 bg-white/70">
      <div className="w-16 h-16 rounded-2xl glass-elevated text-amber-700 flex items-center justify-center mx-auto shadow-sm border border-slate-200/80">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-900">No Reported Issues Found</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          You haven't submitted any civic issue tickets yet. Whenever you submit a report, your tracking history and status updates will appear here.
        </p>
      </div>

      <div className="pt-2 flex justify-center">
        <GlassButton
          variant="accent"
          size="md"
          onClick={() => navigate('/report')}
          leftIcon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Submit a Civic Report Now
        </GlassButton>
      </div>
    </GlassSurface>
  );
};
