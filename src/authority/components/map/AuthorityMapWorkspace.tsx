import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { AuthorityIssueInspectionItem } from '../../types/authority';
import { AuthorityMapFilters, type MapOperationalMode } from './AuthorityMapFilters';
import { AuthorityMapLegend } from './AuthorityMapLegend';
import { normalizeReportStatus } from '../../../utils/statusNormalizer';

interface AuthorityMapWorkspaceProps {
  issues: AuthorityIssueInspectionItem[];
  onSelectIssue: (issue: AuthorityIssueInspectionItem) => void;
}

// -------------------------------------------------------------------------
// Leaflet Custom Icons Helpers
// -------------------------------------------------------------------------
const createMarkerIcon = (severity: string, isCompleted: boolean, ticketId: string) => {
  let colorClass = 'bg-amber-500 border-amber-400 text-amber-300';
  let pingClass = '';

  if (isCompleted) {
    colorClass = 'bg-emerald-500 border-emerald-400 text-emerald-300';
  } else if (severity === 'critical') {
    colorClass = 'bg-rose-500 border-rose-400 text-rose-300';
    pingClass = '<span class="absolute -inset-1 rounded-full bg-rose-500/40 animate-ping"></span>';
  } else if (severity === 'high') {
    colorClass = 'bg-orange-500 border-orange-400 text-orange-300';
  } else if (severity === 'low') {
    colorClass = 'bg-slate-500 border-slate-400 text-slate-300';
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/95 border border-slate-800 text-[10px] font-mono font-bold shadow-lg transition-transform hover:scale-105">
        ${pingClass}
        <span class="w-2.5 h-2.5 rounded-full ${colorClass.split(' ')[0]}"></span>
        <span class="text-slate-200">${ticketId}</span>
      </div>
    `,
    iconSize: [90, 26],
    iconAnchor: [45, 13],
    popupAnchor: [0, -12],
  });
};

const createClusterIcon = (cluster: L.MarkerCluster, isCompletedMode: boolean) => {
  const count = cluster.getChildCount();
  const bgClass = isCompletedMode
    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-emerald-500/20'
    : 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-amber-500/20';

  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full border font-mono font-extrabold text-xs shadow-lg backdrop-blur-sm ${bgClass}">
        ${count}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// -------------------------------------------------------------------------
// Component: MapController (Manages Viewports & Bounds)
// -------------------------------------------------------------------------
const MapController: React.FC<{ issues: AuthorityIssueInspectionItem[] }> = ({ issues }) => {
  const map = useMap();

  useEffect(() => {
    if (issues.length === 0) {
      map.setView([17.6868, 83.2185], 12);
      return;
    }

    const validCoordinates = issues
      .filter(
        (iss) =>
          iss.location &&
          typeof iss.location.latitude === 'number' &&
          typeof iss.location.longitude === 'number' &&
          iss.location.latitude !== 0
      )
      .map((iss) => [iss.location.latitude, iss.location.longitude] as [number, number]);

    if (validCoordinates.length === 0) {
      map.setView([17.6868, 83.2185], 12);
      return;
    }

    if (validCoordinates.length === 1) {
      map.setView(validCoordinates[0], 14);
    } else {
      const bounds = L.latLngBounds(validCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [issues, map]);

  return null;
};

// -------------------------------------------------------------------------
// Component: MarkerClusterLayer (Leaflet MarkerCluster Integration)
// -------------------------------------------------------------------------
const MarkerClusterLayer: React.FC<{
  issues: AuthorityIssueInspectionItem[];
  mapMode: MapOperationalMode;
  onSelectIssue: (issue: AuthorityIssueInspectionItem) => void;
}> = ({ issues, mapMode, onSelectIssue }) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // Teardown previous cluster group to avoid stale layers
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    const isCompletedMode = mapMode === 'completed';

    clusterGroupRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => createClusterIcon(cluster, isCompletedMode),
    });

    map.addLayer(clusterGroupRef.current);
    const clusterGroup = clusterGroupRef.current;

    issues.forEach((issue) => {
      if (
        !issue.location ||
        typeof issue.location.latitude !== 'number' ||
        typeof issue.location.longitude !== 'number' ||
        issue.location.latitude === 0 ||
        issue.location.longitude === 0
      ) {
        return;
      }

      const statusNorm = normalizeReportStatus(issue.status);
      const isCompleted = statusNorm === 'COMPLETED';
      const icon = createMarkerIcon(issue.severity, isCompleted, issue.ticketId);
      const marker = L.marker([issue.location.latitude, issue.location.longitude], { icon });

      // Create dark-themed popup
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 space-y-2';

      const imageHtml = issue.imageUrl
        ? `<img src="${issue.imageUrl}" class="w-full h-24 object-cover rounded-lg border border-slate-800 bg-slate-950 mb-1.5" alt="Evidence" />`
        : '<div class="h-24 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center text-[10px] text-slate-500 font-mono mb-1.5">No Image Attached</div>';

      let statusColor = 'bg-slate-800 text-slate-300';
      if (statusNorm === 'SUBMITTED') statusColor = 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      else if (statusNorm === 'ACCEPTED') statusColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      else if (statusNorm === 'ASSIGNED' || statusNorm === 'IN_PROGRESS') statusColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30';
      else if (statusNorm === 'AWAITING_VERIFICATION') statusColor = 'bg-purple-500/10 text-purple-300 border border-purple-500/30';
      else if (statusNorm === 'COMPLETED') statusColor = 'bg-emerald-500 text-slate-950 font-bold';
      else if (statusNorm === 'DISMISSED') statusColor = 'bg-rose-500/10 text-rose-400 border border-rose-500/30';

      let severityColor = 'text-amber-400';
      if (issue.severity === 'critical') severityColor = 'text-rose-400';
      else if (issue.severity === 'high') severityColor = 'text-orange-400';
      else if (issue.severity === 'low') severityColor = 'text-slate-400';

      popupDiv.innerHTML = `
        <div class="space-y-1 font-sans text-xs">
          <div class="flex items-center justify-between gap-4">
            <span class="font-mono font-bold text-amber-400 text-xs">${issue.ticketId}</span>
            <span class="px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${statusColor}">${issue.status}</span>
          </div>
          
          ${imageHtml}

          <div class="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 border-b border-slate-800 pb-1.5 mb-1.5">
            <div>Category: <span class="text-slate-200 capitalize">${issue.category}</span></div>
            <div>Severity: <span class="${severityColor} font-bold uppercase">${issue.severity}</span></div>
          </div>

          <p class="text-slate-200 line-clamp-2 text-[11px] font-medium leading-relaxed">${issue.aiAnalysis?.summary || issue.description}</p>
          
          <div class="text-[9px] font-mono text-slate-500 pt-1.5 flex justify-between">
            <span>By: ${(issue.reporter?.uid || 'anon').substring(0, 8)}...</span>
            <span>${issue.reporter?.submittedAt ? new Date(issue.reporter.submittedAt).toLocaleDateString() : 'Recorded'}</span>
          </div>

          <div class="pt-2.5">
            <a href="/authority/reports?ticketId=${issue.ticketId}" class="block text-center w-full px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all shadow-md">
              Inspect Full Report
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupDiv);
      marker.on('click', () => onSelectIssue(issue));
      clusterGroup.addLayer(marker);
    });

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [issues, mapMode, map, onSelectIssue]);

  return null;
};

// -------------------------------------------------------------------------
// Main Component: AuthorityMapWorkspace
// -------------------------------------------------------------------------
export const AuthorityMapWorkspace: React.FC<AuthorityMapWorkspaceProps> = ({
  issues,
  onSelectIssue,
}) => {
  const [mapMode, setMapMode] = useState<MapOperationalMode>('active');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Derive counts from single authoritative issues list
  const activeCount = useMemo(() => {
    return issues.filter((iss) => {
      if (iss.isDeleted) return false;
      const statusNorm = normalizeReportStatus(iss.status);
      return ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'].includes(statusNorm);
    }).length;
  }, [issues]);

  const completedCount = useMemo(() => {
    return issues.filter((iss) => {
      if (iss.isDeleted) return false;
      const statusNorm = normalizeReportStatus(iss.status);
      return statusNorm === 'COMPLETED';
    }).length;
  }, [issues]);

  // Derive visible issues strictly based on mapMode and category
  const visibleIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (iss.isDeleted) return false;

      const matchesCategory = selectedCategory === 'all' ? true : iss.category === selectedCategory;
      if (!matchesCategory) return false;

      const statusNorm = normalizeReportStatus(iss.status);

      if (mapMode === 'active') {
        return ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'].includes(statusNorm);
      }

      if (mapMode === 'completed') {
        return statusNorm === 'COMPLETED';
      }

      return false;
    });
  }, [issues, mapMode, selectedCategory]);

  return (
    <div className="relative w-full h-[calc(100vh-160px)] min-h-[520px] rounded-3xl overflow-hidden auth-glass-surface border border-slate-800 flex flex-col shadow-2xl">
      {/* Top Floating Filters Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] space-y-2 pointer-events-auto max-w-3xl">
        <AuthorityMapFilters
          mapMode={mapMode}
          onSelectMapMode={setMapMode}
          activeCount={activeCount}
          completedCount={completedCount}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Floating Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto max-w-xs hidden sm:block">
        <AuthorityMapLegend />
      </div>

      {/* Real Interactive Leaflet Map */}
      <div className="relative flex-1 w-full h-full bg-[#080a10] overflow-hidden z-10">
        {/* Real Marker Count Badge */}
        <div className="absolute top-20 right-4 sm:top-4 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono font-bold z-[1000] pointer-events-none select-none shadow-lg flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${mapMode === 'active' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          <span className={mapMode === 'active' ? 'text-amber-400' : 'text-emerald-400'}>
            {visibleIssues.length} {mapMode === 'active' ? 'Active Incident' : 'Verified Completed'} Marker{visibleIssues.length === 1 ? '' : 's'}
          </span>
        </div>

        <MapContainer
          center={[17.6868, 83.2185]}
          zoom={12}
          zoomControl={true}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <MarkerClusterLayer
            issues={visibleIssues}
            mapMode={mapMode}
            onSelectIssue={onSelectIssue}
          />

          <MapController issues={visibleIssues} />
        </MapContainer>
      </div>
    </div>
  );
};
