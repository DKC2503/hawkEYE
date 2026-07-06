import React, { useState } from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';
import { AuthorityIssueCard } from './AuthorityIssueCard';

interface AuthorityIssueQueueProps {
  issues: AuthorityIssueInspectionItem[];
  onSelectIssue: (issue: AuthorityIssueInspectionItem) => void;
}

export const AuthorityIssueQueue: React.FC<AuthorityIssueQueueProps> = ({
  issues,
  onSelectIssue,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const filteredIssues = issues.filter((iss) => {
    const matchesSearch =
      iss.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      iss.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (iss.location.displayName || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = selectedSeverity === 'all' || iss.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between auth-glass-surface p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ticket ID, area, or hazard..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-colors font-sans"
          />
          <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-mono text-slate-400 font-bold shrink-0">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 text-xs font-mono rounded-lg capitalize transition-all shrink-0 ${
                selectedSeverity === sev
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Complaint Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIssues.map((issue) => (
          <AuthorityIssueCard key={issue.id} issue={issue} onSelect={onSelectIssue} />
        ))}
      </div>

      {filteredIssues.length === 0 && (
        <div className="p-8 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-300">No matching issues found</p>
          <p className="text-xs text-slate-500">Try adjusting your search filters or clearing severity selection.</p>
        </div>
      )}
    </div>
  );
};
