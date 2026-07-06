import { authService } from './authService';

import { API_BASE_URL } from '../config/api';

export interface ArtisanProfile {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  officialEmail: string;
  department: string;
  role: string;
  phone?: string;
  isActive: boolean;
  shift?: { name: string; startTime: string; endTime: string };
  serviceArea?: string;
  activeWorkOrderIds?: string[];
}

export interface ArtisanDashboardSummary {
  allAssigned: number;
  pending: number;
  inProgress: number;
  awaitingVerification: number;
  completed: number;
}

export interface CompletionEvidence {
  afterImages?: Array<{
    secureUrl: string;
    publicId?: string;
    uploadedAt?: string;
  }>;
  completionRemarks: string;
  fieldNotes?: string;
  submittedAt?: string;
}

export interface VerificationRecord {
  decision: 'APPROVED' | 'REJECTED';
  reasonCode?: string;
  remarks?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ArtisanWorkOrder {
  workOrderId: string;
  workOrderNumber: string;
  reportDocumentId?: string;
  ticketId: string;
  issueCategory: string;
  issueSummary: string;
  priority: string;
  imageUrl: string;
  location: {
    latitude?: number;
    longitude?: number;
    formattedAddress?: string;
    area?: string;
    isValid?: boolean;
  };
  assignmentDate: string;
  shift: {
    name?: string;
    startTime?: string;
    endTime?: string;
  };
  authorityInstructions?: string;
  status: string;
  assignedAt?: string;
  employeeName?: string;
  isReassigned?: boolean;
  workStartedAt?: string;
  completedByWorkerAt?: string;
  completionEvidence?: CompletionEvidence;
  verificationHistory?: VerificationRecord[];
}

class ArtisanApiClient {
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await authService.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async safeFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (err: any) {
      if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('NetworkError')) {
        throw new Error(`[CONNECTION_REFUSED] Operational backend server is unavailable at ${API_BASE_URL}. Please ensure FastAPI server is running.`);
      }
      throw err;
    }
  }

  async getProfile(): Promise<ArtisanProfile> {
    const headers = await this.getHeaders();
    const res = await this.safeFetch(`${API_BASE_URL}/api/artisan/profile`, { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch artisan profile.');
    }
    return data.profile;
  }

  async getDashboardSummary(): Promise<ArtisanDashboardSummary> {
    const headers = await this.getHeaders();
    const res = await this.safeFetch(`${API_BASE_URL}/api/artisan/dashboard-summary`, { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch dashboard summary.');
    }
    return data.summary;
  }

  async getWorkOrders(statusFilter: string = 'all'): Promise<ArtisanWorkOrder[]> {
    const headers = await this.getHeaders();
    const url = `${API_BASE_URL}/api/artisan/work-orders?status_filter=${encodeURIComponent(statusFilter)}`;
    const res = await this.safeFetch(url, { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to load assigned work orders.');
    }
    return data.workOrders || [];
  }

  async getWorkOrderDetail(workOrderId: string): Promise<ArtisanWorkOrder> {
    const headers = await this.getHeaders();
    const res = await this.safeFetch(`${API_BASE_URL}/api/artisan/work-orders/${workOrderId}`, { headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to load work order detail.');
    }
    return data.workOrder;
  }

  async startWorkOrder(workOrderId: string): Promise<ArtisanWorkOrder> {
    const headers = await this.getHeaders();
    const res = await this.safeFetch(`${API_BASE_URL}/api/artisan/work-orders/${workOrderId}/start`, {
      method: 'POST',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to start work order.');
    }
    return data.workOrder;
  }

  async submitWorkOrderEvidence(
    workOrderId: string,
    afterPhoto: File,
    completionRemarks: string,
    fieldNotes?: string
  ): Promise<ArtisanWorkOrder> {
    const token = await authService.getIdToken();
    const formData = new FormData();
    formData.append('afterPhoto', afterPhoto);
    formData.append('completionRemarks', completionRemarks);
    if (fieldNotes) {
      formData.append('fieldNotes', fieldNotes);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await this.safeFetch(`${API_BASE_URL}/api/artisan/work-orders/${workOrderId}/submit-evidence`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to submit completion evidence.');
    }
    return data.workOrder;
  }

  // Authority Verification API Client Methods
  async getVerificationQueue(): Promise<ArtisanWorkOrder[]> {
    const res = await fetch(`${API_BASE_URL}/api/authority/verification-queue`, {
      headers: { 'X-Authority-Role': 'authority' },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to fetch verification queue.');
    }
    return data.verificationQueue || [];
  }

  async approveVerification(workOrderId: string): Promise<ArtisanWorkOrder> {
    const res = await fetch(`${API_BASE_URL}/api/authority/work-orders/${workOrderId}/verify-approval`, {
      method: 'POST',
      headers: { 'X-Authority-Role': 'authority' },
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to approve work order.');
    }
    return data.workOrder;
  }

  async rejectVerification(workOrderId: string, reasonCode: string, remarks: string): Promise<ArtisanWorkOrder> {
    const res = await fetch(`${API_BASE_URL}/api/authority/work-orders/${workOrderId}/verify-rejection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authority-Role': 'authority',
      },
      body: JSON.stringify({ reasonCode, remarks }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to reject work order evidence.');
    }
    return data.workOrder;
  }
}

export const artisanApiClient = new ArtisanApiClient();
