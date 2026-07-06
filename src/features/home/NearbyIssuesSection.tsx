import React, { useState } from 'react';
import { SectionHeader } from '../../components/civic/SectionHeader';
import { EmptyState } from '../../components/civic/EmptyState';
import { LoadingState } from '../../components/civic/LoadingState';
import { ErrorState } from '../../components/civic/ErrorState';

export const NearbyIssuesSection: React.FC = () => {
  const [viewState, setViewState] = useState<'empty' | 'loading' | 'error'>('empty');

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Nearby Issues"
        subtitle="Recent community reports in your vicinity"
      />

      {/* Dev State switcher controls */}
      {import.meta.env.DEV && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Dev State Switcher:</span>
          <button
            onClick={() => setViewState('empty')}
            className={`px-2 py-0.5 text-[10px] rounded-md ${
              viewState === 'empty' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-500'
            }`}
          >
            Empty
          </button>
          <button
            onClick={() => setViewState('loading')}
            className={`px-2 py-0.5 text-[10px] rounded-md ${
              viewState === 'loading' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-500'
            }`}
          >
            Loading
          </button>
          <button
            onClick={() => setViewState('error')}
            className={`px-2 py-0.5 text-[10px] rounded-md ${
              viewState === 'error' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-slate-500'
            }`}
          >
            Error
          </button>
        </div>
      )}

      {viewState === 'loading' && (
        <LoadingState message="Fetching nearby issues from city API..." rows={2} />
      )}

      {viewState === 'error' && (
        <ErrorState
          title="Nearby Issues Unavailable"
          message="Could not load nearby reports. Check your internet connection or city service status."
          onRetry={() => setViewState('empty')}
        />
      )}

      {viewState === 'empty' && (
        <EmptyState
          title="No Nearby Issues Reported"
          description="There are currently no active public issues reported in your immediate vicinity."
          icon={
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      )}
    </div>
  );
};
