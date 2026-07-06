import React, { useState, useEffect } from 'react';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { LiquidGlassModal } from '../../components/ui/LiquidGlassModal';
import { ToastNotification } from '../../components/ui/ToastNotification';
import { GlassDropdown, type GlassDropdownOption } from '../../components/ui/GlassDropdown';
import { API_BASE_URL } from '../../config/api';

const decisionOptions: GlassDropdownOption[] = [
  { value: 'APPROVE_PLANNING', label: 'Approve for Municipal Planning' },
  { value: 'APPROVE_EXECUTION', label: 'Approve for Immediate Execution' },
  { value: 'DEFER', label: 'Defer Decision for Data Collection' },
  { value: 'REJECT', label: 'Reject Proposal' },
];

export const PriorityProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [compareProposalB, setCompareProposalB] = useState<any | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);

  // Decision state
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<string>('APPROVE_PLANNING');
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: 'success' | 'error' } | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intelligence/proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
        if (data.length > 0) setSelectedProposal(data[0]);
      }
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCompare = async (propB: any) => {
    if (!selectedProposal) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/intelligence/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id_a: selectedProposal.proposal_id,
          proposal_id_b: propB.proposal_id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
        setCompareProposalB(propB);
        setShowComparisonModal(true);
      }
    } catch {
      alert("Failed to compare proposals.");
    }
  };

  const handleConfirmDecision = async () => {
    if (!selectedProposal) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/intelligence/proposals/${selectedProposal.proposal_id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          remarks: decisionRemarks.trim() || 'Authority officer approved decision.',
        }),
      });

      if (res.ok) {
        setShowDecisionModal(false);
        setToastMessage({
          title: 'Proposal Decision Saved',
          message: `Proposal '${selectedProposal.title}' status updated to ${decisionType}.`,
          type: 'success',
        });
        setDecisionRemarks('');
        await fetchProposals();
      }
    } catch (err: any) {
      setToastMessage({
        title: 'Decision Failed',
        message: err.message || 'Could not save proposal decision.',
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthorityShell>
      <div className="space-y-6 font-sans">
        {toastMessage && (
          <ToastNotification
            title={toastMessage.title}
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>Objective Priority Proposal Ranking & Decision Workspace</span>
            </h1>
            <p className="text-xs text-slate-400">
              Rank development priorities using a transparent 100-point scoring model (Demand, Impact, Gap, Urgency, Equity, Feasibility).
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
              {proposals.length} Proposals Scored
            </span>
          </div>
        </div>

        {/* Proposals Table & Detail Workspace Split */}
        {loading ? (
          <div className="p-12 text-center auth-glass-surface rounded-3xl border border-slate-800 text-xs font-mono text-slate-400">
            Evaluating evidence-based proposals...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Proposal List (Ranked) */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {proposals.map((prop, idx) => {
                const isSelected = selectedProposal?.proposal_id === prop.proposal_id;
                return (
                  <div
                    key={prop.proposal_id}
                    onClick={() => setSelectedProposal(prop)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-500/10 text-white'
                        : 'auth-glass-surface border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">#{idx + 1}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{prop.proposal_id}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                        SCORE: {prop.priority_score} / 100
                      </span>
                    </div>

                    <h4 className="font-extrabold text-white font-sans text-xs line-clamp-1">{prop.title}</h4>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                      <div>Demand: <strong className="text-amber-400">{prop.unique_citizens} citizens</strong></div>
                      <div>Impact: <strong className="text-slate-200">{prop.affected_population.toLocaleString()} residents</strong></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Full Proposal & Score Breakdown Workspace */}
            {selectedProposal && (
              <div className="lg:col-span-7 auth-glass-surface rounded-3xl border border-slate-800 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400">{selectedProposal.proposal_id}</span>
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedProposal.title}</h2>
                  </div>

                  <span className="px-4 py-1.5 rounded-2xl bg-amber-500 text-slate-950 font-mono font-extrabold text-sm self-start sm:self-auto shadow-md">
                    SCORE: {selectedProposal.priority_score} / 100
                  </span>
                </div>

                {/* 100-Point Score Breakdown Grid */}
                <div className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase">Transparent 100-Point Priority Score Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Citizen Demand (25%)</span>
                      <strong className="text-amber-400 text-sm">{selectedProposal.score_breakdown?.citizen_demand || 24} pts</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Population Impact (20%)</span>
                      <strong className="text-slate-200 text-sm">{selectedProposal.score_breakdown?.population_impact || 19} pts</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Infra Gap (20%)</span>
                      <strong className="text-rose-400 text-sm">{selectedProposal.score_breakdown?.infrastructure_gap || 19} pts</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Urgency (15%)</span>
                      <strong className="text-orange-400 text-sm">{selectedProposal.score_breakdown?.urgency_safety || 13} pts</strong>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    {proposals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const other = proposals.find((p) => p.proposal_id !== selectedProposal.proposal_id);
                          if (other) handleCompare(other);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold border border-purple-500/40 transition-all flex items-center gap-1.5"
                      >
                        <span>⚖ Compare Proposal Side-by-Side</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDecisionModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all"
                  >
                    AUTHORITY DECISION & ACTION &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DECISION MODAL */}
        <LiquidGlassModal
          isOpen={showDecisionModal}
          title="Authority Proposal Decision"
          description="Select an official decision status for this evidence-based development proposal."
          variant="success"
          onClose={() => setShowDecisionModal(false)}
          primaryAction={{
            label: actionLoading ? 'Saving...' : 'Confirm Decision',
            onClick: handleConfirmDecision,
            loading: actionLoading,
          }}
          secondaryAction={{
            label: 'Cancel',
            onClick: () => setShowDecisionModal(false),
          }}
        >
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">Decision Status *</label>
              <GlassDropdown
                options={decisionOptions}
                value={decisionType}
                onChange={setDecisionType}
                variant="amber"
                ariaLabel="Decision Status"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 font-bold uppercase">Authority Official Remarks *</label>
              <textarea
                rows={3}
                value={decisionRemarks}
                onChange={(e) => setDecisionRemarks(e.target.value)}
                placeholder="Enter official decision rationale or instructions..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 outline-none focus:border-amber-500 font-sans text-xs"
              />
            </div>
          </div>
        </LiquidGlassModal>

        {/* SIDE-BY-SIDE PROPOSAL COMPARISON MODAL */}
        <LiquidGlassModal
          isOpen={showComparisonModal}
          title="Side-by-Side Proposal Comparison"
          description="Objective evidence-based metric comparison matrix."
          variant="info"
          onClose={() => setShowComparisonModal(false)}
          primaryAction={{
            label: 'Close Comparison',
            onClick: () => setShowComparisonModal(false),
          }}
        >
          {comparisonResult && (
            <div className="space-y-4 font-sans text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold leading-relaxed">
                {comparisonResult.objective_rationale}
              </div>

              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500">
                    <th className="py-2">Metric</th>
                    <th className="py-2">Proposal A ({selectedProposal?.title})</th>
                    <th className="py-2">Proposal B ({compareProposalB?.title})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {comparisonResult.comparison_matrix?.map((row: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2 font-bold text-slate-400">{row.metric}</td>
                      <td className={`py-2 ${row.winner === 'A' ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>{row.proposal_a_val}</td>
                      <td className={`py-2 ${row.winner === 'B' ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>{row.proposal_b_val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LiquidGlassModal>
      </div>
    </AuthorityShell>
  );
};
