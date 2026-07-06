import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ArtisanShell } from '../components/layout/ArtisanShell';
import { artisanApiClient, type ArtisanWorkOrder, type ArtisanProfile } from '../../services/artisanApiClient';
import { LiquidGlassModal } from '../../components/ui/LiquidGlassModal';
import { ToastNotification } from '../../components/ui/ToastNotification';

export const ArtisanAssignmentDetailPage: React.FC = () => {
  const { workOrderId } = useParams<{ workOrderId: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workOrder, setWorkOrder] = useState<ArtisanWorkOrder | null>(null);
  const [profile, setProfile] = useState<ArtisanProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalCoords, setShowTechnicalCoords] = useState(false);

  // Modal & Toast States
  const [showStartModal, setShowStartModal] = useState(false);
  const [startLoading, setStartLoading] = useState(false);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  // Evidence Form States
  const MIN_COMPLETION_REMARKS_LENGTH = 10;
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  const [remarksTouched, setRemarksTouched] = useState(false);

  // Status Normalization & Derived Submission Validation
  const normalizedStatus = String(workOrder?.status || '').trim().toUpperCase();
  const isRemarksValid = completionRemarks.trim().length >= MIN_COMPLETION_REMARKS_LENGTH;

  const canSubmitCompletion =
    normalizedStatus === 'IN_PROGRESS' &&
    afterPhotoFile !== null &&
    isRemarksValid &&
    !submitLoading;

  useEffect(() => {
    if (import.meta.env.DEV && normalizedStatus === 'IN_PROGRESS') {
      console.debug('[COMPLETION SUBMIT STATE]', {
        rawStatus: workOrder?.status,
        normalizedStatus,
        hasPhoto: !!afterPhotoFile,
        remarksLength: completionRemarks.trim().length,
        isUploading: false,
        isSubmitting: submitLoading,
        canSubmitCompletion,
      });
    }
  }, [workOrder?.status, normalizedStatus, afterPhotoFile, completionRemarks, submitLoading, canSubmitCompletion]);

  // Elapsed Time Counter for IN_PROGRESS status
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!workOrderId) return;
      setLoading(true);
      setError(null);

      try {
        const [woData, profData] = await Promise.all([
          artisanApiClient.getWorkOrderDetail(workOrderId),
          artisanApiClient.getProfile().catch(() => null),
        ]);

        setWorkOrder(woData);
        setProfile(profData);
      } catch (err: any) {
        if (err.message?.includes('403')) {
          setError('[ACCESS_DENIED] You do not have permission to view this work order as it is assigned to another worker.');
        } else if (err.message?.includes('404')) {
          setError(`[NOT_FOUND] Work Order '${workOrderId}' was not found.`);
        } else {
          setError(err.message || 'Failed to load assignment details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [workOrderId]);

  // Elapsed time timer for IN_PROGRESS state
  useEffect(() => {
    let interval: any;
    if (workOrder?.status === 'IN_PROGRESS' && workOrder.workStartedAt) {
      const startTime = new Date(workOrder.workStartedAt).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime();
        const diffSecs = Math.max(0, Math.floor((now - startTime) / 1000));
        setElapsedSeconds(diffSecs);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workOrder?.status, workOrder?.workStartedAt]);

  const formatElapsedTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const hasValidCoords =
    workOrder?.location?.latitude !== undefined &&
    workOrder?.location?.longitude !== undefined &&
    workOrder.location.latitude !== 0 &&
    workOrder.location.longitude !== 0;

  const openGoogleMaps = () => {
    if (hasValidCoords && workOrder?.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${workOrder.location.latitude},${workOrder.location.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Image Selection Handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterPhotoFile(file);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setAfterPhotoFile(null);
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerPhotoSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // START WORK ACTION
  const handleConfirmStartWork = async () => {
    if (!workOrder) return;
    setStartLoading(true);
    try {
      const updatedWO = await artisanApiClient.startWorkOrder(workOrder.workOrderId);
      setWorkOrder(updatedWO);
      setShowStartModal(false);
      setToastMessage({
        title: 'Work Started',
        message: 'Work status updated to IN PROGRESS. Official start time recorded.',
        type: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        title: 'Start Work Failed',
        message: err.message || 'Could not start work order.',
        type: 'error',
      });
    } finally {
      setStartLoading(false);
    }
  };

  // SUBMIT EVIDENCE ACTION
  const handleConfirmSubmitEvidence = async () => {
    if (!workOrder || !afterPhotoFile || !isRemarksValid) return;
    setSubmitLoading(true);
    try {
      const updatedWO = await artisanApiClient.submitWorkOrderEvidence(
        workOrder.workOrderId,
        afterPhotoFile,
        completionRemarks.trim(),
        fieldNotes.trim()
      );
      setWorkOrder(updatedWO);
      setShowSubmitModal(false);
      setToastMessage({
        title: 'Evidence Submitted',
        message: 'Completion evidence submitted successfully for authority verification.',
        type: 'success',
      });
    } catch (err: any) {
      // Keep selected image, typed remarks, and field notes intact!
      setToastMessage({
        title: 'Submission Failed',
        message: err.message || 'Failed to submit evidence.',
        type: 'error',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Check latest authority rejection record if exists
  const lastRejection = workOrder?.verificationHistory?.slice().reverse().find((h) => h.decision === 'REJECTED');

  return (
    <ArtisanShell>
      <div className="space-y-6 max-w-4xl mx-auto font-sans">
        {/* Top Navigation & Back Link */}
        <div className="flex items-center justify-between border-b border-[rgba(23,26,31,0.08)] pb-4">
          <button
            type="button"
            onClick={() => navigate('/artisan/assignments')}
            className="px-3.5 py-2 rounded-xl bg-[#ECE6DA] hover:bg-[#E2DBCC] text-[#66645F] hover:text-[#171A1F] text-xs font-mono font-bold border border-[rgba(23,26,31,0.08)] transition-all flex items-center gap-2"
          >
            <span>&larr; Back to My Assignments</span>
          </button>

          <span className="text-xs font-mono font-bold text-[#9C4F08] bg-[#E8890C]/10 px-3 py-1 rounded-full border border-[#E8890C]/30">
            {workOrder?.workOrderNumber || workOrderId}
          </span>
        </div>

        {error ? (
          <div className="p-6 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 space-y-3">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Unable to Open Work Order</span>
            </h3>
            <p className="text-xs font-mono">{error}</p>
            <div className="pt-2">
              <NavLink
                to="/artisan/assignments"
                className="px-4 py-2 bg-[#ECE6DA] text-[#171A1F] font-mono text-xs font-bold rounded-xl border border-[rgba(23,26,31,0.08)] hover:bg-[#E2DBCC] inline-block"
              >
                Return to Assignments Queue
              </NavLink>
            </div>
          </div>
        ) : loading ? (
          <div className="p-12 text-center bg-[#FFFDF8] shadow-sm rounded-3xl border border-[rgba(23,26,31,0.08)] text-xs font-mono text-[#66645F]">
            Loading real assignment workspace details...
          </div>
        ) : workOrder ? (
          <div className="space-y-6">
            {/* AUTHORITY CORRECTION REQUIRED ALERT BANNER */}
            {lastRejection && workOrder.status === 'IN_PROGRESS' && (
              <div className="p-5 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/40 uppercase">
                    CORRECTION REQUIRED BY AUTHORITY
                  </span>
                  <span className="text-[10px] font-mono text-rose-300/80">
                    {lastRejection.reviewedAt ? new Date(lastRejection.reviewedAt).toLocaleString() : ''}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-rose-200">Rejection Reason: <span className="font-mono text-rose-300">{lastRejection.reasonCode}</span></p>
                  <p className="text-[#171A1F] bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 font-mono">{lastRejection.remarks}</p>
                </div>
                <p className="text-[11px] text-rose-300/90 font-medium pt-1">
                  Please perform the required repair corrections, capture a new AFTER photo, and resubmit evidence.
                </p>
              </div>
            )}

            {/* SECTION A — REPORT HEADER */}
            <div className="bg-[#FFFDF8] shadow-sm p-5 sm:p-6 rounded-3xl border border-[rgba(23,26,31,0.08)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(23,26,31,0.08)] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#9C4F08] bg-[#E8890C]/10 px-3 py-1 rounded-lg border border-[#E8890C]/30">
                      Ticket ID: {workOrder.ticketId}
                    </span>
                    <span className="text-xs font-mono text-[#66645F]">
                      Work Order: <strong className="text-[#171A1F]">{workOrder.workOrderNumber}</strong>
                    </span>
                  </div>
                  <h1 className="text-xl font-extrabold text-[#171A1F] tracking-tight">{workOrder.issueCategory}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                    Priority: {workOrder.priority}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-xl border ${
                      workOrder.status === 'ASSIGNED'
                        ? 'bg-[#E8890C]/20 text-[#9C4F08] border-[#E8890C]/40'
                        : workOrder.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : workOrder.status === 'AWAITING_VERIFICATION'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {workOrder.status === 'ASSIGNED' ? 'READY TO START' : workOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-0.5">
                  <span className="text-[10px] text-[#66645F] uppercase font-bold block">Assigned Date</span>
                  <span className="text-[#171A1F] font-bold block">{workOrder.assignmentDate || '2026-07-05'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-0.5">
                  <span className="text-[10px] text-[#66645F] uppercase font-bold block">Assigned Shift</span>
                  <span className="text-[#9C4F08] font-bold block">{workOrder.shift?.name || 'Morning Shift'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-0.5">
                  <span className="text-[10px] text-[#66645F] uppercase font-bold block">Shift Hours</span>
                  <span className="text-[#171A1F] block">{workOrder.shift?.startTime || '08:00 AM'} - {workOrder.shift?.endTime || '04:00 PM'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-0.5">
                  <span className="text-[10px] text-[#66645F] uppercase font-bold block">Work Status</span>
                  <span className="text-emerald-400 font-bold block uppercase">{workOrder.status}</span>
                </div>
              </div>
            </div>

            {/* SECTION B — REPORTED ISSUE */}
            <div className="bg-[#FFFDF8] shadow-sm p-5 sm:p-6 rounded-3xl border border-[rgba(23,26,31,0.08)] space-y-4">
              <h2 className="text-base font-extrabold text-[#171A1F] tracking-tight flex items-center gap-2 border-b border-[rgba(23,26,31,0.08)] pb-3">
                <svg className="w-5 h-5 text-[#9C4F08]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Reported Civic Issue & Evidence (BEFORE)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                <div>
                  {workOrder.imageUrl ? (
                    <img
                      src={workOrder.imageUrl}
                      alt="Original Citizen Report Photo"
                      className="w-full h-64 object-cover rounded-2xl border border-[rgba(23,26,31,0.08)] shadow-lg"
                    />
                  ) : (
                    <div className="w-full h-64 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] flex items-center justify-center text-xs font-mono text-[#66645F]">
                      No Original Image Available
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#9C4F08] block tracking-wider">
                      AI / Neural Summary
                    </span>
                    <p className="text-sm font-bold text-[#171A1F] leading-relaxed">{workOrder.issueSummary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                      <span className="text-[10px] text-[#66645F] uppercase font-bold block">Safety Risk Level</span>
                      <span className="text-rose-400 font-bold block">HIGH RISK</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
                      <span className="text-[10px] text-[#66645F] uppercase font-bold block">Issue Severity</span>
                      <span className="text-[#9C4F08] font-bold block">CRITICAL</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION C — LOCATION */}
            <div className="bg-[#FFFDF8] shadow-sm p-5 sm:p-6 rounded-3xl border border-[rgba(23,26,31,0.08)] space-y-4">
              <div className="flex items-center justify-between border-b border-[rgba(23,26,31,0.08)] pb-3">
                <h2 className="text-base font-extrabold text-[#171A1F] tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#9C4F08]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Real Location & Navigation</span>
                </h2>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#9C4F08]">Area / Locality</span>
                    <span className="text-[10px] font-mono text-[#66645F]">GVMC Zone Jurisdiction</span>
                  </div>
                  <p className="text-sm font-bold text-[#171A1F]">{workOrder.location.area || 'Visakhapatnam Municipal Corporation'}</p>
                  <p className="text-xs text-[#66645F] font-mono">{workOrder.location.formattedAddress || 'Visakhapatnam, Andhra Pradesh'}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={openGoogleMaps}
                    disabled={!hasValidCoords}
                    className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-mono text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                      hasValidCoords
                        ? 'bg-[#E8890C] hover:bg-[#9C4F08] text-white shadow-amber-500/20 cursor-pointer'
                        : 'bg-[#ECE6DA] text-[#66645F] border border-[rgba(23,26,31,0.08)] cursor-not-allowed'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>{hasValidCoords ? 'Open in Google Maps / Navigate →' : 'Navigation unavailable — location coordinates missing'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTechnicalCoords(!showTechnicalCoords)}
                    className="text-xs font-mono text-[#66645F] hover:text-[#171A1F] underline py-1"
                  >
                    {showTechnicalCoords ? 'Hide Technical Coordinates' : 'Show Technical Coordinates'}
                  </button>
                </div>

                {showTechnicalCoords && (
                  <div className="p-3.5 rounded-xl bg-[#FFFDF8] border border-[rgba(23,26,31,0.08)] font-mono text-xs space-y-1 text-[#66645F]">
                    <div>Latitude: <span className="text-[#9C4F08]">{workOrder.location.latitude ?? 'N/A'}</span></div>
                    <div>Longitude: <span className="text-[#9C4F08]">{workOrder.location.longitude ?? 'N/A'}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE WORKFLOW OPERATIONAL ACTIONS */}

            {/* ACTION STATE 1: ASSIGNED (READY TO START) */}
            {workOrder.status === 'ASSIGNED' && (
              <div className="bg-[#FFFDF8] shadow-sm p-6 rounded-3xl border-2 border-[#E8890C]/40 bg-[#E8890C]/5 space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#171A1F] tracking-tight">READY TO START WORK</h3>
                    <p className="text-xs text-[#9C4F08]/90 font-medium">
                      This work order has been assigned to you. Confirm when you are physically at the work location and ready to begin.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStartModal(true)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#E8890C] hover:bg-[#9C4F08] text-white font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 font-mono"
                >
                  <span>⚡ START WORK</span>
                  <span>&rarr;</span>
                </button>
              </div>
            )}

            {/* ACTION STATE 2: IN_PROGRESS (FINISH TASK & UPLOAD EVIDENCE) */}
            {workOrder.status === 'IN_PROGRESS' && (
              <div className="space-y-6">
                {/* WORK IN PROGRESS BANNER */}
                <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/30 space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/40 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                      <span>WORK IN PROGRESS</span>
                    </span>
                    <span className="text-xs text-blue-300 font-bold">
                      Elapsed: {formatElapsedTime(elapsedSeconds)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-[#66645F] pt-1">
                    <div>Started At: <strong className="text-[#171A1F] block">{workOrder.workStartedAt ? new Date(workOrder.workStartedAt).toLocaleTimeString() : 'Recently'}</strong></div>
                    <div>Worker: <strong className="text-[#9C4F08] block">{profile?.fullName || 'Vignesh'}</strong></div>
                    <div>Work Order: <strong className="text-[#171A1F] block">{workOrder.workOrderNumber}</strong></div>
                  </div>
                </div>

                {/* FINISH TASK & SUBMIT EVIDENCE FORM */}
                <div className="bg-[#FFFDF8] shadow-sm p-6 rounded-3xl border border-[rgba(23,26,31,0.08)] space-y-5 font-sans">
                  <div className="border-b border-[rgba(23,26,31,0.08)] pb-3">
                    <h3 className="text-lg font-extrabold text-[#171A1F] tracking-tight flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#9C4F08]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>FINISH TASK & SUBMIT EVIDENCE</span>
                    </h3>
                    <p className="text-xs text-[#66645F]">Upload photographic proof of physical repair completion and provide final remarks.</p>
                  </div>

                  {/* A. AFTER-WORK PHOTO UPLOADER */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono uppercase font-bold text-[#9C4F08]">
                      AFTER-WORK COMPLETION PHOTO *
                    </label>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoSelect}
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      className="hidden"
                    />

                    {photoPreviewUrl ? (
                      <div className="relative rounded-2xl overflow-hidden border-2 border-[#E8890C]/40 max-w-md">
                        <img src={photoPreviewUrl} alt="After Work Preview" className="w-full h-56 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                          <span className="text-[10px] font-mono text-[#9C4F08] font-bold bg-black/60 px-2 py-1 rounded">
                            Photo Ready for Upload
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={triggerPhotoSelect}
                              className="px-3 py-1 rounded-xl bg-[#ECE6DA] text-[#171A1F] text-xs font-mono font-bold border border-[rgba(23,26,31,0.15)] hover:bg-[#E2DBCC]"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={removePhoto}
                              className="px-3 py-1 rounded-xl bg-rose-500/80 text-[#171A1F] text-xs font-mono font-bold hover:bg-rose-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={triggerPhotoSelect}
                        className="w-full max-w-md p-6 rounded-2xl bg-[#ECE6DA] border-2 border-dashed border-[rgba(23,26,31,0.15)] hover:border-[#E8890C]/40 cursor-pointer transition-all text-center space-y-2 group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#E8890C]/10 text-[#9C4F08] border border-[#E8890C]/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="text-xs font-bold text-[#171A1F]">Click or Tap to Upload / Capture After Photo</div>
                        <div className="text-[10px] font-mono text-[#66645F]">Supports Mobile Camera Capture & Gallery Upload (JPG, PNG, WEBP)</div>
                      </div>
                    )}
                  </div>

                  {/* B. COMPLETION REMARKS */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono uppercase font-bold text-[#9C4F08]">
                        WORK COMPLETION REMARKS * <span className="text-[10px] text-[#66645F] font-normal border border-[rgba(23,26,31,0.15)] rounded px-1.5 py-0.5 ml-1">Min {MIN_COMPLETION_REMARKS_LENGTH} chars</span>
                      </label>
                      <span className={`text-xs font-mono font-bold ${isRemarksValid ? 'text-emerald-400' : completionRemarks.length > 0 ? 'text-[#9C4F08]' : 'text-[#66645F]'}`}>
                        {completionRemarks.trim().length} / {MIN_COMPLETION_REMARKS_LENGTH} characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={completionRemarks}
                      onChange={(e) => {
                        setCompletionRemarks(e.target.value);
                        if (!remarksTouched) setRemarksTouched(true);
                      }}
                      onBlur={() => setRemarksTouched(true)}
                      placeholder="Describe the work completed, materials used, repairs performed, and any remaining observations..."
                      className="w-full px-4 py-3 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] text-xs text-[#171A1F] placeholder:text-[#66645F] outline-none focus:border-amber-500 font-mono transition-colors"
                    />
                    {remarksTouched && !isRemarksValid && (
                      <p className="text-[11px] font-mono text-rose-400 flex items-center gap-1.5 pt-0.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Completion remarks must contain at least {MIN_COMPLETION_REMARKS_LENGTH} characters.</span>
                      </p>
                    )}
                  </div>

                  {/* C. OPTIONAL FIELD NOTES */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono uppercase font-bold text-[#66645F]">
                      OPTIONAL FIELD NOTES
                    </label>
                    <textarea
                      rows={2}
                      value={fieldNotes}
                      onChange={(e) => setFieldNotes(e.target.value)}
                      placeholder="Any additional notes for municipal authority inspection..."
                      className="w-full px-4 py-2.5 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] text-xs text-[#171A1F] placeholder:text-[#66645F] outline-none focus:border-amber-500 font-mono transition-colors"
                    />
                  </div>

                  {/* SUBMIT BUTTON & UNMET REQUIREMENT EXPLANATION */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      disabled={!canSubmitCompletion}
                      onClick={() => setShowSubmitModal(true)}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-mono text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xl ${
                        canSubmitCompletion
                          ? 'bg-[#E8890C] hover:bg-[#9C4F08] text-white shadow-amber-500/20 cursor-pointer'
                          : 'bg-[#ECE6DA] text-[#66645F] border border-[rgba(23,26,31,0.08)] cursor-not-allowed opacity-75'
                      }`}
                    >
                      <span>SUBMIT FINISHED TASK FOR VERIFICATION</span>
                      <span>&rarr;</span>
                    </button>

                    {!canSubmitCompletion && (
                      <div className="p-3.5 rounded-2xl bg-[#ECE6DA] border border-[#E8890C]/30 text-[#9C4F08] text-xs font-mono flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-[#9C4F08] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {normalizedStatus !== 'IN_PROGRESS'
                            ? 'This work order must be IN PROGRESS before evidence can be submitted.'
                            : !afterPhotoFile
                            ? 'Add an after-work completion photo.'
                            : !isRemarksValid
                            ? `Completion remarks must contain at least ${MIN_COMPLETION_REMARKS_LENGTH} characters.`
                            : submitLoading
                            ? 'Photo upload / submission is currently in progress.'
                            : 'Please complete all required fields.'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTION STATE 3: AWAITING_VERIFICATION */}
            {workOrder.status === 'AWAITING_VERIFICATION' && (
              <div className="bg-[#FFFDF8] shadow-sm p-6 rounded-3xl border border-purple-500/40 bg-purple-500/5 space-y-5 font-sans">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                  <span className="px-3.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold border border-purple-500/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    <span>AWAITING AUTHORITY VERIFICATION</span>
                  </span>
                  <span className="text-xs font-mono text-[#66645F]">
                    Submitted: {workOrder.completedByWorkerAt ? new Date(workOrder.completedByWorkerAt).toLocaleString() : 'Recently'}
                  </span>
                </div>

                <p className="text-xs text-purple-200/90 font-medium">
                  Your completion evidence has been submitted successfully. Municipal Authority verification is pending.
                </p>

                {/* BEFORE VS AFTER EVIDENCE DISPLAY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#66645F] block">BEFORE (Original Citizen Photo)</span>
                    <img src={workOrder.imageUrl} alt="Before" className="w-full h-48 object-cover rounded-2xl border border-[rgba(23,26,31,0.08)]" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#9C4F08] block">AFTER (Artisan Completion Evidence)</span>
                    {workOrder.completionEvidence?.afterImages?.[0]?.secureUrl ? (
                      <img src={workOrder.completionEvidence.afterImages[0].secureUrl} alt="After" className="w-full h-48 object-cover rounded-2xl border border-[#E8890C]/40" />
                    ) : (
                      <div className="w-full h-48 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] flex items-center justify-center text-xs font-mono text-[#66645F]">
                        Evidence Image Uploaded
                      </div>
                    )}
                  </div>
                </div>

                {workOrder.completionEvidence?.completionRemarks && (
                  <div className="p-4 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] text-xs font-mono space-y-1">
                    <span className="text-[10px] text-[#66645F] uppercase font-bold block">Completion Remarks</span>
                    <p className="text-[#171A1F]">{workOrder.completionEvidence.completionRemarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* ACTION STATE 4: COMPLETED */}
            {workOrder.status === 'COMPLETED' && (
              <div className="bg-[#FFFDF8] shadow-sm p-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/5 space-y-5 font-sans">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/40 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>WORK VERIFIED & COMPLETED</span>
                  </span>
                  <span className="text-xs font-mono text-[#66645F]">
                    Closed: {workOrder.completedByWorkerAt ? new Date(workOrder.completedByWorkerAt).toLocaleDateString() : 'Completed'}
                  </span>
                </div>

                <p className="text-xs text-emerald-200/90 font-medium">
                  This work order has been verified by the Municipal Authority and successfully closed.
                </p>

                {/* BEFORE VS AFTER DISPLAY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-[#66645F] block">BEFORE PHOTO</span>
                    <img src={workOrder.imageUrl} alt="Before" className="w-full h-48 object-cover rounded-2xl border border-[rgba(23,26,31,0.08)]" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">AFTER PHOTO</span>
                    {workOrder.completionEvidence?.afterImages?.[0]?.secureUrl ? (
                      <img src={workOrder.completionEvidence.afterImages[0].secureUrl} alt="After" className="w-full h-48 object-cover rounded-2xl border border-emerald-500/40" />
                    ) : (
                      <div className="w-full h-48 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] flex items-center justify-center text-xs font-mono text-[#66645F]">
                        Evidence Image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* START WORK LIQUID GLASS CONFIRMATION MODAL */}
      <LiquidGlassModal
        isOpen={showStartModal}
        title="Start this work order?"
        description="Confirm official physical work initiation at the site location."
        variant="warning"
        onClose={() => setShowStartModal(false)}
        primaryAction={{
          label: 'Confirm & Start Work',
          onClick: handleConfirmStartWork,
          loading: startLoading,
        }}
        secondaryAction={{
          label: 'Cancel',
          onClick: () => setShowStartModal(false),
        }}
      >
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3.5 rounded-2xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#66645F]">Ticket ID:</span>
              <span className="text-[#9C4F08] font-bold">{workOrder?.ticketId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66645F]">Work Order:</span>
              <span className="text-[#171A1F] font-bold">{workOrder?.workOrderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66645F]">Location:</span>
              <span className="text-[#171A1F]">{workOrder?.location?.area || 'Visakhapatnam'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#66645F]">Current Time:</span>
              <span className="text-[#171A1F]">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#E8890C]/10 border border-[#E8890C]/30 text-[#9C4F08] text-[11px]">
            ⚠️ Starting this task records the official work start time and changes the assignment status to <strong>IN PROGRESS</strong>.
          </div>
        </div>
      </LiquidGlassModal>

      {/* SUBMIT FINISHED TASK LIQUID GLASS CONFIRMATION MODAL */}
      <LiquidGlassModal
        isOpen={showSubmitModal}
        title="Submit finished task for verification?"
        description="Review Before & After photographic evidence comparison."
        variant="info"
        onClose={() => setShowSubmitModal(false)}
        primaryAction={{
          label: 'Submit for Verification',
          onClick: handleConfirmSubmitEvidence,
          loading: submitLoading,
        }}
        secondaryAction={{
          label: 'Continue Working',
          onClick: () => setShowSubmitModal(false),
        }}
      >
        <div className="space-y-4 font-sans text-xs">
          {/* BEFORE VS AFTER PREVIEW COMPARISON */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#66645F] uppercase block">BEFORE</span>
              <img src={workOrder?.imageUrl} alt="Before Preview" className="w-full h-32 object-cover rounded-xl border border-[rgba(23,26,31,0.08)]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#9C4F08] uppercase block">AFTER</span>
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="After Preview" className="w-full h-32 object-cover rounded-xl border border-[#E8890C]/40" />
              ) : null}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#ECE6DA] border border-[rgba(23,26,31,0.08)] font-mono text-[11px] space-y-1 text-[#66645F]">
            <div>Remarks: <span className="text-[#171A1F]">{completionRemarks}</span></div>
            {fieldNotes && <div>Notes: <span className="text-[#66645F]">{fieldNotes}</span></div>}
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[11px]">
            Notice: After submission, this task will be sent to the Municipal Authority for verification. You cannot mark the task as completed yourself.
          </div>
        </div>
      </LiquidGlassModal>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <ToastNotification
          title={toastMessage.title}
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </ArtisanShell>
  );
};
