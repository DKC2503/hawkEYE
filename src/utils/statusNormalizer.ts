export type CanonicalReportStatus =
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_VERIFICATION'
  | 'COMPLETED'
  | 'DISMISSED';

/**
 * Single Authoritative Normalizer for Report and Work Order statuses.
 * Maps legacy or variant status strings to canonical uppercase values.
 */
export function normalizeReportStatus(rawStatus?: string | null): CanonicalReportStatus {
  if (!rawStatus) return 'SUBMITTED';

  const clean = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_');

  switch (clean) {
    case 'SUBMITTED':
    case 'NEW':
    case 'UNDER_REVIEW':
      return 'SUBMITTED';

    case 'ACCEPTED':
    case 'ACCEPTED_BY_WORKER':
      return 'ACCEPTED';

    case 'ASSIGNED':
      return 'ASSIGNED';

    case 'IN_PROGRESS':
    case 'INPROGRESS':
    case 'WORK_STARTED':
      return 'IN_PROGRESS';

    case 'AWAITING_VERIFICATION':
    case 'AWAITINGVERIFICATION':
    case 'PENDING_VERIFICATION':
    case 'VERIFICATION_PENDING':
      return 'AWAITING_VERIFICATION';

    case 'COMPLETED':
    case 'RESOLVED':
    case 'VERIFIED':
    case 'CLOSED':
      return 'COMPLETED';

    case 'DISMISSED':
    case 'REJECTED_REPORT':
    case 'DELETED':
      return 'DISMISSED';

    default:
      return 'SUBMITTED';
  }
}
