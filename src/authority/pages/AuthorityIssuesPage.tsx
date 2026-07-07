import React, { useState, useEffect } from 'react';
import { AuthorityShell } from '../components/layout/AuthorityShell';
import { AuthorityIssueQueue } from '../components/issues/AuthorityIssueQueue';
import { IssueInspectionPanel } from '../components/issues/IssueInspectionPanel';
import type { AuthorityIssueInspectionItem } from '../types/authority';

import { apiFetch } from '../../utils/apiClient';

export const AuthorityIssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<AuthorityIssueInspectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<AuthorityIssueInspectionItem | null>(null);

  useEffect(() => {
    const fetchRealIssues = async () => {
      try {
        const response = await apiFetch('/api/issues');
        if (response.ok) {
          const data = await response.json();
          const realDocs = (data.issues || []).map((doc: any, idx: number) => ({
            id: doc.issueId || doc.id,
            ticketId: doc.ticketId || `HE-2026-${idx + 100}`,
            markerNumber: idx + 101,
            category: doc.category || 'other',
            description: doc.description || doc.citizenNotes || 'Citizen report',
            status: doc.status || 'Submitted',
            severity: (doc.aiAnalysis?.severity || 'medium').toLowerCase(),
            location: doc.location || { latitude: 0, longitude: 0, displayName: 'Location details' },
            imageUrl: doc.image?.secure_url || doc.imageUrl,
            aiAnalysis: {
              category: doc.aiAnalysis?.category || 'POTHOLE',
              summary: doc.aiAnalysis?.summary || 'Report submitted',
              severity: doc.aiAnalysis?.severity || 'MEDIUM',
              visibleRisk: doc.aiAnalysis?.visibleRisk || 'Public hazard',
              confidence: doc.aiAnalysis?.confidence || 0.9,
              needsHumanReview: doc.aiAnalysis?.needsHumanReview || false,
            },
            reporter: {
              uid: doc.reporter?.uid || 'anon_citizen',
              submittedAt: doc.createdAt || new Date().toISOString(),
            },
            updatedAt: doc.updatedAt || new Date().toISOString(),
          }));
          setIssues(realDocs);
        }
      } catch {
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealIssues();
  }, []);

  return (
    <AuthorityShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Issues Triage & Verification Queue
            </h1>
            <p className="text-xs text-slate-400">
              Inspect citizen complaints, neural assessment scores, and dispatch work orders
            </p>
          </div>
        </div>

        {/* Real Issue Queue */}
        {loading ? (
          <div className="p-8 text-center auth-glass-surface rounded-2xl border border-slate-800 text-xs text-slate-400">
            Loading real issues queue...
          </div>
        ) : issues.length > 0 ? (
          <AuthorityIssueQueue
            issues={issues}
            onSelectIssue={(iss) => setSelectedIssue(iss)}
          />
        ) : (
          <div className="p-8 text-center auth-glass-surface rounded-2xl border border-slate-800 space-y-2">
            <h4 className="text-base font-bold text-slate-200">No Reports in Triage Queue</h4>
            <p className="text-xs text-slate-400">
              All reported civic problems submitted by citizens will be listed here.
            </p>
          </div>
        )}
      </div>

      {/* Slide-over Inspector */}
      <IssueInspectionPanel
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </AuthorityShell>
  );
};
