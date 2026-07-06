/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthorityIssueInspectionItem } from '../types/authority';
import { normalizeCategory } from '../../utils/categoryNormalizer';
import { authService } from '../../services/authService';

import { normalizeReportStatus } from '../../utils/statusNormalizer';

import { API_BASE_URL } from '../../config/api';

interface AuthorityReportsContextType {
  reports: AuthorityIssueInspectionItem[];
  loading: boolean;
  fetchReports: () => Promise<void>;
  updateReport: (updatedDoc: any) => void;
  refreshSingleReport: (reportId: string) => Promise<void>;
}

const AuthorityReportsContext = createContext<AuthorityReportsContextType | undefined>(undefined);

const mapDocToInspectionItem = (doc: any, idx: number): AuthorityIssueInspectionItem => ({
  id: doc.issueId || doc.id,
  ticketId: doc.ticketId || `HE-2026-${idx + 100}`,
  markerNumber: idx + 101,
  category: normalizeCategory(doc.category),
  description: doc.description || doc.citizenNotes || 'Citizen report',
  status: normalizeReportStatus(doc.status),
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
  dismissal: doc.dismissal,
  isDeleted: doc.isDeleted,
  deletedAt: doc.deletedAt,
  deletedBy: doc.deletedBy,
});

export const AuthorityReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<AuthorityIssueInspectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize Firebase Auth anonymous session
  useEffect(() => {
    const unsubscribe = authService.initAnonymousAuth(() => {});
    return () => unsubscribe();
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues`);
      if (response.ok) {
        const data = await response.json();
        const mapped = (data.issues || [])
          .filter((doc: any) => !doc.isDeleted)
          .map((doc: any, idx: number) => 
            mapDocToInspectionItem(doc, idx)
          );
        setReports(mapped);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const updateReport = useCallback((updatedDoc: any) => {
    setReports((prev) => {
      // If the updated report is soft-deleted, filter it out immediately
      if (updatedDoc.isDeleted) {
        return prev.filter((item) => item.id !== updatedDoc.issueId && item.id !== updatedDoc.id);
      }
      return prev.map((item) => {
        if (item.id === updatedDoc.issueId || item.id === updatedDoc.id) {
          const mapped = mapDocToInspectionItem(updatedDoc, item.markerNumber - 101);
          return {
            ...mapped,
            markerNumber: item.markerNumber, // preserve markerNumber
          };
        }
        return item;
      });
    });
  }, []);

  const refreshSingleReport = useCallback(async (reportId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/${reportId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.issue) {
          updateReport(data.issue);
        }
      }
    } catch (err) {
      console.error(`Error refreshing single report ${reportId}:`, err);
    }
  }, [updateReport]);

  return (
    <AuthorityReportsContext.Provider value={{ reports, loading, fetchReports, updateReport, refreshSingleReport }}>
      {children}
    </AuthorityReportsContext.Provider>
  );
};

export const useAuthorityReports = () => {
  const context = useContext(AuthorityReportsContext);
  if (context === undefined) {
    throw new Error('useAuthorityReports must be used within an AuthorityReportsProvider');
  }
  return context;
};
