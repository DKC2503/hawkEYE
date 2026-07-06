export type BackendCategoryEnum =
  | 'POTHOLE'
  | 'ROAD_DAMAGE'
  | 'GARBAGE'
  | 'STREETLIGHT'
  | 'DRAINAGE'
  | 'WATER_LEAK'
  | 'FLOODING'
  | 'DAMAGED_INFRASTRUCTURE'
  | 'OTHER_CIVIC_ISSUE'
  | 'NOT_A_CIVIC_ISSUE'
  | 'UNCERTAIN';

export type IssueCategory =
  | 'pothole'
  | 'road_damage'
  | 'garbage'
  | 'streetlight'
  | 'drainage'
  | 'water_leak'
  | 'flooding'
  | 'damaged_infrastructure'
  | 'traffic_signal'
  | 'vandalism'
  | 'other';

export type IssueStatus =
  | 'Submitted'
  | 'Verified'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_VERIFICATION'
  | 'COMPLETED'
  | 'DISMISSED'
  | string;

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface CategoryInfo {
  id: IssueCategory;
  backendEnum: BackendCategoryEnum;
  label: string;
  description: string;
  iconName: string;
}

export const CATEGORY_CONFIG: Record<IssueCategory, CategoryInfo> = {
  pothole: {
    id: 'pothole',
    backendEnum: 'POTHOLE',
    label: 'Pothole',
    description: 'Road surface hole or asphalt depression',
    iconName: 'pothole',
  },
  road_damage: {
    id: 'road_damage',
    backendEnum: 'ROAD_DAMAGE',
    label: 'Road Damage',
    description: 'Cracked, caved-in, or eroded road',
    iconName: 'road',
  },
  garbage: {
    id: 'garbage',
    backendEnum: 'GARBAGE',
    label: 'Garbage Dump',
    description: 'Accumulated trash, overflow, or waste',
    iconName: 'garbage',
  },
  streetlight: {
    id: 'streetlight',
    backendEnum: 'STREETLIGHT',
    label: 'Streetlight',
    description: 'Broken, unlit, or damaged pole light',
    iconName: 'streetlight',
  },
  drainage: {
    id: 'drainage',
    backendEnum: 'DRAINAGE',
    label: 'Drainage Hazard',
    description: 'Blocked gutter, open manhole, or storm drain',
    iconName: 'drainage',
  },
  water_leak: {
    id: 'water_leak',
    backendEnum: 'WATER_LEAK',
    label: 'Water Leak',
    description: 'Burst municipal pipe or gushing water line',
    iconName: 'water',
  },
  flooding: {
    id: 'flooding',
    backendEnum: 'FLOODING',
    label: 'Flooding',
    description: 'Water accumulation or submerged street',
    iconName: 'flooding',
  },
  damaged_infrastructure: {
    id: 'damaged_infrastructure',
    backendEnum: 'DAMAGED_INFRASTRUCTURE',
    label: 'Damaged Infrastructure',
    description: 'Broken bench, guardrail, sign, or public asset',
    iconName: 'infrastructure',
  },
  traffic_signal: {
    id: 'traffic_signal',
    backendEnum: 'OTHER_CIVIC_ISSUE',
    label: 'Traffic Signal',
    description: 'Malfunctioning or dark traffic light',
    iconName: 'traffic_signal',
  },
  vandalism: {
    id: 'vandalism',
    backendEnum: 'OTHER_CIVIC_ISSUE',
    label: 'Graffiti / Vandalism',
    description: 'Defaced public structure or property',
    iconName: 'vandalism',
  },
  other: {
    id: 'other',
    backendEnum: 'OTHER_CIVIC_ISSUE',
    label: 'Other Hazard',
    description: 'General public infrastructure issue',
    iconName: 'other',
  },
};

export const CITIZEN_SELECTABLE_CATEGORIES: CategoryInfo[] = [
  CATEGORY_CONFIG.pothole,
  CATEGORY_CONFIG.road_damage,
  CATEGORY_CONFIG.garbage,
  CATEGORY_CONFIG.streetlight,
  CATEGORY_CONFIG.drainage,
  CATEGORY_CONFIG.water_leak,
  CATEGORY_CONFIG.flooding,
  CATEGORY_CONFIG.damaged_infrastructure,
  CATEGORY_CONFIG.traffic_signal,
  CATEGORY_CONFIG.other,
];

export interface SeverityInfo {
  id: IssueSeverity;
  label: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  buttonActiveBg: string;
}

export const SEVERITY_CONFIG: Record<IssueSeverity, SeverityInfo> = {
  low: {
    id: 'low',
    label: 'Low',
    description: 'Minor non-urgent issue',
    badgeBg: 'bg-slate-100 border-slate-300',
    badgeText: 'text-slate-800',
    buttonActiveBg: 'bg-slate-700 text-white border-slate-600',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    description: 'Moderate hazard requiring attention',
    badgeBg: 'bg-amber-100 border-amber-300',
    badgeText: 'text-amber-900',
    buttonActiveBg: 'bg-amber-600 text-white border-amber-500',
  },
  high: {
    id: 'high',
    label: 'High',
    description: 'Significant traffic or safety hazard',
    badgeBg: 'bg-orange-100 border-orange-300',
    badgeText: 'text-orange-900',
    buttonActiveBg: 'bg-orange-600 text-white border-orange-500',
  },
  critical: {
    id: 'critical',
    label: 'Critical',
    description: 'Immediate severe danger or emergency',
    badgeBg: 'bg-rose-100 border-rose-300',
    badgeText: 'text-rose-900',
    buttonActiveBg: 'bg-rose-600 text-white border-rose-500',
  },
};

export const SEVERITY_OPTIONS: SeverityInfo[] = [
  SEVERITY_CONFIG.low,
  SEVERITY_CONFIG.medium,
  SEVERITY_CONFIG.high,
  SEVERITY_CONFIG.critical,
];

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  addressPlaceholder?: string;
}

export interface StructuredLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  displayName?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface CivicIssue {
  id: string;
  title: string;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  severity: IssueSeverity;
  location: StructuredLocation;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
