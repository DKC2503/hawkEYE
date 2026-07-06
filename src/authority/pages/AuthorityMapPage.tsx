import React, { useState, useMemo } from 'react';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { AuthorityMapWorkspace } from '../components/map/AuthorityMapWorkspace';
import { IssueInspectionPanel } from '../components/issues/IssueInspectionPanel';
import { useAuthorityReports } from '../context/AuthorityReportsContext';

export const AuthorityMapPage: React.FC = () => {
  const { reports: issues, loading } = useAuthorityReports();
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Derive selectedIssue
  const selectedIssue = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  return (
    <AuthorityShell>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              City Situation Map
            </h1>
            <p className="text-xs text-slate-400">
              Interactive municipal command map canvas with real incident markers
            </p>
          </div>
        </div>

        {/* Map Workspace Shell */}
        {loading ? (
          <div className="h-[400px] rounded-3xl auth-glass-surface flex items-center justify-center text-xs text-slate-400 font-mono">
            Loading map incident markers...
          </div>
        ) : (
          <AuthorityMapWorkspace
            issues={issues}
            onSelectIssue={(iss) => setSelectedIssueId(iss.id)}
          />
        )}
      </div>

      {/* Selected Marker Inspector */}
      <IssueInspectionPanel
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssueId(null)}
      />
    </AuthorityShell>
  );
};
