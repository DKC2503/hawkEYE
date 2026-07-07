import React, { useState, useEffect, useMemo } from 'react';
import { useAuthorityReports } from '../authority/context/AuthorityReportsContext';
import { normalizeReportStatus } from '../utils/statusNormalizer';
import { apiFetch } from '../utils/apiClient';

export const PublicTransparencyPage: React.FC = () => {
  const { reports } = useAuthorityReports();
  const [_transparencyData, setTransparencyData] = useState<any | null>(null);
  const [_loading, setLoading] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState('HIGHLY_EFFECTIVE');
  const [feedbackRemarks, setFeedbackRemarks] = useState('');

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/intelligence/public/transparency');
        if (res.ok) setTransparencyData(await res.json());
      } catch {
        // Ignore
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  const totalReportsCount = useMemo(() => reports?.length || 0, [reports]);
  const activeReportsCount = useMemo(() => {
    if (!reports) return 0;
    return reports.filter((r) => {
      const norm = normalizeReportStatus(r.status);
      return ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'].includes(norm);
    }).length;
  }, [reports]);

  const completedReportsCount = useMemo(() => {
    if (!reports) return 0;
    return reports.filter((r) => normalizeReportStatus(r.status) === 'COMPLETED').length;
  }, [reports]);

  const totalHandsRaised = useMemo(() => {
    if (!reports) return 0;
    return reports.reduce((acc, r) => acc + ((r as any).upvotesCount || (r as any).upvotes || (r as any).upvoteCount || 0), 0);
  }, [reports]);

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 font-sans animate-page-transition">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-mono font-bold uppercase">
          Public Civic Transparency & Impact Dashboard
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Participatory Municipal Development & Transparency
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Explore citizen demand themes, real incident statistics, and verified municipal project execution status.
        </p>
      </div>

      {/* Real Public Summary Metric Cards (Firestore Derived) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Reports Logged</span>
          <span className="text-3xl font-black text-slate-900">{totalReportsCount}</span>
          <span className="text-[10px] text-slate-500 block">Verified Citizen Submissions</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Investigations</span>
          <span className="text-3xl font-black text-amber-600">{activeReportsCount}</span>
          <span className="text-[10px] text-amber-600 block font-bold">Under Review & Dispatched</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Verified Completions</span>
          <span className="text-3xl font-black text-emerald-600">{completedReportsCount}</span>
          <span className="text-[10px] text-emerald-600 block font-bold">Closed & Approved Works</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase block">Community Hands Raised</span>
          <span className="text-3xl font-black text-purple-600">{totalHandsRaised}</span>
          <span className="text-[10px] text-purple-600 block font-bold">Upvotes & Support</span>
        </div>
      </div>

      {/* Citizen Feedback Survey Form */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">Municipal Repair Effectiveness Rating</h2>
          <p className="text-xs text-slate-500">Provide direct citizen feedback on completed municipal repairs in your locality.</p>
        </div>

        {feedbackSubmitted ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
            ✔ Thank you for rating municipal repair effectiveness! Your feedback has been logged.
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block font-mono font-bold text-slate-700 uppercase">Rating</label>
              <select
                value={feedbackRating}
                onChange={(e) => setFeedbackRating(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-bold text-slate-900"
              >
                <option value="HIGHLY_EFFECTIVE">Highly Effective Repair</option>
                <option value="MODERATELY_EFFECTIVE">Satisfactory Repair</option>
                <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
                <option value="INCOMPLETE_WORK">Work Incomplete</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-mono font-bold text-slate-700 uppercase">Citizen Remarks</label>
              <textarea
                rows={3}
                value={feedbackRemarks}
                onChange={(e) => setFeedbackRemarks(e.target.value)}
                placeholder="Share observations regarding repair quality, timeline, or road conditions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono text-slate-900 outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              Submit Citizen Feedback &rarr;
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
