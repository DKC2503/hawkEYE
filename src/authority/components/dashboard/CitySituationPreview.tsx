import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { AuthorityIssueInspectionItem } from '../../types/authority';
import { normalizeReportStatus } from '../../../utils/statusNormalizer';

interface CitySituationPreviewProps {
  issues?: AuthorityIssueInspectionItem[];
}

const createMiniIcon = (severity: string, isCompleted: boolean) => {
  let color = 'bg-amber-500';
  if (isCompleted) {
    color = 'bg-emerald-500';
  } else if (severity === 'critical') {
    color = 'bg-rose-500';
  } else if (severity === 'high') {
    color = 'bg-orange-500';
  } else if (severity === 'low') {
    color = 'bg-slate-500';
  }

  return L.divIcon({
    className: 'custom-mini-icon',
    html: `
      <span class="relative flex h-2.5 w-2.5">
        ${severity === 'critical' && !isCompleted ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75"></span>` : ''}
        <span class="relative inline-flex rounded-full h-2.5 w-2.5 ${color} border border-slate-950"></span>
      </span>
    `,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
};

export const CitySituationPreview: React.FC<CitySituationPreviewProps> = ({ issues = [] }) => {
  // Active incident pins only (excluding completed & dismissed)
  const activePins = issues.filter((i) => {
    if (!i.location || typeof i.location.latitude !== 'number' || typeof i.location.longitude !== 'number' || i.location.latitude === 0 || i.isDeleted) {
      return false;
    }
    const statusNorm = normalizeReportStatus(i.status);
    return ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'].includes(statusNorm);
  });

  return (
    <div className="auth-glass-surface rounded-2xl p-6 space-y-4 border border-slate-800/80">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100">City Situation Map Preview</h3>
          <p className="text-xs text-slate-400">Live regional incident concentration across municipal zones</p>
        </div>
        <NavLink
          to="/authority/map"
          className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          <span>Open Full Map</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
          </svg>
        </NavLink>
      </div>

      {/* Mini Leaflet Map */}
      <div className="h-44 rounded-xl border border-slate-800 overflow-hidden relative z-10">
        <MapContainer
          center={[17.6868, 83.2185]}
          zoom={10}
          zoomControl={false}
          dragging={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          className="w-full h-full bg-[#080b12]"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {activePins.map((issue) => {
            const statusNorm = normalizeReportStatus(issue.status);
            const isCompleted = statusNorm === 'COMPLETED';
            const icon = createMiniIcon(issue.severity, isCompleted);
            return (
              <Marker
                key={issue.id}
                position={[issue.location.latitude, issue.location.longitude]}
                icon={icon}
              />
            );
          })}
        </MapContainer>

        <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 z-[1000] pointer-events-none select-none">
          Visakhapatnam Command Zone • {activePins.length} Active Incident Marker{activePins.length === 1 ? '' : 's'}
        </div>
      </div>
    </div>
  );
};
