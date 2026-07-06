import React, { useState, useEffect } from 'react';
import { IssueTabs, type IssueTabFilter } from '../features/issues/IssueTabs';
import { EmptyIssuesState } from '../features/issues/EmptyIssuesState';
import { SectionHeader } from '../components/civic/SectionHeader';
import { GlassSurface } from '../components/ui/GlassSurface';
import { authService } from '../services/authService';
import type { StructuredLocation } from '../types/civic';

import { API_BASE_URL } from '../config/api';

interface RealCitizenIssue {
  issueId: string;
  ticketId: string;
  category: string;
  description: string;
  status: string;
  location?: StructuredLocation;
  image?: { secure_url?: string };
  supportCount?: number;
  createdAt?: string;
}

export const IssuesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IssueTabFilter>('all');
  const [myIssues, setMyIssues] = useState<RealCitizenIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        const token = await authService.getIdToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/issues/my-issues`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMyIssues(data.issues || []);
        }
      } catch {
        setMyIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyIssues();
  }, []);

  const filteredIssues = myIssues.filter((iss) => {
    if (activeTab === 'active') return iss.status.toUpperCase() !== 'RESOLVED' && iss.status.toUpperCase() !== 'DISMISSED';
    if (activeTab === 'resolved') return iss.status.toUpperCase() === 'RESOLVED';
    return true;
  });

  const activeCount = myIssues.filter((i) => i.status.toUpperCase() !== 'RESOLVED' && i.status.toUpperCase() !== 'DISMISSED').length;
  const resolvedCount = myIssues.filter((i) => i.status.toUpperCase() === 'RESOLVED').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <SectionHeader
        title="My Civic Issues"
        subtitle="Track status and municipal resolutions for your submitted tickets"
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <IssueTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{ all: myIssues.length, active: activeCount, resolved: resolvedCount }}
        />
      </div>

      {loading ? (
        <div className="p-8 text-center glass-surface rounded-2xl border border-slate-200/80 text-xs text-slate-500 font-medium">
          Loading your submitted tickets...
        </div>
      ) : filteredIssues.length > 0 ? (
        <div className="space-y-4">
          {filteredIssues.map((issue) => (
            <GlassSurface key={issue.issueId} variant="surface" rounded="2xl" className="p-5 border-slate-200/80 space-y-3 bg-white/80 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                    {issue.ticketId}
                  </span>
                  <span className="text-xs font-bold text-slate-900 capitalize">
                    {issue.category}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase">
                  {issue.status}
                </span>
              </div>

              <div className="flex items-start gap-3">
                {issue.image?.secure_url && (
                  <img
                    src={issue.image.secure_url}
                    alt={issue.ticketId}
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                  />
                )}
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                    {issue.description}
                  </p>
                  {issue.location?.displayName && (
                    <p className="text-xs text-slate-500 truncate">
                      {issue.location.displayName}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Raised By Citizen</span>
                <span>Support Count: <strong className="text-slate-900">{issue.supportCount || 0}</strong></span>
              </div>
            </GlassSurface>
          ))}
        </div>
      ) : (
        <EmptyIssuesState />
      )}
    </div>
  );
};
