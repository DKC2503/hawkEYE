import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { FullReportWorkspace } from '../components/reports/FullReportWorkspace';
import { useAuthorityReports } from '../context/AuthorityReportsContext';
import { issueApiService } from '../../services/issueApiService';
import { Toast } from '../../components/ui/Toast';

// Authority Verification Queue Modal
import { AuthorityVerificationQueueModal } from '../components/reports/AuthorityVerificationQueueModal';
import { normalizeReportStatus } from '../../utils/statusNormalizer';
import { GlassDropdown, type GlassDropdownOption } from '../../components/ui/GlassDropdown';

const deleteReasonOptions: GlassDropdownOption[] = [
  { value: 'test_report', label: 'Test report' },
  { value: 'accidental_submission', label: 'Accidental submission' },
  { value: 'confirmed_duplicate_cleanup', label: 'Confirmed duplicate cleanup' },
  { value: 'invalid_spam_record', label: 'Invalid/spam record' },
  { value: 'other', label: 'Other' },
];

type ReportTabFilter = 'all' | 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'awaiting_verification' | 'completed' | 'dismissed';

const matchesTabFilter = (reportStatus: string, tab: ReportTabFilter) => {
  const norm = normalizeReportStatus(reportStatus);
  if (tab === 'all') return true;
  if (tab === 'submitted') return norm === 'SUBMITTED';
  if (tab === 'accepted') return norm === 'ACCEPTED';
  if (tab === 'assigned') return norm === 'ASSIGNED';
  if (tab === 'in_progress') return norm === 'IN_PROGRESS';
  if (tab === 'awaiting_verification') return norm === 'AWAITING_VERIFICATION';
  if (tab === 'completed') return norm === 'COMPLETED';
  if (tab === 'dismissed') return norm === 'DISMISSED';
  return false;
};

export const ReportsPage: React.FC = () => {
  const { reports, loading, refreshSingleReport, fetchReports, updateReport } = useAuthorityReports();
  const [activeTab, setActiveTab] = useState<ReportTabFilter>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const [showVerificationQueueModal, setShowVerificationQueueModal] = useState(false);

  // Delete report states
  const [reportToDeleteId, setReportToDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('test_report');
  const [deleteRemarks, setDeleteRemarks] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Reset delete states when selected target changes
  useEffect(() => {
    setDeleteReason('test_report');
    setDeleteRemarks('');
    setDeleteErrorMessage(null);
  }, [reportToDeleteId]);

  // Derive target report to delete
  const reportToDelete = useMemo(() => {
    return reports.find(r => r.id === reportToDeleteId) || null;
  }, [reports, reportToDeleteId]);

  // Derive selectedReport object from the latest authoritative reports array
  const selectedReport = useMemo(() => {
    return reports.find(r => r.id === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Handle URL-based report selection (e.g., from map view redirect)
  useEffect(() => {
    const queryTicketId = searchParams.get('ticketId');
    if (queryTicketId && reports.length > 0) {
      const match = reports.find(r => r.ticketId === queryTicketId);
      if (match) {
        setSelectedReportId(match.id);
        setActiveTab('all');
      }
    }
  }, [searchParams, reports]);

  // Derive filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesTab = matchesTabFilter(r.status, activeTab);
      const matchesSearch =
        r.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.location.displayName || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [reports, activeTab, searchTerm]);

  // Auto-selection: Keep selection valid when filters change or status is mutated
  useEffect(() => {
    if (loading) return;

    if (selectedReportId) {
      const isStillVisible = filteredReports.some((r) => r.id === selectedReportId);
      if (!isStillVisible) {
        if (filteredReports.length > 0) {
          setSelectedReportId(filteredReports[0].id);
        } else {
          setSelectedReportId(null);
        }
      }
    } else if (filteredReports.length > 0) {
      setSelectedReportId(filteredReports[0].id);
    }
  }, [filteredReports, selectedReportId, loading]);

  // Derive counts directly from authoritative reports list
  const getTabCount = (tab: ReportTabFilter) => {
    return reports.filter((r) => matchesTabFilter(r.status, tab)).length;
  };

  // Perform soft delete
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportToDeleteId || !reportToDelete) return;
    if (deleteLoading) return;

    if (deleteReason === 'other' && !deleteRemarks.trim()) {
      setDeleteErrorMessage('Remarks are required when selecting "Other" as deletion reason.');
      return;
    }

    setDeleteErrorMessage(null);
    setDeleteLoading(true);

    try {
      const res = await issueApiService.deleteIssue(
        reportToDeleteId,
        deleteReason,
        deleteReason === 'other' ? deleteRemarks : undefined
      );

      if (res.success) {
        setToastType('success');
        setToastMessage(`Ticket ${reportToDelete.ticketId} deleted successfully.`);
        setReportToDeleteId(null);
        setDeleteRemarks('');

        // Centralized state update: context will filter out the soft-deleted report
        updateReport(res.issue);
      } else {
        setDeleteErrorMessage('Deletion failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[DELETION ERROR]', err);
      setDeleteErrorMessage(err.message || 'An unexpected error occurred during deletion.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs: { id: ReportTabFilter; label: string }[] = [
    { id: 'all', label: 'All Reports' },
    { id: 'submitted', label: 'New' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'awaiting_verification', label: 'Awaiting Verification' },
    { id: 'completed', label: 'Completed' },
    { id: 'dismissed', label: 'Dismissed' },
  ];

  return (
    <AuthorityShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Report Management Module
            </h1>
            <p className="text-xs text-slate-400">
              Inspect citizen reports, accept/dismiss submissions, and dispatch field work orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/authority/verification"
              className="px-3.5 py-1.5 text-xs bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-colors font-mono font-bold flex items-center gap-1.5 shadow-sm"
            >
              <span>👁 Completion Approvals Queue &rarr;</span>
            </NavLink>
            <button
              onClick={() => fetchReports()}
              className="px-3 py-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 transition-colors font-mono"
            >
              Sync Database
            </button>
            <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
              {reports.length} Total Reports Recorded
            </span>
          </div>
        </div>

        {/* Status Filter Tabs Bar */}
        <div className="auth-glass-surface p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const count = getTabCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl shrink-0 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Split Layout: Left Queue & Right Full Workspace */}
        {loading ? (
          <div className="p-12 text-center auth-glass-surface rounded-2xl border border-slate-800 text-xs font-mono text-slate-400">
            Loading real reports from Cloud Firestore...
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Queue List (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter ticket ID, area, or hazard..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 font-sans">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-4 rounded-xl auth-glass-surface border transition-all cursor-pointer space-y-2 ${
                      selectedReportId === report.id
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {report.ticketId}
                      </span>
                      <div className="flex items-center gap-2">
                        {report.status.toLowerCase() === 'dismissed' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportToDeleteId(report.id);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500 text-rose-400 hover:text-white text-[9px] font-mono font-bold transition-all flex items-center gap-1"
                          >
                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        )}
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {report.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-100 line-clamp-1">{report.description}</p>
                    <div className="text-[10px] font-mono text-slate-400">
                      {report.location.displayName || report.location.area || 'Location details'}
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="p-6 text-center auth-glass-surface rounded-xl border border-slate-800 text-xs text-slate-400">
                    No reports match the current filters.
                  </div>
                )}
              </div>
            </div>

            {/* Right Workspace (8 cols on lg) */}
            <div className="lg:col-span-8">
              <FullReportWorkspace
                report={selectedReport}
                onRefresh={selectedReport ? () => refreshSingleReport(selectedReport.id) : fetchReports}
                allReports={reports}
                onDelete={selectedReport && selectedReport.status.toLowerCase() === 'dismissed' ? () => setReportToDeleteId(selectedReport.id) : undefined}
              />
            </div>
          </div>
        ) : (
          <div className="p-12 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-3">
            <svg className="w-12 h-12 text-slate-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-bold text-slate-200">No Reports Have Been Submitted Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Citizen civic issue reports submitted through the portal will appear here automatically for review, acceptance, and work order dispatch.
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm font-sans">
          <form onSubmit={handleConfirmDelete} className="w-full max-w-md auth-glass-elevated rounded-2xl p-6 space-y-4 border border-slate-800 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Delete Dismissed Report?</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
              Ticket <strong className="font-mono text-rose-400">{reportToDelete.ticketId}</strong> will be removed from normal dashboard views. This action should only be used for reports that no longer need to remain in the active authority workspace.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-400">
              <div>Ticket ID: <span className="text-slate-200">{reportToDelete.ticketId}</span></div>
              <div>Dismissal Reason: <span className="text-slate-200 capitalize">{(reportToDelete.dismissal?.reasonCode || 'other').replace(/_/g, ' ')}</span></div>
              {reportToDelete.dismissal?.dismissedAt && (
                <div>Dismissed Date: <span className="text-slate-200">{new Date(reportToDelete.dismissal.dismissedAt).toLocaleString()}</span></div>
              )}
            </div>

            {deleteErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {deleteErrorMessage}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase">
                Reason for deletion *
              </label>
              <GlassDropdown
                options={deleteReasonOptions}
                value={deleteReason}
                onChange={setDeleteReason}
                variant="rose"
                ariaLabel="Reason for deletion"
              />
            </div>

            {deleteReason === 'other' && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase">
                  Specify Deletion Remarks *
                </label>
                <textarea
                  value={deleteRemarks}
                  onChange={(e) => setDeleteRemarks(e.target.value)}
                  disabled={deleteLoading}
                  placeholder="Deletion remarks are required when choosing Other..."
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none disabled:opacity-50"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReportToDeleteId(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 min-w-[120px] disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Report</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast notifications */}
      <Toast
        message={toastMessage}
        type={toastType}
        onClose={() => setToastMessage(null)}
      />

      {/* Authority Verification Queue Modal */}
      <AuthorityVerificationQueueModal
        isOpen={showVerificationQueueModal}
        onClose={() => setShowVerificationQueueModal(false)}
        onSuccess={() => fetchReports()}
      />
    </AuthorityShell>
  );
};
