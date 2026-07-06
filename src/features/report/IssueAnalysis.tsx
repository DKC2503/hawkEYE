import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';
import type { AIAnalysisState, HawkEyeVisionResult } from '../../types/reportFlow';

interface IssueAnalysisProps {
  aiState: AIAnalysisState;
  errorMessage?: string | null;
  errorCode?: string | null;
  visionResult?: HawkEyeVisionResult | null;
  hasImage: boolean;
  onRunAnalysis: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const IssueAnalysis: React.FC<IssueAnalysisProps> = ({
  aiState,
  errorMessage,
  errorCode,
  visionResult,
  hasImage,
  onRunAnalysis,
  onNext,
  onBack,
}) => {
  const isDev = import.meta.env.DEV;

  return (
    <GlassSurface variant="surface" rounded="3xl" className="p-6 sm:p-8 space-y-6 border-slate-200/80">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Step 3: Vision Analysis</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          Automated evaluation for citizen-reported public infrastructure hazards.
        </p>
      </div>

      {/* Main AI Analysis Surface */}
      <GlassSurface variant="subtle" rounded="2xl" className="p-6 space-y-4 border-slate-200/80 bg-white/70">
        {!hasImage && (
          <div className="text-center space-y-3 p-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-900">No Image Attached</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Please go back to Step 1 and capture or upload an issue photo before running vision analysis.
            </p>
            <GlassButton variant="secondary" size="sm" onClick={onBack}>
              &larr; Return to Step 1 (Capture Photo)
            </GlassButton>
          </div>
        )}

        {hasImage && aiState === 'idle' && (
          <div className="text-center space-y-3 p-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto border border-amber-300">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-900">Ready for Vision Scan</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Start the scan to inspect the image and identify the civic issue, severity, and relevant details.
            </p>
            <div className="pt-2">
              <GlassButton variant="accent" size="md" onClick={onRunAnalysis}>
                Analyze Issue
              </GlassButton>
            </div>
          </div>
        )}

        {aiState === 'analyzing' && (
          <div className="text-center space-y-3 p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-amber-900">Analyzing Your Report...</h4>
            <p className="text-xs text-slate-600">Identifying the issue, assessing its severity, and preparing report details.</p>
          </div>
        )}

        {aiState === 'failed' && (
          <div className="text-center space-y-3 p-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto border border-rose-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {errorCode && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-100 text-rose-900 text-xs font-mono font-bold border border-rose-300">
                <span>Code: {errorCode}</span>
              </div>
            )}

            <h4 className="text-base font-bold text-rose-900">Analysis Standby</h4>
            <p className="text-xs text-slate-700 max-w-sm mx-auto font-medium leading-relaxed">
              {errorMessage || 'The service is temporarily unavailable. Please try again shortly.'}
            </p>

            {isDev && (
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 text-left font-mono space-y-1">
                <div className="font-bold text-slate-800">Dev Diagnostic Info:</div>
                <div>Category Code: {errorCode || 'UNKNOWN_ERROR'}</div>
                <div>Endpoint: POST /api/vision/analyze</div>
              </div>
            )}

            <div className="pt-2 flex justify-center gap-2">
              <GlassButton variant="secondary" size="sm" onClick={onRunAnalysis}>
                Retry Analysis
              </GlassButton>
            </div>
          </div>
        )}

        {aiState === 'success' && visionResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${visionResult.is_civic_issue ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className={`text-sm font-bold ${visionResult.is_civic_issue ? 'text-emerald-900' : 'text-amber-900'}`}>
                  {visionResult.is_civic_issue ? 'Civic Issue Verified' : 'No Civic Issue Detected'}
                </span>
              </div>
              <span className="text-xs font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 font-bold">
                Confidence: {Math.round(visionResult.confidence * 100)}%
              </span>
            </div>

            {visionResult.needs_human_review && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Recommended for Municipal Human Review</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl glass-surface space-y-1">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Detected Category</span>
                <p className="font-bold text-slate-900 capitalize">
                  {visionResult.category.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="p-3 rounded-xl glass-surface space-y-1">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Severity Level</span>
                <p className="font-bold text-amber-800 capitalize">
                  {visionResult.severity}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl glass-surface space-y-1 text-xs">
              <span className="text-slate-500 uppercase font-bold text-[10px]">Analysis Summary</span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {visionResult.summary}
              </p>
            </div>

            {visionResult.visible_risk && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                <span className="text-amber-900 uppercase font-bold text-[10px]">Visible Risk</span>
                <p className="text-slate-700 leading-relaxed font-normal">{visionResult.visible_risk}</p>
              </div>
            )}
          </div>
        )}
      </GlassSurface>

      {/* Navigation Controls */}
      <div className="flex gap-3 pt-2">
        <GlassButton variant="secondary" size="md" fullWidth onClick={onBack}>
          &larr; Back
        </GlassButton>
        <GlassButton
          variant="accent"
          size="md"
          fullWidth
          onClick={onNext}
          disabled={aiState === 'analyzing'}
        >
          Continue to Confirmation &rarr;
        </GlassButton>
      </div>
    </GlassSurface>
  );
};
