import type { IssueCategory } from '../types/civic';

/**
 * Normalizes any category string from AI, backend, or legacy databases 
 * into a standardized lowercase IssueCategory.
 */
export function normalizeCategory(categoryStr: string | null | undefined): IssueCategory {
  if (!categoryStr) return 'other';
  
  const clean = categoryStr.trim().toLowerCase().replace(/_/g, ' ');
  
  if (clean.includes('pothole')) return 'pothole';
  if (clean.includes('road damage') || clean.includes('road') || clean.includes('crack') || clean.includes('asphalt')) {
    return 'road_damage';
  }
  if (clean.includes('garbage') || clean.includes('trash') || clean.includes('waste') || clean.includes('dump')) {
    return 'garbage';
  }
  if (clean.includes('streetlight') || clean.includes('lighting') || clean.includes('lamp') || clean.includes('electrical')) {
    return 'streetlight';
  }
  if (clean.includes('drainage') || clean.includes('gutter') || clean.includes('manhole') || clean.includes('drain') || clean.includes('sewer')) {
    return 'drainage';
  }
  if (clean.includes('water leak') || clean.includes('leak') || clean.includes('pipe') || clean.includes('water supply')) {
    return 'water_leak';
  }
  if (clean.includes('flood') || clean.includes('flooding') || clean.includes('submerged')) {
    return 'flooding';
  }
  if (clean.includes('infrastructure') || clean.includes('bench') || clean.includes('guardrail') || clean.includes('sign') || clean.includes('asset')) {
    return 'damaged_infrastructure';
  }
  if (clean.includes('traffic signal') || clean.includes('traffic light') || clean.includes('signal')) {
    return 'traffic_signal';
  }
  if (clean.includes('vandalism') || clean.includes('graffiti') || clean.includes('defaced')) {
    return 'vandalism';
  }
  
  return 'other';
}
