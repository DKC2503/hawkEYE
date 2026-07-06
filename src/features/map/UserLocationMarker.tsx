import React from 'react';
import { Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { LocationCoordinates } from '../../types/civic';

interface UserLocationMarkerProps {
  coordinates: LocationCoordinates;
}

// Custom DivIcon for Pulsing User Location Dot in Light Mode
const userIcon = L.divIcon({
  className: 'custom-user-location-marker',
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <span class="absolute w-6 h-6 rounded-full bg-amber-500/40 animate-ping"></span>
      <span class="relative w-4 h-4 rounded-full bg-amber-600 border-2 border-white shadow-md"></span>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ coordinates }) => {
  const position: [number, number] = [coordinates.latitude, coordinates.longitude];

  return (
    <>
      <Marker position={position} icon={userIcon}>
        <Popup className="hawk-leaflet-popup">
          <div className="text-xs p-1">
            <strong className="text-amber-800 block font-bold">You Are Here</strong>
            <span className="text-slate-600 font-medium">
              {coordinates.latitude.toFixed(4)}°, {coordinates.longitude.toFixed(4)}°
            </span>
          </div>
        </Popup>
      </Marker>
      {coordinates.accuracy && coordinates.accuracy > 0 && (
        <Circle
          center={position}
          radius={coordinates.accuracy}
          pathOptions={{
            color: '#d97706',
            fillColor: '#d97706',
            fillOpacity: 0.1,
            weight: 1.5,
            dashArray: '4, 4',
          }}
        />
      )}
    </>
  );
};
