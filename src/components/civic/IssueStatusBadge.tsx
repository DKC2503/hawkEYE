import React from 'react';
import type { IssueStatus } from '../../types/civic';

interface IssueStatusBadgeProps {
  status: IssueStatus;
  size?: 'sm' | 'md';
}

export const IssueStatusBadge: React.FC<IssueStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const statusConfig: Record<IssueStatus, { label: string; bg: string; text: string; border: string }> = {
    Submitted: {
      label: 'Submitted',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
    },
    Verified: {
      label: 'Verified',
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200',
    },
    Assigned: {
      label: 'Assigned',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
    },
    'In Progress': {
      label: 'In Progress',
      bg: 'bg-sky-50',
      text: 'text-sky-800',
      border: 'border-sky-200',
    },
    Resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
    },
  };

  const config = statusConfig[status] || statusConfig.Submitted;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${sizeClasses} ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.text.replace('text-', 'bg-')}`} />
      <span>{config.label}</span>
    </span>
  );
};
