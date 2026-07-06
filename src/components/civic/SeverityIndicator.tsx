import React from 'react';
import type { IssueSeverity } from '../../types/civic';

interface SeverityIndicatorProps {
  severity: IssueSeverity;
  showLabel?: boolean;
}

export const SeverityIndicator: React.FC<SeverityIndicatorProps> = ({
  severity,
  showLabel = true,
}) => {
  const severityConfig: Record<IssueSeverity, { label: string; color: string; bg: string }> = {
    low: { label: 'Low Severity', color: 'text-slate-600', bg: 'bg-slate-400' },
    medium: { label: 'Medium Severity', color: 'text-amber-800', bg: 'bg-amber-500' },
    high: { label: 'High Severity', color: 'text-orange-800', bg: 'bg-orange-600' },
    critical: { label: 'Critical Severity', color: 'text-rose-800', bg: 'bg-rose-600' },
  };

  const config = severityConfig[severity] || severityConfig.medium;

  return (
    <div className="inline-flex items-center gap-1.5 text-xs">
      <span className={`w-2 h-2 rounded-full ${config.bg}`} />
      {showLabel && <span className={`font-semibold ${config.color}`}>{config.label}</span>}
    </div>
  );
};
