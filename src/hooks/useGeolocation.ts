import { useState, useCallback, useRef } from 'react';
import type { StructuredLocation } from '../types/civic';
import { reverseGeocodingService } from '../services/reverseGeocoding';

export type GeolocationStatus =
  | 'idle'
  | 'requesting_permission'
  | 'locating'
  | 'coordinates_acquired'
  | 'resolving_address'
  | 'success'
  | 'permission_denied'
  | 'position_unavailable'
  | 'timeout'
  | 'address_lookup_failed';

export interface GeolocationDiagnostics {
  errorCode: number | null;
  errorMessage: string | null;
  isSecureContext: boolean;
  origin: string;
  hasGeolocation: boolean;
  attemptsCount: number;
}

export interface UseGeolocationState {
  status: GeolocationStatus;
  location: StructuredLocation | null;
  error: string | null;
  diagnostics: GeolocationDiagnostics;
}

export const useGeolocation = () => {
  const [state, setState] = useState<UseGeolocationState>({
    status: 'idle',
    location: null,
    error: null,
    diagnostics: {
      errorCode: null,
      errorMessage: null,
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      hasGeolocation: typeof navigator !== 'undefined' && 'geolocation' in navigator,
      attemptsCount: 0,
    },
  });

  const isRequestInProgress = useRef(false);

  const requestLocation = useCallback(() => {
    // Prevent duplicate simultaneous requests
    if (isRequestInProgress.current) return;

    const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    const isSecure = typeof window !== 'undefined' ? window.isSecureContext : false;
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

    if (!hasGeo) {
      setState((prev) => ({
        ...prev,
        status: 'position_unavailable',
        location: null,
        error: 'Location services are not supported by your browser.',
        diagnostics: {
          ...prev.diagnostics,
          errorCode: null,
          errorMessage: 'Geolocation API unsupported',
          hasGeolocation: false,
          attemptsCount: prev.diagnostics.attemptsCount + 1,
        },
      }));
      return;
    }

    isRequestInProgress.current = true;

    // Transition to requesting_permission / locating cleanly and clear stale error
    setState((prev) => ({
      ...prev,
      status: 'requesting_permission',
      error: null,
      diagnostics: {
        ...prev.diagnostics,
        errorCode: null,
        errorMessage: null,
        isSecureContext: isSecure,
        origin: currentOrigin,
        hasGeolocation: true,
        attemptsCount: prev.diagnostics.attemptsCount + 1,
      },
    }));

    // Start geolocation query
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        const initialLocation: StructuredLocation = {
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          formattedAddress: 'Location captured successfully',
        };

        setState((prev) => ({
          ...prev,
          status: 'resolving_address',
          location: initialLocation,
          error: null,
        }));

        let finalLocation = initialLocation;
        try {
          finalLocation = await reverseGeocodingService.reverseGeocode(lat, lng, acc);
        } catch {
          // Keep raw coordinates intact if address reverse geocoding fails
        }

        isRequestInProgress.current = false;

        setState((prev) => ({
          ...prev,
          status: 'success',
          location: finalLocation,
          error: null,
          diagnostics: {
            ...prev.diagnostics,
            errorCode: null,
            errorMessage: null,
          },
        }));
      },
      (geoError) => {
        isRequestInProgress.current = false;

        let mappedStatus: GeolocationStatus = 'position_unavailable';
        let mappedMessage = 'Your device could not determine its current location. Please try again.';

        // Map W3C GeolocationPositionError codes accurately
        if (geoError.code === 1) { // PERMISSION_DENIED
          mappedStatus = 'permission_denied';
          mappedMessage = 'Location access permission was denied. Please enable location access in browser settings.';
        } else if (geoError.code === 2) { // POSITION_UNAVAILABLE
          mappedStatus = 'position_unavailable';
          mappedMessage = 'Your device location is currently unavailable. Please ensure GPS/location is enabled.';
        } else if (geoError.code === 3) { // TIMEOUT
          mappedStatus = 'timeout';
          mappedMessage = 'Location detection timed out. Tap retry to acquire location.';
        }

        setState((prev) => ({
          ...prev,
          status: mappedStatus,
          error: mappedMessage,
          diagnostics: {
            ...prev.diagnostics,
            errorCode: geoError.code,
            errorMessage: geoError.message,
          },
        }));
      },
      {
        enableHighAccuracy: false, // Initial speed & reliability focus
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, []);

  return {
    ...state,
    isLoading:
      state.status === 'locating' ||
      state.status === 'resolving_address' ||
      state.status === 'requesting_permission',
    requestLocation,
  };
};
