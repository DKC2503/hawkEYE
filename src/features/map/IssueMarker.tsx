import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { CivicIssue, IssueSeverity } from '../../types/civic';

interface IssueMarkerProps {
  issue: CivicIssue;
  isSelected?: boolean;
  onSelect: (issue: CivicIssue) => void;
}

const getSeverityColor = (severity: IssueSeverity) => {
  switch (severity) {
    case 'critical':
      return { bg: '#f43f5e', border: '#881337', text: '#fff' };
    case 'high':
      return { bg: '#f97316', border: '#7c2d12', text: '#fff' };
    case 'medium':
      return { bg: '#f59e0b', border: '#78350f', text: '#fff' };
    case 'low':
    default:
      return { bg: '#06b6d4', border: '#164e63', text: '#fff' };
  }
};

const createIssueIcon = (issue: CivicIssue, isSelected: boolean) => {
  const colors = getSeverityColor(issue.severity);
  const size = isSelected ? 32 : 24;
  const ring = isSelected ? 'ring-4 ring-cyan-400 scale-125 z-50' : '';

  return L.divIcon({
    className: 'custom-issue-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform ${ring}" style="width: ${size}px; height: ${size}px;">
        <div class="w-full h-full rounded-full flex items-center justify-center shadow-xl border-2" style="background-color: ${colors.bg}; border-color: ${colors.border};">
          <span style="color: ${colors.text}; font-size: 11px; font-weight: bold;">!</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export const IssueMarker: React.FC<IssueMarkerProps> = ({
  issue,
  isSelected = false,
  onSelect,
}) => {
  const position: [number, number] = [issue.location.latitude, issue.location.longitude];
  const icon = createIssueIcon(issue, isSelected);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onSelect(issue),
      }}
    >
      <Popup className="hawk-leaflet-popup">
        <div className="p-1 space-y-1">
          <strong className="text-white text-xs block font-bold">{issue.title}</strong>
          <span className="text-[11px] text-slate-300 capitalize block">
            Category: {issue.category.replace('_', ' ')} • Severity: {issue.severity}
          </span>
          <button
            onClick={() => onSelect(issue)}
            className="mt-1 text-[10px] text-cyan-400 hover:underline font-semibold"
          >
            View Issue Details &rarr;
          </button>
        </div>
      </Popup>
    </Marker>
  );
};
