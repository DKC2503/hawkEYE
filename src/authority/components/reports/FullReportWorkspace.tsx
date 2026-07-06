import React, { useState, useEffect } from 'react';
import type { AuthorityIssueInspectionItem, MunicipalEmployee, WorkOrder } from '../../types/authority';
import { authService } from '../../../services/authService';
import { NavLink } from 'react-router-dom';
import { normalizeReportStatus } from '../../../utils/statusNormalizer';
import { useAuthorityReports } from '../../context/AuthorityReportsContext';
import { GlassDropdown, type GlassDropdownOption } from '../../../components/ui/GlassDropdown';

const priorityOptions: GlassDropdownOption[] = [
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' },
];

const dismissalOptions: GlassDropdownOption[] = [
  { value: 'Duplicate report', label: 'Duplicate Report' },
  { value: 'Unrelated image', label: 'Unrelated / Irrelevant Photo' },
  { value: 'Issue not visible', label: 'Issue Not Visible or Private Property' },
  { value: 'Spam / Invalid', label: 'Spam or Invalid Submission' },
  { value: 'Outside municipal jurisdiction', label: 'Outside Municipal Jurisdiction' },
];

const reassignmentReasonOptions: GlassDropdownOption[] = [
  { value: 'Worker unavailable', label: 'Worker unavailable' },
  { value: 'Worker absent', label: 'Worker absent' },
  { value: 'Shift conflict', label: 'Shift conflict' },
  { value: 'Wrong department assigned', label: 'Wrong department assigned' },
  { value: 'Higher-priority emergency reassignment', label: 'Higher-priority emergency reassignment' },
  { value: 'Workload balancing', label: 'Workload balancing' },
  { value: 'Worker requested reassignment', label: 'Worker requested reassignment' },
  { value: 'Authority operational decision', label: 'Authority operational decision' },
  { value: 'Other', label: 'Other' },
];

import { API_BASE_URL } from '../../../config/api';

interface FullReportWorkspaceProps {
  report: AuthorityIssueInspectionItem | null;
  onRefresh: () => void;
  allReports?: AuthorityIssueInspectionItem[];
  onDelete?: () => void;
}

export const FullReportWorkspace: React.FC<FullReportWorkspaceProps> = ({ report, onRefresh }) => {
  const { updateReport } = useAuthorityReports();
  const [employees, setEmployees] = useState<MunicipalEmployee[]>([]);
  const [showDismissModal, setShowDismissModal] = useState(false);
  const [dismissReason, setDismissReason] = useState('Duplicate report');
  const [dismissNotes, setDismissNotes] = useState('');
  const [duplicateOfTicketId, setDuplicateOfTicketId] = useState('');
  const [dismissError, setDismissError] = useState<string | null>(null);
  const [dismissSuccessToast, setDismissSuccessToast] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);

  // Work Order Form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignmentDate, setAssignmentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [shiftName, setShiftName] = useState('Morning Shift');
  const [shiftStart, setShiftStart] = useState('08:00 AM');
  const [shiftEnd, setShiftEnd] = useState('04:00 PM');
  const [instructions, setInstructions] = useState('');
  const [workOrderResult, setWorkOrderResult] = useState<WorkOrder | null>(null);
  const [retryingEmail, setRetryingEmail] = useState(false);
  const [workOrderError, setWorkOrderError] = useState<string | null>(null);

  // Reassignment Modal States
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignNewWorkerId, setReassignNewWorkerId] = useState('');
  const [reassignReason, setReassignReason] = useState('Worker unavailable');
  const [reassignRemarks, setReassignRemarks] = useState('');
  const [reassignDate, _setReassignDate] = useState('');
  const [reassignPriority, _setReassignPriority] = useState('HIGH');
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [reassignSuccessToast, setReassignSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/employees?active_only=true`);
        if (res.ok) {
          const data = await res.json();
          const emps: MunicipalEmployee[] = data.employees || [];
          setEmployees(emps);
          if (emps.length > 0) {
            setSelectedEmployeeId(emps[0].employeeId || (emps[0] as any).id);
          }
        }
      } catch {
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    setWorkOrderResult(null);
    setWorkOrderError(null);

    if (!report) return;

    const fetchExistingWorkOrder = async () => {
      try {
        const targetId = report.id || report.ticketId;
        const res = await fetch(`${API_BASE_URL}/api/work-orders/by-report/${targetId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.workOrder) {
            setWorkOrderResult(data.workOrder);
          }
        }
      } catch {
        // Silently ignore if no existing work order
      }
    };

    fetchExistingWorkOrder();
  }, [report?.id, report?.ticketId, report?.status]);

  if (!report) {
    return (
      <div className="h-full auth-glass-surface rounded-2xl border border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-3">
        <svg className="w-12 h-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="text-base font-bold text-slate-200">No Report Selected</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Select a report from the queue on the left to inspect evidence, review neural assessment, accept, or dispatch work orders.
        </p>
      </div>
    );
  }

  const canonicalStatus = normalizeReportStatus(report.status);
  const isSubmitted = canonicalStatus === 'SUBMITTED';
  const isAccepted = canonicalStatus === 'ACCEPTED';
  const isAssigned = canonicalStatus === 'ASSIGNED' || canonicalStatus === 'IN_PROGRESS';
  const isAwaitingVerification = canonicalStatus === 'AWAITING_VERIFICATION';
  const isCompleted = canonicalStatus === 'COMPLETED';
  const isDismissed = canonicalStatus === 'DISMISSED';

  // STEP A: Accept Report
  const handleAcceptReport = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/${report.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authority-Role': 'authority',
        },
      });
      const data = await res.json();
      if (res.ok && data.issue) {
        updateReport(data.issue);
      }
      onRefresh();
    } catch {
      // Error handled safely
    } finally {
      setActionLoading(false);
    }
  };

  // STEP B: Single-Click Reliable Dismissal Handler
  const handleDismissReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;

    setDismissError(null);
    setActionLoading(true);

    try {
      const targetId = report.id || report.ticketId;
      const res = await fetch(`${API_BASE_URL}/api/issues/${targetId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authority-Role': 'authority',
        },
        body: JSON.stringify({
          reason: dismissReason,
          notes: dismissNotes,
          duplicateOfTicketId: dismissReason === 'Duplicate report' ? duplicateOfTicketId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Dismissal failed. Please try again.');
      }

      setShowDismissModal(false);
      setDismissSuccessToast(`Report ${report.ticketId} dismissed successfully.`);
      setTimeout(() => setDismissSuccessToast(null), 4000);
      onRefresh();
    } catch (err: any) {
      setDismissError(err.message || 'Failed to dismiss report. Network or permission error.');
    } finally {
      setActionLoading(false);
    }
  };

  // STEP C: Dispatch Work Order & Trigger Automatic Resend Email
  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || actionLoading) return;

    setActionLoading(true);
    setWorkOrderError(null);

    try {
      // 1. Firebase Auth Token Readiness
      const token = await authService.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Authority-Role': 'authority',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const targetReportId = report.id || report.ticketId;

      // 2. Dispatch Work Order (Idempotent request)
      const res = await fetch(`${API_BASE_URL}/api/work-orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          reportId: targetReportId,
          employeeId: selectedEmployeeId,
          assignmentDate,
          shift: {
            name: shiftName,
            startTime: shiftStart,
            endTime: shiftEnd,
          },
          authorityInstructions: instructions,
          priority,
          idempotencyKey: targetReportId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to dispatch work order.');
      }

      if (data.workOrder) {
        setWorkOrderResult(data.workOrder);
      }
      onRefresh();
    } catch (err: any) {
      setWorkOrderError(err.message || 'Failed to create work order.');
    } finally {
      setActionLoading(false);
    }
  };

  // Retry Assignment Email Endpoint
  const handleRetryEmail = async () => {
    if (!workOrderResult) return;
    setRetryingEmail(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/work-orders/${workOrderResult.workOrderId}/retry-email`, {
        method: 'POST',
        headers: {
          'X-Authority-Role': 'authority',
        },
      });
      const data = await res.json();
      if (res.ok && data.emailNotification) {
        setWorkOrderResult((prev) => prev ? { ...prev, emailNotification: data.emailNotification } : null);
      }
    } catch {
      // Handled safely
    } finally {
      setRetryingEmail(false);
    }
  };

  // Authority Worker Reassignment Handler
  const handleConfirmReassignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workOrderResult || !reassignNewWorkerId || reassignLoading) return;

    if (reassignReason === 'Other' && !reassignRemarks.trim()) {
      setReassignError('Remarks are required when selecting "Other" as reassignment reason.');
      return;
    }

    if (!reassignRemarks.trim()) {
      setReassignError('Reassignment remarks/explanation are mandatory.');
      return;
    }

    setReassignLoading(true);
    setReassignError(null);

    try {
      const token = await authService.getIdToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Authority-Role': 'authority',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/authority/work-orders/${workOrderResult.workOrderId}/reassign`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          newWorkerId: reassignNewWorkerId,
          reasonCode: reassignReason,
          remarks: reassignRemarks,
          assignmentDate: reassignDate || workOrderResult.assignmentDate,
          priority: reassignPriority || workOrderResult.priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to reassign work order.');
      }

      if (data.workOrder) {
        setWorkOrderResult(data.workOrder);
      }
      setShowReassignModal(false);
      setReassignRemarks('');
      setReassignSuccessToast('Worker reassigned successfully. Email sent to new worker.');
      setTimeout(() => setReassignSuccessToast(null), 4000);
      onRefresh();
    } catch (err: any) {
      setReassignError(err.message || 'Failed to reassign work order.');
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <div className="auth-glass-surface rounded-2xl border border-slate-800 p-6 space-y-6 text-slate-100 relative">
      {/* Toast Notification */}
      {dismissSuccessToast && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{dismissSuccessToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">{report.ticketId}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
              isDismissed
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : isAssigned
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : isAccepted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {report.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Submitted: {new Date(report.reporter.submittedAt).toLocaleString()}
          </p>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <>
              <button
                onClick={handleAcceptReport}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Accept Report</span>
              </button>

              <button
                onClick={() => {
                  setDismissError(null);
                  setShowDismissModal(true);
                }}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
              >
                Dismiss Report
              </button>
            </>
          )}

          {isAccepted && (
            <button
              onClick={() => {
                setDismissError(null);
                setShowDismissModal(true);
              }}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
            >
              Dismiss Report
            </button>
          )}

          {isAwaitingVerification && (
            <NavLink
              to={`/authority/verification?workOrderId=${workOrderResult?.workOrderId || ''}`}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 font-mono"
            >
              <span>OPEN COMPLETION REVIEW &rarr;</span>
            </NavLink>
          )}

          {isCompleted && (
            <span className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>VERIFIED & COMPLETED</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid: Image & AI Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evidence Photo */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
            Cloudinary Photo Evidence
          </span>
          {report.imageUrl ? (
            <img
              src={report.imageUrl}
              alt={report.ticketId}
              className="w-full h-56 object-cover rounded-xl border border-slate-800 shadow-lg"
            />
          ) : (
            <div className="w-full h-56 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-500">
              No Image Available
            </div>
          )}
        </div>

        {/* AI Assessment */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
            Neural Vision AI Analysis
          </span>

          <div className="space-y-1.5 text-xs">
            <div><span className="text-slate-400">Detected Category:</span> <strong className="text-slate-200 capitalize">{report.category}</strong></div>
            <div><span className="text-slate-400">Confidence Score:</span> <strong className="text-amber-400 font-mono">{((report.aiAnalysis?.confidence || 0.9) * 100).toFixed(0)}%</strong></div>
            <div><span className="text-slate-400">Assessed Severity:</span> <strong className="text-rose-400 uppercase font-mono">{report.severity}</strong></div>
            <div><span className="text-slate-400">Risk Assessment:</span> <strong className="text-slate-300">{report.aiAnalysis?.visibleRisk || 'Public hazard'}</strong></div>
            <div className="pt-2 border-t border-slate-800 text-slate-300 italic">{report.aiAnalysis?.summary || report.description}</div>
          </div>
        </div>
      </div>

      {/* STEP B: WORK ORDER CREATION / ACTIVE WORK ASSIGNMENT SECTION */}
      {(isAccepted || isAssigned) && (
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{workOrderResult ? 'Active Municipal Work Assignment' : 'Municipal Work Order & Worker Assignment'}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {workOrderResult ? 'Work order dispatched to active municipal employee. Reassignment options available.' : 'Dispatch an active employee and automatically send HTML work order notification email with live map link.'}
              </p>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
              {workOrderResult ? 'Status: In Progress' : 'Step B: Dispatch'}
            </span>
          </div>

          {workOrderError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {workOrderError}
            </div>
          )}

          {workOrderResult ? (
            /* ACTIVE WORK ASSIGNMENT PANEL */
            <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold">
                    ACTIVE WORK ASSIGNMENT
                  </span>
                  {workOrderResult.isReassigned && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-mono font-bold">
                      REASSIGNED WORK ORDER
                    </span>
                  )}
                </div>

                {/* Email Delivery Status Indicator */}
                {(workOrderResult.emailNotification?.status === 'SENT' || (workOrderResult as any).emailDelivery?.status === 'SENT') ? (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Email sent to: {(workOrderResult as any).emailDelivery?.recipientEmail || workOrderResult.employeeEmail}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                      Email Delivery Failed ({(workOrderResult as any).emailDelivery?.error || workOrderResult.emailNotification?.failureReason || 'SMTP pending'})
                    </span>
                    <button
                      type="button"
                      onClick={handleRetryEmail}
                      disabled={retryingEmail}
                      className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-extrabold transition-all"
                    >
                      {retryingEmail ? 'Retrying...' : '[Retry Email]'}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-sans">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Work Order Number</span>
                  <span className="text-amber-400 font-mono font-bold text-sm block">{workOrderResult.workOrderNumber || workOrderResult.workOrderId}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Assigned Worker</span>
                  <span className="text-white font-bold text-xs block">{workOrderResult.employeeName}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Worker ID / Code</span>
                  <span className="text-slate-200 font-mono text-xs block">{workOrderResult.employeeCode || workOrderResult.employeeId}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Worker Official Email</span>
                  <span className="text-slate-200 font-mono text-xs block truncate" title={workOrderResult.employeeEmail}>
                    {workOrderResult.employeeEmail || (workOrderResult as any).emailDelivery?.recipientEmail}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Assignment Date & Priority</span>
                  <span className="text-slate-200 font-mono text-xs block">
                    {workOrderResult.assignmentDate} — <span className="text-amber-400 font-bold uppercase">{workOrderResult.priority}</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Shift & Duty Hours</span>
                  <span className="text-slate-200 font-mono text-xs block">
                    {workOrderResult.shift?.name} ({workOrderResult.shift?.startTime} - {workOrderResult.shift?.endTime})
                  </span>
                </div>
              </div>

              {/* Assignment History Track Record */}
              {workOrderResult.assignmentHistory && workOrderResult.assignmentHistory.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider block">
                    Audit Track Record & Assignment History ({workOrderResult.assignmentHistory.length} Record{workOrderResult.assignmentHistory.length > 1 ? 's' : ''})
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {workOrderResult.assignmentHistory.map((hist: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-400">
                            {hist.assignmentType === 'INITIAL' ? 'Initial Assignment' : 'Reassignment'} &rarr; {hist.workerName}
                          </span>
                          <span className="text-[10px] text-slate-400">{new Date(hist.assignedAt).toLocaleString()}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Worker Email: <span className="text-slate-200">{hist.workerEmail}</span>
                        </div>
                        {hist.reasonCode && (
                          <div className="text-[10px] text-slate-300">
                            Reason: <span className="text-amber-300 font-bold capitalize">{hist.reasonCode.replace(/_/g, ' ')}</span> — Remarks: "{hist.remarks}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reassign Worker Action Button */}
              <div className="flex justify-end pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const activeExcludingCurrent = employees.filter(
                      (e) => (e.employeeId || (e as any).id) !== workOrderResult.employeeId
                    );
                    if (activeExcludingCurrent.length > 0) {
                      setReassignNewWorkerId(activeExcludingCurrent[0].employeeId || (activeExcludingCurrent[0] as any).id);
                    }
                    setShowReassignModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Reassign Worker</span>
                </button>
              </div>
            </div>
          ) : (
            /* INITIAL DISPATCH FORM */
            <form onSubmit={handleCreateWorkOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                    Select Active Employee
                  </label>
                  <GlassDropdown
                    options={
                      employees.length > 0
                        ? employees.map((emp) => ({
                            value: emp.employeeId || (emp as any).id,
                            label: `${emp.fullName || emp.name}`,
                            description: `${emp.department} — ${emp.role || emp.jobRole}`,
                          }))
                        : [{ value: '', label: 'No active employees registered' }]
                    }
                    value={selectedEmployeeId}
                    onChange={setSelectedEmployeeId}
                    variant="amber"
                    ariaLabel="Select Active Employee"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                    Assignment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignmentDate}
                    onChange={(e) => setAssignmentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                    Work Priority
                  </label>
                  <GlassDropdown
                    options={priorityOptions}
                    value={priority}
                    onChange={setPriority}
                    variant="amber"
                    ariaLabel="Work Priority"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    value={shiftName}
                    onChange={(e) => setShiftName(e.target.value)}
                    placeholder="Morning Shift"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                    Shift Start
                  </label>
                  <input
                    type="text"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    placeholder="08:00 AM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                    Shift End
                  </label>
                  <input
                    type="text"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    placeholder="04:00 PM"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Authority Field Instructions & Special Remarks
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Specify machinery required, safety cones, traffic redirection..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading || !selectedEmployeeId}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <span>Dispatching Work Order...</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Confirm Dispatch & Send Email &rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* DISMISS REPORT MODAL */}
      {showDismissModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form onSubmit={handleDismissReport} className="w-full max-w-md auth-glass-elevated rounded-2xl p-6 space-y-4 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Dismiss Report {report.ticketId}</h3>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowDismissModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {dismissError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {dismissError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                Dismissal Reason
              </label>
              <GlassDropdown
                options={dismissalOptions}
                value={dismissReason}
                onChange={setDismissReason}
                variant="rose"
                ariaLabel="Dismissal Reason"
              />
            </div>

            {dismissReason === 'Duplicate report' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Canonical Ticket ID (Original Report)
                </label>
                <input
                  type="text"
                  disabled={actionLoading}
                  value={duplicateOfTicketId}
                  onChange={(e) => setDuplicateOfTicketId(e.target.value)}
                  placeholder="e.g. HE-2026-H7LL3N"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 font-bold uppercase mb-1">
                Official Remarks & Notes
              </label>
              <textarea
                rows={3}
                disabled={actionLoading}
                value={dismissNotes}
                onChange={(e) => setDismissNotes(e.target.value)}
                placeholder="Explain the reason for dismissal for audit log..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setShowDismissModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {actionLoading ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Dismissing Report...</span>
                  </>
                ) : (
                  <span>Confirm Dismissal</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reassign Worker Success Toast Notification */}
      {reassignSuccessToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{reassignSuccessToast}</span>
        </div>
      )}

      {/* REASSIGN WORKER MODAL */}
      {showReassignModal && workOrderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-sans">
          <form onSubmit={handleConfirmReassignment} className="w-full max-w-lg auth-glass-elevated rounded-2xl p-6 space-y-4 border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Reassign Municipal Work Order</span>
              </h3>
              <button
                type="button"
                disabled={reassignLoading}
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            {/* Current Assignment Summary Box */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Current Active Assignment</div>
              <div>Current Worker: <strong className="text-white">{workOrderResult.employeeName}</strong></div>
              <div>Worker ID: <span className="text-slate-400">{workOrderResult.employeeCode || workOrderResult.employeeId}</span></div>
              <div>Work Order ID: <span className="text-slate-400">{workOrderResult.workOrderNumber || workOrderResult.workOrderId}</span></div>
            </div>

            {reassignError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {reassignError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                  New Worker *
                </label>
                <GlassDropdown
                  options={employees
                    .filter((emp) => (emp.employeeId || (emp as any).id) !== workOrderResult.employeeId)
                    .map((emp) => ({
                      value: emp.employeeId || (emp as any).id,
                      label: `${emp.fullName || emp.name}`,
                      description: `${emp.department} — ${emp.officialEmail || emp.email}`,
                    }))}
                  value={reassignNewWorkerId}
                  onChange={setReassignNewWorkerId}
                  variant="amber"
                  ariaLabel="Select New Worker"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Reassignment Reason *
                </label>
                <GlassDropdown
                  options={reassignmentReasonOptions}
                  value={reassignReason}
                  onChange={setReassignReason}
                  variant="amber"
                  ariaLabel="Reassignment Reason"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase mb-1">
                  Remarks / Operational Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassignRemarks}
                  onChange={(e) => setReassignRemarks(e.target.value)}
                  placeholder="Mandatory explanation detailing operational cause for worker reassignment..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                disabled={reassignLoading}
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reassignLoading || !reassignNewWorkerId}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {reassignLoading ? (
                  <span>Reassigning Worker...</span>
                ) : (
                  <span>Confirm Reassignment & Notify Worker &rarr;</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
