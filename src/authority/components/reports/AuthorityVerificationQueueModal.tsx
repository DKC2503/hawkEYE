import React, { useState, useEffect } from 'react';
import { artisanApiClient, type ArtisanWorkOrder } from '../../../services/artisanApiClient';
import { LiquidGlassModal } from '../../../components/ui/LiquidGlassModal';
import { GlassDropdown, type GlassDropdownOption } from '../../../components/ui/GlassDropdown';

const rejectionOptions: GlassDropdownOption[] = [
  { value: 'Work incomplete', label: 'Work incomplete' },
  { value: 'Evidence unclear', label: 'Evidence unclear' },
  { value: 'Wrong location', label: 'Wrong location' },
  { value: 'Additional repair required', label: 'Additional repair required' },
  { value: 'Safety issue remains', label: 'Safety issue remains' },
  { value: 'Other', label: 'Other' },
];

interface AuthorityVerificationQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthorityVerificationQueueModal: React.FC<AuthorityVerificationQueueModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [queue, setQueue] = useState<ArtisanWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWO, setSelectedWO] = useState<ArtisanWorkOrder | null>(null);

  // Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Evidence unclear');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await artisanApiClient.getVerificationQueue();
      setQueue(data);
      if (data.length > 0) {
        setSelectedWO(data[0]);
      } else {
        setSelectedWO(null);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchQueue();
    }
  }, [isOpen]);

  const handleApprove = async () => {
    if (!selectedWO) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await artisanApiClient.approveVerification(selectedWO.workOrderId);
      setActionMessage({ text: `Work Order '${selectedWO.workOrderNumber}' verified and marked COMPLETED!`, type: 'success' });
      await fetchQueue();
      onSuccess();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to approve work order.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWO || !rejectionRemarks.trim()) return;
    setActionLoading(true);
    setActionMessage(null);
    try {
      await artisanApiClient.rejectVerification(selectedWO.workOrderId, rejectionReason, rejectionRemarks.trim());
      setShowRejectModal(false);
      setActionMessage({ text: `Work Order '${selectedWO.workOrderNumber}' returned to worker for correction.`, type: 'success' });
      setRejectionRemarks('');
      await fetchQueue();
      onSuccess();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to reject work order.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl font-sans">
      <div className="w-full max-w-5xl auth-glass-elevated rounded-3xl p-6 sm:p-7 border border-slate-800 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
              <span>Authority Verification Queue (AWAITING VERIFICATION)</span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Inspect Artisan completion photographic evidence, compare Before vs After images, and issue approval or return for correction.
            </p>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white text-xl font-bold">
            &times;
          </button>
        </div>

        {actionMessage && (
          <div className={`p-4 rounded-2xl text-xs font-bold font-mono border ${actionMessage.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}`}>
            {actionMessage.text}
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400">Loading verification queue...</div>
        ) : queue.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Queue Item List */}
            <div className="space-y-3 font-mono text-xs max-h-[60vh] overflow-y-auto pr-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Pending Verification ({queue.length})</span>
              {queue.map((wo) => (
                <div
                  key={wo.workOrderId}
                  onClick={() => setSelectedWO(wo)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    selectedWO?.workOrderId === wo.workOrderId
                      ? 'bg-purple-500/15 border-purple-500/50 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{wo.ticketId}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      AWAITING
                    </span>
                  </div>
                  <p className="text-xs font-sans font-bold text-white line-clamp-1">{wo.issueSummary}</p>
                  <div className="text-[10px] text-slate-400">Worker: {wo.employeeName || 'Artisan Worker'}</div>
                </div>
              ))}
            </div>

            {/* Right Detailed Comparison Workspace */}
            {selectedWO && (
              <div className="lg:col-span-2 space-y-5 auth-glass-surface p-6 rounded-3xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">{selectedWO.issueCategory}</h3>
                    <p className="text-xs font-mono text-slate-400">Ticket: <strong className="text-amber-400">{selectedWO.ticketId}</strong> • WO: <strong className="text-white">{selectedWO.workOrderNumber}</strong></p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                    AWAITING VERIFICATION
                  </span>
                </div>

                {/* BEFORE VS AFTER IMAGE COMPARISON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">BEFORE (Original Report Photo)</span>
                    {selectedWO.imageUrl ? (
                      <img src={selectedWO.imageUrl} alt="Before" className="w-full h-48 object-cover rounded-2xl border border-slate-800" />
                    ) : (
                      <div className="w-full h-48 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-500">No Image</div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase text-amber-400 block">AFTER (Artisan Completion Photo)</span>
                    {selectedWO.completionEvidence?.afterImages?.[0]?.secureUrl ? (
                      <img src={selectedWO.completionEvidence.afterImages[0].secureUrl} alt="After" className="w-full h-48 object-cover rounded-2xl border border-amber-500/40" />
                    ) : (
                      <div className="w-full h-48 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-500">No Evidence Uploaded</div>
                    )}
                  </div>
                </div>

                {/* WORKER COMPLETION REMARKS */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
                  <span className="text-[10px] text-amber-400 font-bold uppercase block">Artisan Completion Remarks</span>
                  <p className="text-slate-200 font-sans text-xs font-medium">{selectedWO.completionEvidence?.completionRemarks || 'Work completed per specifications.'}</p>
                </div>

                {/* AUTHORITY ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowRejectModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-bold border border-rose-500/40 transition-colors"
                  >
                    REJECT & RETURN TO WORKER
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleApprove}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? 'Processing...' : '✔ VERIFY & MARK COMPLETED'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-slate-300">No work orders currently awaiting authority verification</p>
            <p className="text-xs text-slate-500 font-mono">When artisans finish physical work and upload completion evidence, tasks will appear here for review.</p>
          </div>
        )}
      </div>

      {/* REJECTION REASON MODAL */}
      <LiquidGlassModal
        isOpen={showRejectModal}
        title="Reject completion evidence?"
        description="Provide a mandatory reason and remarks for returning the work order to the worker for correction."
        variant="danger"
        onClose={() => setShowRejectModal(false)}
        primaryAction={{
          label: 'Confirm Rejection',
          onClick: handleReject,
          loading: actionLoading,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setShowRejectModal(false),
        }}
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="space-y-1">
            <label className="block text-[10px] text-slate-400 font-bold uppercase">Rejection Reason Code *</label>
            <GlassDropdown
              options={rejectionOptions}
              value={rejectionReason}
              onChange={setRejectionReason}
              variant="rose"
              ariaLabel="Rejection Reason Code"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] text-slate-400 font-bold uppercase">Mandatory Authority Remarks *</label>
            <textarea
              rows={3}
              value={rejectionRemarks}
              onChange={(e) => setRejectionRemarks(e.target.value)}
              placeholder="Explain clearly what corrections or additional repair work the worker must perform..."
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </LiquidGlassModal>
    </div>
  );
};
