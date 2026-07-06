import type { IssueCategory, IssueSeverity, IssueStatus, StructuredLocation } from '../../types/civic';

export type WorkerStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ON_LEAVE'
  | 'INACTIVE'
  | 'Available'
  | 'On Assignment'
  | 'Off Shift'
  | 'Unavailable'
  | 'available'
  | 'assigned'
  | string;

export type WorkerDepartment =
  | 'Roads & Infrastructure'
  | 'Sanitation & Waste Management'
  | 'Water Supply & Drainage'
  | 'Public Lighting & Electrical'
  | 'Traffic & Transit Works'
  | 'Parks & Public Spaces'
  | 'General Municipal Services'
  | string;

export interface ShiftInfo {
  name: string;
  startTime: string;
  endTime: string;
}

export interface MunicipalEmployee {
  id?: string;
  workerId?: string;
  employeeId?: string;
  employeeCode?: string;
  fullName?: string;
  name?: string;
  email: string;
  phone?: string;
  department: WorkerDepartment;
  role?: string;
  jobRole?: string;
  skills?: string[];
  status: WorkerStatus;
  shift: ShiftInfo | string;
  serviceArea?: string;
  activeWorkOrderIds?: string[];
  activeAssignmentCount?: number;
  activeAssignmentsCount?: number;
  resolvedCount?: number;
  credits?: number;
  isActive?: boolean;
  officialEmail?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Backward compatibility alias for MunicipalWorker
export type MunicipalWorker = MunicipalEmployee;

export interface EmailNotificationState {
  status: 'PENDING' | 'SENT' | 'FAILED' | 'RETRYING';
  sentAt?: string;
  recipientEmail?: string;
  providerMessageId?: string;
  failureReason?: string;
}

export interface WorkOrder {
  workOrderId: string;
  workOrderNumber: string;
  reportId: string;
  ticketId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeEmail: string;
  issueCategory: string;
  issueSummary: string;
  priority: string;
  imageUrl?: string;
  location: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    area: string;
  };
  assignmentDate: string;
  shift: ShiftInfo;
  authorityInstructions?: string;
  status: 'ASSIGNED' | 'ACCEPTED_BY_WORKER' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  assignedBy: string;
  assignedAt: string;
  isReassigned?: boolean;
  assignmentHistory?: any[];
  emailNotification: EmailNotificationState;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthorityIssueInspectionItem {
  id: string;
  ticketId: string;
  markerNumber: number;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  severity: IssueSeverity;
  location: StructuredLocation;
  imageUrl?: string;
  aiAnalysis: {
    category: string;
    summary: string;
    severity: string;
    visibleRisk: string;
    confidence: number;
    needsHumanReview: boolean;
  };
  reporter: {
    uid: string;
    submittedAt: string;
  };
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  workOrderId?: string;
  employeeId?: string;
  updatedAt: string;
  dismissal?: {
    reasonCode: string;
    remarks?: string;
    dismissedAt?: string;
    dismissedBy?: string;
    duplicateOfTicketId?: string;
    duplicateOfReportId?: string;
  };
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export interface TaskAssignment {
  id: string;
  issueTicketId: string;
  workerId: string;
  workerName: string;
  assignedAt: string;
  shift: string;
  resolutionStage: 'Assigned' | 'En Route' | 'In Progress' | 'Inspection Required' | 'Resolved';
}
