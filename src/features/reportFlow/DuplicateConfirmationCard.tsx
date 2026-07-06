import React, { useState } from 'react';
import type { DuplicateCandidate } from '../../services/issueApiService';
import { issueApiService } from '../../services/issueApiService';
import { GlassSurface } from '../../components/ui/GlassSurface';

interface DuplicateConfirmationCardProps {
  candidate: DuplicateCandidate;
  onConfirmDifferent: () => void;
  onSuccessHandRaised: (ticketId: string) => void;
}

export const DuplicateConfirmationCard: React.FC<DuplicateConfirmationCardProps> = ({
  candidate,
  onConfirmDifferent,
  onSuccessHandRaised,
}) => {
  const [submittingHand, setSubmittingHand] = useState(false);
  const [handSuccess, setHandSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRaiseHand = async () => {
    setSubmittingHand(true);
    setErrorMsg(null);
    try {
      const targetId = candidate.issueId || candidate.ticketId;
      const res = await issueApiService.raiseHand(targetId);
      setHandSuccess(true);
      setTimeout(() => {
        onSuccessHandRaised(res.ticketId || candidate.ticketId);
      }, 1500);
    } catch {
      setErrorMsg('Failed to register support. Please try again.');
    } finally {
      setSubmittingHand(false);
    }
  };

  return (
    <GlassSurface variant="surface" rounded="2xl" className="p-6 border-amber-300 bg-amber-50/90 space-y-5 text-slate-900 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Similar Issue Already Reported Nearby</h3>
          <p className="text-xs text-slate-600">
            A matching civic report was found <strong>{candidate.distanceMeters}m</strong> from your location.
          </p>
        </div>
      </div>

      {/* Candidate Card Preview */}
      <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300">
            {candidate.ticketId}
          </span>
          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            {candidate.status}
          </span>
        </div>

        <div className="flex items-start gap-3">
          {candidate.imageUrl && (
            <img
              src={candidate.imageUrl}
              alt={candidate.ticketId}
              className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100"
            />
          )}
          <div className="space-y-1 min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 line-clamp-1 capitalize">
              {candidate.category}: {candidate.description}
            </h4>
            <p className="text-xs text-slate-500 truncate">
              {candidate.location?.displayName || candidate.location?.area || 'Nearby area'}
            </p>
            <div className="text-[11px] text-slate-600 font-medium">
              Community Support: <strong className="text-amber-700">{candidate.supportCount || 0} Raised Hands</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-700 font-medium space-y-1">
        <p className="font-bold text-slate-900">Is this the same issue you are reporting?</p>
        <p className="text-slate-600">
          Raising a hand tells the municipal authority that another citizen is affected by this issue, increasing dispatch priority without creating duplicate tickets.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {handSuccess ? (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold text-center">
          Support added successfully! Redirecting...
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleRaiseHand}
            disabled={submittingHand}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            <span>Raise A Hand on Existing Issue</span>
          </button>

          <button
            type="button"
            onClick={onConfirmDifferent}
            disabled={submittingHand}
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs transition-all"
          >
            No, This Is A Different Issue
          </button>
        </div>
      )}
    </GlassSurface>
  );
};
