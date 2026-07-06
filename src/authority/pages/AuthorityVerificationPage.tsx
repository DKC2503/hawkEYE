import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { artisanApiClient, type ArtisanWorkOrder } from '../../services/artisanApiClient';
import { useAuthorityReports } from '../context/AuthorityReportsContext';
import { LiquidGlassModal } from '../../components/ui/LiquidGlassModal';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { GlassDropdown, type GlassDropdownOption } from '../../components/ui/GlassDropdown';

const rejectionOptions: GlassDropdownOption[] = [
  { value: 'Work incomplete', label: 'Work incomplete' },
  { value: 'Evidence unclear', label: 'Evidence unclear' },
  { value: 'Wrong location', label: 'Wrong location' },
  { value: 'Additional repair required', label: 'Additional repair required' },
  { value: 'Safety issue remains', label: 'Safety issue remains' },
  { value: 'Other', label: 'Other' },
];

export const AuthorityVerificationPage: React.FC = () => {
  const { fetchReports } = useAuthorityReports();
  const [searchParams] = useSearchParams();
  const [queue, setQueue] = useState<ArtisanWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Evidence unclear');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  const loadVerificationQueue = async () => {
    setLoading(true);
    try {
      const data = await artisanApiClient.getVerificationQueue();
      setQueue(data);
    } catch {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationQueue();
  }, []);

  // Handle URL pre-selection if passed via query param ?workOrderId=...
  useEffect(() => {
    const paramWO = searchParams.get('workOrderId');
    if (paramWO && queue.length > 0) {
      const match = queue.find((w) => w.workOrderId === paramWO || w.workOrderNumber === paramWO);
      if (match) setSelectedWorkOrderId(match.workOrderId);
    }
  }, [searchParams, queue]);

  // Keep selection valid when queue updates
  useEffect(() => {
    if (loading) return;
    if (selectedWorkOrderId) {
      const exists = queue.some((wo) => wo.workOrderId === selectedWorkOrderId);
      if (!exists) {
        setSelectedWorkOrderId(queue.length > 0 ? queue[0].workOrderId : null);
      }
    } else if (queue.length > 0) {
      setSelectedWorkOrderId(queue[0].workOrderId);
    }
  }, [queue, selectedWorkOrderId, loading]);

  const filteredQueue = useMemo(() => {
    return queue.filter((wo) => {
      const matchesPriority =
        priorityFilter === 'all' || (wo.priority || '').toUpperCase() === priorityFilter.toUpperCase();
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        wo.ticketId.toLowerCase().includes(term) ||
        wo.workOrderNumber.toLowerCase().includes(term) ||
        wo.issueCategory.toLowerCase().includes(term) ||
        (wo.location?.area || '').toLowerCase().includes(term) ||
        (wo.employeeName || '').toLowerCase().includes(term);

      return matchesPriority && matchesSearch;
    });
  }, [queue, priorityFilter, searchTerm]);

  const selectedWorkOrder = useMemo(() => {
    return queue.find((wo) => wo.workOrderId === selectedWorkOrderId) || null;
  }, [queue, selectedWorkOrderId]);

  // Confirm Approval Action
  const handleConfirmApproval = async () => {
    if (!selectedWorkOrder) return;
    setActionLoading(true);
    try {
      await artisanApiClient.approveVerification(selectedWorkOrder.workOrderId);
      setShowApproveModal(false);
      setToastMessage({
        title: 'Work Verified & Completed',
        message: `Work Order '${selectedWorkOrder.workOrderNumber}' for Ticket ${selectedWorkOrder.ticketId} marked COMPLETED.`,
        type: 'success',
      });

      // Refresh both verification queue and shared reports context
      await Promise.all([loadVerificationQueue(), fetchReports()]);
    } catch (err: any) {
      setToastMessage({
        title: 'Approval Failed',
        message: err.message || 'Could not verify work order.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Rejection Action
  const handleConfirmRejection = async () => {
    if (!selectedWorkOrder || !rejectionRemarks.trim()) return;
    setActionLoading(true);
    try {
      await artisanApiClient.rejectVerification(selectedWorkOrder.workOrderId, rejectionReason, rejectionRemarks.trim());
      setShowRejectModal(false);
      setToastMessage({
        title: 'Evidence Returned to Worker',
        message: `Work Order '${selectedWorkOrder.workOrderNumber}' returned to worker for correction.`,
        type: 'success',
      });
      setRejectionRemarks('');

      // Refresh both verification queue and shared reports context
      await Promise.all([loadVerificationQueue(), fetchReports()]);
    } catch (err: any) {
      setToastMessage({
        title: 'Rejection Failed',
        message: err.message || 'Could not return work order.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthorityShell>
      <div className="space-y-6 font-sans">
        {/* Toast Notification */}
        {toastMessage && (
          <ToastNotification
            title={toastMessage.title}
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <span>Completion Approvals & Evidence Verification</span>
            </h1>
            <p className="text-xs text-slate-400">
              Inspect Artisan field completion evidence, perform side-by-side Before vs After audits, and approve tasks or request repair corrections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold">
              {queue.length} Tasks Awaiting Verification
            </span>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div className="auth-glass-surface p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto font-mono text-xs">
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                priorityFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Priorities ({queue.length})
            </button>
            <button
              onClick={() => setPriorityFilter('HIGH')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                priorityFilter === 'HIGH'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              High / Critical
            </button>
            <button
              onClick={() => setPriorityFilter('MEDIUM')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                priorityFilter === 'MEDIUM'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Medium
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticket, worker, category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Main Workspace Layout */}
        {loading ? (
          <div className="p-12 text-center auth-glass-surface rounded-3xl border border-slate-800 text-xs font-mono text-slate-400">
            Loading verification queue from Cloud Firestore...
          </div>
        ) : filteredQueue.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Queue Cards */}
            <div className="lg:col-span-4 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 font-mono text-xs">
              {filteredQueue.map((wo) => {
                const isSelected = selectedWorkOrderId === wo.workOrderId;
                return (
                  <div
                    key={wo.workOrderId}
                    onClick={() => setSelectedWorkOrderId(wo.workOrderId)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/60 shadow-lg shadow-purple-500/10 text-white'
                        : 'auth-glass-surface border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400">{wo.ticketId}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold uppercase">
                        AWAITING
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white font-sans text-xs line-clamp-1">{wo.issueCategory}</h4>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-1">{wo.issueSummary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <div>Worker: <strong className="text-amber-400 block">{wo.employeeName || 'Artisan Worker'}</strong></div>
                      <div>Area: <strong className="text-slate-200 block truncate">{wo.location?.area || 'Visakhapatnam'}</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Detailed Verification Workspace */}
            {selectedWorkOrder && (
              <div className="lg:col-span-8 auth-glass-surface rounded-3xl border border-slate-800 p-6 space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                        {selectedWorkOrder.ticketId}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Work Order: <strong className="text-white">{selectedWorkOrder.workOrderNumber}</strong>
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedWorkOrder.issueCategory}</h2>
                  </div>

                  <span className="px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold uppercase self-start sm:self-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span>AWAITING AUTHORITY VERIFICATION</span>
                  </span>
                </div>

                {/* Worker & Task Meta Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Artisan</span>
                    <span className="text-amber-400 font-bold block">{selectedWorkOrder.employeeName || 'Vignesh'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Priority</span>
                    <span className="text-rose-400 font-bold block uppercase">{selectedWorkOrder.priority}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Work Started</span>
                    <span className="text-slate-200 block">{selectedWorkOrder.workStartedAt ? new Date(selectedWorkOrder.workStartedAt).toLocaleTimeString() : 'Recorded'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Submitted At</span>
                    <span className="text-slate-200 block">{selectedWorkOrder.completedByWorkerAt ? new Date(selectedWorkOrder.completedByWorkerAt).toLocaleTimeString() : 'Recently'}</span>
                  </div>
                </div>

                {/* BEFORE VS AFTER EVIDENCE COMPARISON */}
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>BEFORE VS AFTER PHOTOGRAPHIC EVIDENCE AUDIT</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase text-slate-400">BEFORE (Citizen Report Photo)</span>
                      </div>
                      {selectedWorkOrder.imageUrl ? (
                        <img
                          src={selectedWorkOrder.imageUrl}
                          alt="Before Work"
                          className="w-full h-56 object-cover rounded-2xl border border-slate-800 shadow-md"
                        />
                      ) : (
                        <div className="w-full h-56 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-500">
                          No Original Image
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold uppercase text-amber-400">AFTER (Artisan Completion Evidence)</span>
                      </div>
                      {selectedWorkOrder.completionEvidence?.afterImages?.[0]?.secureUrl ? (
                        <img
                          src={selectedWorkOrder.completionEvidence.afterImages[0].secureUrl}
                          alt="After Work Evidence"
                          className="w-full h-56 object-cover rounded-2xl border-2 border-amber-500/50 shadow-md shadow-amber-500/10"
                        />
                      ) : (
                        <div className="w-full h-56 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono text-slate-500">
                          Evidence Uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* WORKER COMPLETION REMARKS & FIELD NOTES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Artisan Completion Remarks *</span>
                    <p className="text-slate-100 font-sans leading-relaxed">
                      {selectedWorkOrder.completionEvidence?.completionRemarks || 'Physical repair work completed per municipal specifications.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Field Notes & Observations</span>
                    <p className="text-slate-300 font-sans leading-relaxed">
                      {selectedWorkOrder.completionEvidence?.fieldNotes || 'No additional notes provided.'}
                    </p>
                  </div>
                </div>

                {/* DECISION ACTION BUTTONS */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowRejectModal(true)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono text-xs font-bold border border-rose-500/40 transition-all flex items-center justify-center gap-2"
                  >
                    <span>REJECT & RETURN TO ARTISAN</span>
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowApproveModal(true)}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-extrabold shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>✔ VERIFY WORK & MARK COMPLETED</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center auth-glass-surface rounded-3xl border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center mx-auto font-mono text-lg font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-white">No Tasks Currently Awaiting Verification</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              When artisans complete physical repair tasks and submit photo evidence, work orders will automatically enter this queue for final authority inspection.
            </p>
          </div>
        )}

        {/* APPROVAL CONFIRMATION MODAL */}
        <LiquidGlassModal
          isOpen={showApproveModal}
          title="Verify completed work?"
          description="Approving this evidence confirms that the municipal work has been completed satisfactorily and will close the work order."
          variant="success"
          onClose={() => setShowApproveModal(false)}
          primaryAction={{
            label: actionLoading ? 'Verifying...' : 'Verify & Complete Work Order',
            onClick: handleConfirmApproval,
            loading: actionLoading,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => setShowApproveModal(false),
          }}
        >
          <div className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block font-bold">BEFORE</span>
                <img src={selectedWorkOrder?.imageUrl} alt="Before" className="w-full h-28 object-cover rounded-xl border border-slate-800" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 block font-bold">AFTER</span>
                <img src={selectedWorkOrder?.completionEvidence?.afterImages?.[0]?.secureUrl} alt="After" className="w-full h-28 object-cover rounded-xl border border-amber-500/40" />
              </div>
            </div>

            <div className="space-y-1.5 font-mono">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">Optional Verification Remarks</label>
              <input
                type="text"
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="Satisfactory repair verified by municipal inspector..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </LiquidGlassModal>

        {/* REJECTION REASON MODAL */}
        <LiquidGlassModal
          isOpen={showRejectModal}
          title="Reject completion evidence?"
          description="Provide a mandatory reason code and remarks for returning the work order to the worker for correction."
          variant="danger"
          onClose={() => setShowRejectModal(false)}
          primaryAction={{
            label: actionLoading ? 'Rejecting...' : 'Confirm Rejection & Return Task',
            onClick: handleConfirmRejection,
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
    </AuthorityShell>
  );
};
