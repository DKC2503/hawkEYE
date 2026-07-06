import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGeolocation } from '../../hooks/useGeolocation';
import { UserLocationMarker } from './UserLocationMarker';
import { IssueMarkerLayer } from './IssueMarkerLayer';
import { MapViewportController } from './MapViewportController';
import { MapSearchControl } from './MapSearchControl';
import { CategoryFilterChips } from './CategoryFilterChips';
import { MapLegend } from './MapLegend';
import { IssueDetailBottomSheet } from './IssueDetailBottomSheet';
import { DesktopIssuePanel } from './DesktopIssuePanel';
import type { CivicIssue, IssueCategory, StructuredLocation } from '../../types/civic';

interface HawkEyeMapProps {
  issues?: CivicIssue[];
}

// Neutral default fallback center (Center of India / Default City View)
const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

export const HawkEyeMap: React.FC<HawkEyeMapProps> = ({ issues = [] }) => {
  const { location, isLoading, status, requestLocation } = useGeolocation();
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | 'all'>('all');
  const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
  const [targetViewport, setTargetViewport] = useState<StructuredLocation | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // When location arrives, fly viewport to user position
  useEffect(() => {
    if (location) {
      setTargetViewport(location);
    }
  }, [location]);

  const handleLocateMe = () => {
    if (location) {
      setTargetViewport({ ...location });
    } else {
      requestLocation();
    }
  };

  const initialCenter = location
    ? ([location.latitude, location.longitude] as [number, number])
    : DEFAULT_CENTER;

  const initialZoom = location ? 14 : DEFAULT_ZOOM;

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[520px] rounded-3xl overflow-hidden glass-surface border-slate-200/80 flex flex-col md:flex-row shadow-sm">
      {/* Real Leaflet Map Workspace */}
      <div className="relative flex-1 w-full h-full min-h-[350px]">
        {/* Floating Top Search & Filter Bar */}
        <div className="absolute top-4 left-4 right-4 z-[400] space-y-2.5 pointer-events-auto">
          <MapSearchControl onLocateMe={handleLocateMe} />
          <CategoryFilterChips
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Non-blocking Geolocation Feedback Banner */}
          {isLoading && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-elevated text-xs text-slate-800 border-slate-200 bg-white/90">
              <svg className="w-4 h-4 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Acquiring location...</span>
            </div>
          )}

          {status === 'permission_denied' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-elevated text-xs text-amber-900 border-amber-300/80 bg-amber-50/90 font-medium">
              <span>Location access denied • Showing regional map view</span>
            </div>
          )}
        </div>

        {/* Floating Bottom Left Legend (Collapsible on Mobile) */}
        <div className="absolute bottom-4 left-4 z-[400] pointer-events-auto max-w-xs">
          <div className="sm:hidden mb-1">
            <button
              onClick={() => setIsLegendOpen(!isLegendOpen)}
              className="px-3 py-1.5 rounded-xl glass-elevated text-xs text-slate-800 font-semibold flex items-center gap-1.5 focus-ring shadow-sm bg-white/90"
            >
              <span>{isLegendOpen ? 'Hide Legend' : 'Map Legend'}</span>
            </button>
          </div>
          <div className={`${isLegendOpen ? 'block' : 'hidden'} sm:block`}>
            <MapLegend />
          </div>
        </div>

        {/* Leaflet React Map Component */}
        <MapContainer
          center={initialCenter}
          zoom={initialZoom}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          touchZoom={true}
          className="w-full h-full z-0 bg-[#f4efe9]"
        >
          {/* Zoom Control at Bottom Right */}
          <ZoomControl position="bottomright" />

          {/* OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Map Viewport Animation Controller */}
          <MapViewportController targetLocation={targetViewport} zoom={15} />

          {/* User GPS Location Marker */}
          {location && <UserLocationMarker coordinates={location} />}

          {/* Future Issue Pins Layer */}
          <IssueMarkerLayer
            issues={issues}
            selectedCategory={selectedCategory}
            selectedIssueId={selectedIssue?.id}
            onSelectIssue={(iss) => setSelectedIssue(iss)}
          />
        </MapContainer>
      </div>

      {/* Desktop Side Panel View for Selected Issue */}
      {selectedIssue && (
        <DesktopIssuePanel
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}

      {/* Mobile Bottom Sheet View for Selected Issue */}
      <IssueDetailBottomSheet
        issue={selectedIssue}
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
      />
    </div>
  );
};
