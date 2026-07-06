import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { LocationCoordinates } from '../../types/civic';

interface MapViewportControllerProps {
  targetLocation: LocationCoordinates | null;
  zoom?: number;
}

export const MapViewportController: React.FC<MapViewportControllerProps> = ({
  targetLocation,
  zoom = 15,
}) => {
  const map = useMap();

  useEffect(() => {
    if (targetLocation) {
      map.flyTo([targetLocation.latitude, targetLocation.longitude], zoom, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [targetLocation, zoom, map]);

  return null;
};
