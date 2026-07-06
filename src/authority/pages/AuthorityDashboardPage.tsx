import React, { useState, useMemo } from 'react';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { OperationalSummary } from '../components/dashboard/OperationalSummary';
import { PriorityQueue } from '../components/dashboard/PriorityQueue';
import { CitySituationPreview } from '../components/dashboard/CitySituationPreview';
import { RecentAuthorityActivity } from '../components/dashboard/RecentAuthorityActivity';
import { IssueInspectionPanel } from '../components/issues/IssueInspectionPanel';
import { useAuthorityReports } from '../context/AuthorityReportsContext';

export const AuthorityDashboardPage: React.FC = () => {
  const { reports: issues, loading } = useAuthorityReports();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Derive selectedIssue
  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Derive counts directly from shared context reports
  const pendingCount = useMemo(() => {
    return issues.filter((i) => i.status.toUpperCase() === 'SUBMITTED').length;
  }, [issues]);

  const criticalCount = useMemo(() => {
    return issues.filter((i) => i.severity === 'critical').length;
  }, [issues]);

  return (
    <AuthorityShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Operational Command Hub
            </h1>
            <p className="text-xs text-slate-400">
              Visakhapatnam Municipal Corporation • Real-time Triage & Dispatch Overview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
              Real Firestore Pipeline Active
            </span>
          </div>
        </div>

        {/* Operational Summary Metrics */}
        <OperationalSummary
          pendingCount={pendingCount}
          criticalCount={criticalCount}
          activeWorkersCount={0}
        />

        {/* Priority Action Triage Queue & Situation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="p-8 text-center auth-glass-surface rounded-2xl border border-slate-800 text-xs text-slate-400">
                Loading real reports from Cloud Firestore...
              </div>
            ) : issues.length > 0 ? (
              <PriorityQueue
                issues={issues}
                onSelectIssue={(issue) => setSelectedIssueId(issue.id)}
              />
            ) : (
              <div className="p-8 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-base font-bold text-slate-200">No Reports Submitted Yet</h4>
                <p className="text-xs text-slate-400">
                  Citizen civic reports submitted via the portal will automatically appear here in real-time.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <CitySituationPreview issues={issues} />
            <RecentAuthorityActivity />
          </div>
        </div>
      </div>

      {/* Slide-over Inspection Panel */}
      <IssueInspectionPanel
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssueId(null)}
      />
    </AuthorityShell>
  );
};
