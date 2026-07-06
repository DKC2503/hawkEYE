import { authService } from './authService';
import { ApiError } from './api';
import type { StructuredLocation, IssueCategory, IssueSeverity } from '../types/civic';
import type { HawkEyeVisionResult } from '../types/reportFlow';

import { API_BASE_URL } from '../config/api';

export interface DuplicateCandidate {
  issueId?: string;
  ticketId: string;
  category: string;
  description: string;
  status: string;
  supportCount: number;
  distanceMeters: number;
  imageUrl?: string;
  location?: StructuredLocation;
  overallConfidence: number;
}

export interface DuplicateCheckResponse {
  duplicateDetected: boolean;
  candidates: DuplicateCandidate[];
  radiusMeters: number;
}

export interface SubmitIssuePayload {
  imageFile: File;
  location: StructuredLocation;
  category: IssueCategory;
  description: string;
  severity: IssueSeverity;
  visionResult?: HawkEyeVisionResult;
  idempotencyKey?: string;
  userConfirmedDifferent?: boolean;
}

export interface CreatedIssueReceipt {
  success: boolean;
  issueId: string;
  ticketId: string;
  category: string;
  description: string;
  status: string;
  location?: StructuredLocation;
  createdAt: string;
}

export class IssueApiService {
  async checkDuplicate(
    location: StructuredLocation,
    category: IssueCategory,
    imageFile?: File
  ): Promise<DuplicateCheckResponse> {
    const formData = new FormData();
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('category', category);

    if (imageFile) {
      formData.append('file', imageFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues/check-duplicate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return { duplicateDetected: false, candidates: [], radiusMeters: 50 };
      }

      return await response.json();
    } catch {
      return { duplicateDetected: false, candidates: [], radiusMeters: 50 };
    }
  }

  async raiseHand(issueIdOrTicket: string): Promise<{ success: boolean; supportCount: number; ticketId?: string }> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new ApiError('You must be authenticated before supporting an issue.', 'AUTH_REQUIRED');
    }

    const response = await fetch(`${API_BASE_URL}/api/issues/${issueIdOrTicket}/raise-hand`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to raise hand for issue.', 'RAISE_HAND_FAILED');
    }

    return await response.json();
  }

  async submitIssue(payload: SubmitIssuePayload): Promise<CreatedIssueReceipt> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new ApiError('You must be authenticated before submitting a civic issue.', 'AUTH_REQUIRED');
    }

    const formData = new FormData();
    formData.append('file', payload.imageFile);
    formData.append('latitude', payload.location.latitude.toString());
    formData.append('longitude', payload.location.longitude.toString());

    if (payload.location.accuracy) {
      formData.append('accuracy', payload.location.accuracy.toString());
    }
    if (payload.location.area) formData.append('area', payload.location.area);
    if (payload.location.city) formData.append('city', payload.location.city);
    if (payload.location.state) formData.append('state', payload.location.state);
    if (payload.location.country) formData.append('country', payload.location.country);
    if (payload.location.postalCode) formData.append('postalCode', payload.location.postalCode);
    if (payload.location.displayName) formData.append('displayName', payload.location.displayName);

    const vr = payload.visionResult;
    formData.append('aiCategory', vr?.category || payload.category.toUpperCase());
    formData.append('aiSummary', vr?.summary || payload.description || 'Citizen submitted report');
    formData.append('aiSeverity', vr?.severity || payload.severity.toUpperCase());
    formData.append('aiVisibleRisk', vr?.visible_risk || 'Citizen hazard report');
    formData.append('aiConfidence', (vr?.confidence ?? 0.90).toString());
    formData.append('needsHumanReview', (vr?.needs_human_review ?? false).toString());

    formData.append('category', payload.category);
    formData.append('description', payload.description);
    formData.append('citizenNotes', payload.description);

    if (payload.userConfirmedDifferent) {
      formData.append('userConfirmedDifferent', 'true');
    }

    if (payload.idempotencyKey) {
      formData.append('idempotencyKey', payload.idempotencyKey);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Submission failed with status ${response.status}`;
        let errorCode = 'ISSUE_CREATION_FAILED';

        try {
          const errorData = await response.json();
          if (errorData && errorData.detail) {
            if (typeof errorData.detail === 'object' && errorData.detail.code === 'POSSIBLE_DUPLICATE') {
              const err = new ApiError('Possible duplicate report detected.', 'POSSIBLE_DUPLICATE');
              (err as any).candidates = errorData.detail.candidates;
              throw err;
            }

            const rawDetail = typeof errorData.detail === 'string'
              ? errorData.detail
              : JSON.stringify(errorData.detail);

            const match = rawDetail.match(/^\[([A-Z_]+)\]\s*(.*)$/);
            if (match) {
              errorCode = match[1];
              errorMessage = match[2];
            } else {
              errorMessage = rawDetail;
            }
          }
        } catch (jsonErr) {
          if (jsonErr instanceof ApiError) throw jsonErr;
        }

        throw new ApiError(errorMessage, errorCode);
      }

      const receipt: CreatedIssueReceipt = await response.json();
      return receipt;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error) {
        throw new ApiError(err.message, 'BACKEND_UNREACHABLE');
      }
      throw new ApiError('An unexpected network error occurred while submitting the issue.', 'UNKNOWN_ERROR');
    }
  }

  async dismissIssue(
    reportId: string,
    reasonCode: string,
    remarks: string,
    duplicateOfTicketId?: string
  ): Promise<{ success: boolean; status: string }> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new ApiError('You must be authenticated before dismissing a report.', 'AUTH_REQUIRED');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/authority/issues/${reportId}/dismiss`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authority-Role': 'authority',
        },
        body: JSON.stringify({
          reasonCode,
          remarks,
          duplicateOfTicketId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Dismissal failed with status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {}
        throw new ApiError(errorMessage, 'DISMISS_FAILED');
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error) throw new ApiError(err.message, 'BACKEND_UNREACHABLE');
      throw new ApiError('An unexpected network error occurred while dismissing the issue.', 'UNKNOWN_ERROR');
    }
  }

  async deleteIssue(
    reportId: string,
    reasonCode: string,
    remarks?: string
  ): Promise<{ success: boolean; status: string; issue: any }> {
    const token = await authService.getIdToken();
    if (!token) {
      throw new ApiError('You must be authenticated before deleting a report.', 'AUTH_REQUIRED');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/authority/issues/${reportId}/delete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Authority-Role': 'authority',
        },
        body: JSON.stringify({
          reasonCode,
          remarks,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Deletion failed with status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errorMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {}
        throw new ApiError(errorMessage, 'DELETE_FAILED');
      }

      return await response.json();
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error) {
        if (err.name === 'TypeError' || err.message.toLowerCase().includes('fetch')) {
          const hasToken = !!token;
          const diagnosticMessage = `Network Connection Error (CORS block or Server Unreachable) during soft-deletion request:
• Method: PATCH
• Endpoint: ${API_BASE_URL}/api/authority/issues/${reportId}/delete
• Current Origin: ${window.location.origin}
• Target API Base: ${API_BASE_URL}
• Firebase Auth Token Acquired: ${hasToken ? 'Yes' : 'No'}
• Response Status: None (CORS Preflight failure or connection refused)`;
          throw new ApiError(diagnosticMessage, 'NETWORK_ERROR');
        }
        throw new ApiError(err.message, 'BACKEND_UNREACHABLE');
      }
      throw new ApiError('An unexpected network error occurred while deleting the issue.', 'UNKNOWN_ERROR');
    }
  }
}

export const issueApiService = new IssueApiService();
