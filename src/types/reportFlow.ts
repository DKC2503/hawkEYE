import type { IssueCategory, IssueSeverity, StructuredLocation } from './civic';
import type { CreatedIssueReceipt } from '../services/issueApiService';

export type ReportStep = 1 | 2 | 3 | 4 | 5;

export type AIAnalysisState = 'idle' | 'analyzing' | 'success' | 'uncertain' | 'failed';

export type SubmissionState = 'ready' | 'submitting' | 'success' | 'failure';

export interface HawkEyeVisionResult {
  is_civic_issue: boolean;
  category: 'POTHOLE' | 'ROAD_DAMAGE' | 'GARBAGE' | 'STREETLIGHT' | 'DRAINAGE' | 'WATER_LEAK' | 'FLOODING' | 'DAMAGED_INFRASTRUCTURE' | 'OTHER_CIVIC_ISSUE' | 'NOT_A_CIVIC_ISSUE' | 'UNCERTAIN';
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  visible_risk: string;
  confidence: number;
  needs_human_review: boolean;
}

export interface ReportFormData {
  imageFile?: File;
  imagePreviewUrl?: string;
  location?: StructuredLocation | null;
  locationStatus: 'idle' | 'locating' | 'success' | 'denied' | 'error';
  locationErrorMessage?: string;
  aiState: AIAnalysisState;
  detectedCategory?: IssueCategory;
  category: IssueCategory;
  aiSummary?: string;
  visibleRisk?: string;
  description: string;
  severity: IssueSeverity;
  aiConfidence?: number;
  visionResult?: HawkEyeVisionResult;
  submissionState: SubmissionState;
  submissionError?: string | null;
  submissionErrorCode?: string | null;
  createdReceipt?: CreatedIssueReceipt | null;
  idempotencyKey?: string;
}
