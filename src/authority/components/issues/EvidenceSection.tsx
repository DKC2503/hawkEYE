import React from 'react';
import type { AuthorityIssueInspectionItem } from '../../types/authority';

interface EvidenceSectionProps {
  issue: AuthorityIssueInspectionItem;
}

export const EvidenceSection: React.FC<EvidenceSectionProps> = ({ issue }) => {
  return (
    <div className="space-y-3 p-4 rounded-xl auth-glass-subtle border border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Citizen Evidence Photo & Metadata
        </span>
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
          Cloudinary Hosted
        </span>
      </div>

      {issue.imageUrl ? (
        <div className="relative group overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
          <img
            src={issue.imageUrl}
            alt={issue.ticketId}
            className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur p-2 rounded-lg text-[11px] font-mono text-slate-300 flex items-center justify-between border border-slate-800">
            <span>Dimensions: 800x600</span>
            <span>Format: JPG</span>
          </div>
        </div>
      ) : (
        <div className="h-44 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
          No Photographic Evidence Attached
        </div>
      )}

      {/* Geolocation Details */}
      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
        <div className="flex items-center justify-between text-slate-300">
          <span className="font-semibold">{issue.location.displayName || issue.location.area}</span>
          <span className="font-mono text-[11px] text-slate-400">±{issue.location.accuracy || 10}m GPS</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Lat: {issue.location.latitude} | Lng: {issue.location.longitude}
        </div>
      </div>
    </div>
  );
};
