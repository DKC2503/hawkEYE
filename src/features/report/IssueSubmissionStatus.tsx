import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import type { SubmissionState } from '../../types/reportFlow';
import type { CreatedIssueReceipt } from '../../services/issueApiService';

interface IssueSubmissionStatusProps {
  submissionState: SubmissionState;
  errorMessage?: string | null;
  errorCode?: string | null;
  createdReceipt?: CreatedIssueReceipt | null;
  onSubmit: () => void;
  onReset: () => void;
}

export const IssueSubmissionStatus: React.FC<IssueSubmissionStatusProps> = ({
  submissionState,
  errorMessage,
  errorCode,
  createdReceipt,
  onSubmit,
  onReset,
}) => {
  const navigate = useNavigate();

  const isSubmitting = submissionState === 'submitting';
  const isSuccess = submissionState === 'success' && createdReceipt !== null;
  const isFailure = submissionState === 'failure';

  return (
    <GlassSurface variant="surface" rounded="3xl" className="p-6 sm:p-8 space-y-6 border-slate-200/80">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Step 5: Official Report Submission</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Review the details and submit your report to the appropriate municipal department.
        </p>
      </div>

      {/* Submission Ready State */}
      {submissionState === 'ready' && (
        <div className="p-6 text-center space-y-4 glass-subtle rounded-2xl bg-white/70">
          <div className="w-14 h-14 rounded-2xl glass-elevated text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-slate-900">Ready to Submit</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your report details, location coordinates, and AI vision verification are ready for official submission.
            </p>
          </div>

          <div className="pt-2">
            <GlassButton
              variant="accent"
              size="lg"
              fullWidth
              onClick={onSubmit}
              disabled={isSubmitting}
            >
              Submit Report
            </GlassButton>
          </div>
        </div>
      )}

      {/* Submitting Active State */}
      {isSubmitting && (
        <div className="p-8 text-center space-y-4 glass-subtle rounded-2xl bg-white/70">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Submitting Official Report...</h4>
            <p className="text-xs text-slate-600">Securing connection • Processing report details • Logging official ticket</p>
          </div>
        </div>
      )}

      {/* Submission Success Receipt State */}
      {isSuccess && createdReceipt && (
        <div className="space-y-5">
          <div className="p-6 text-center space-y-3 glass-subtle rounded-2xl bg-emerald-50/80 border border-emerald-200/80">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-emerald-950">Report Submitted Successfully</h4>
              <p className="text-xs text-emerald-800">Your complaint has been officially logged in the system.</p>
            </div>

            {/* Ticket Receipt Card */}
            <div className="p-4 bg-white rounded-xl border border-emerald-200/80 space-y-2 text-left shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Official Ticket ID</span>
                <span className="text-sm font-extrabold font-mono text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                  {createdReceipt.ticketId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block font-medium">Category</span>
                  <span className="font-bold text-slate-900 capitalize">{createdReceipt.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Status</span>
                  <span className="font-bold text-emerald-700 uppercase">{createdReceipt.status}</span>
                </div>
              </div>

              {createdReceipt.location?.displayName && (
                <div className="text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-400 block font-medium">Location</span>
                  <span className="font-bold text-slate-900 truncate block">{createdReceipt.location.displayName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <GlassButton
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => navigate('/issues')}
            >
              View My Issues
            </GlassButton>
            <GlassButton
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                onReset();
                navigate('/');
              }}
            >
              Back to Home
            </GlassButton>
          </div>
        </div>
      )}

      {/* Submission Failure Error State */}
      {isFailure && (
        <div className="p-6 text-center space-y-4 glass-subtle rounded-2xl bg-rose-50/80 border border-rose-200/80">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-rose-950">Submission Failed</h4>
            <p className="text-xs text-rose-800 leading-relaxed font-medium">
              {errorMessage || 'Could not complete issue submission. Please try again.'}
            </p>
            {errorCode && (
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-rose-200 text-rose-900 font-mono text-[11px] font-bold">
                Code: {errorCode}
              </span>
            )}
          </div>

          <div className="pt-2">
            <GlassButton variant="accent" size="md" fullWidth onClick={onSubmit}>
              Retry Submission
            </GlassButton>
          </div>
        </div>
      )}
    </GlassSurface>
  );
};
