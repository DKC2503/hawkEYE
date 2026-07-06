import React from 'react';
import { GlassSurface } from '../../components/ui/GlassSurface';
import { GlassButton } from '../../components/ui/GlassButton';
import type { StructuredLocation } from '../../types/civic';
import type { GeolocationStatus, GeolocationDiagnostics } from '../../hooks/useGeolocation';

interface IssueLocationCaptureProps {
  location: StructuredLocation | null;
  status: GeolocationStatus;
  errorMessage?: string | null;
  diagnostics?: GeolocationDiagnostics;
  onLocateMe: () => void;
  onNext: () => void;
  onBack: () => void;
}

export const IssueLocationCapture: React.FC<IssueLocationCaptureProps> = ({
  location,
  status,
  onLocateMe,
  onNext,
  onBack,
}) => {
  const isDev = import.meta.env.DEV;
  const isLocating = status === 'locating' || status === 'resolving_address' || status === 'requesting_permission';
  const isSuccess = (status === 'success' || status === 'coordinates_acquired') && location !== null;
  const isError = status === 'permission_denied' || status === 'position_unavailable' || status === 'timeout' || status === 'address_lookup_failed';

  return (
    <GlassSurface variant="surface" rounded="3xl" className="p-6 sm:p-8 space-y-6 border-slate-200/80">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-slate-900">Step 2: Detect Issue Location</h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Acquire location details to help municipal teams route and dispatch response crews.
        </p>
      </div>

      {/* Main Location Display Card */}
      <GlassSurface variant="subtle" rounded="2xl" className="p-6 text-center space-y-4 border-slate-200/80 bg-white/70">
        <div className="w-14 h-14 rounded-2xl glass-elevated text-amber-700 flex items-center justify-center mx-auto shadow-sm border border-slate-200/80">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {status === 'idle' && !isSuccess && (
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">Add Issue Location</h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Use your current location to help municipal teams find and respond to the issue.
            </p>
          </div>
        )}

        {isLocating && (
          <div className="space-y-2 p-2">
            <div className="flex items-center justify-center gap-2 text-amber-800">
              <svg className="w-5 h-5 animate-spin text-amber-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm font-bold">
                {status === 'resolving_address' ? 'Resolving area details...' : 'Getting your location...'}
              </span>
            </div>
            <p className="text-xs text-slate-500">Communicating with device GPS locator</p>
          </div>
        )}

        {isSuccess && location && (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Location Detected</span>
            </div>

            {/* Citizen-Facing Area Display */}
            <div className="space-y-1">
              {location.area ? (
                <>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">{location.area}</h4>
                  <p className="text-xs font-semibold text-slate-600">
                    {[location.city, location.state].filter(Boolean).join(', ')}
                  </p>
                </>
              ) : location.city ? (
                <>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">{location.city}</h4>
                  <p className="text-xs font-semibold text-slate-600">{location.state || location.country}</p>
                </>
              ) : (
                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  {location.formattedAddress || 'Location Captured Successfully'}
                </h4>
              )}
            </div>

            {location.accuracy && (
              <p className="text-[11px] text-slate-400 font-medium">
                Accuracy: Within ±{Math.round(location.accuracy)} meters
              </p>
            )}

            {/* Dev Diagnostics view for exact coordinates */}
            {isDev && (
              <details className="mt-2 text-left bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600">
                <summary className="cursor-pointer font-bold text-slate-700 select-none">
                  Dev Technical Coordinates
                </summary>
                <div className="mt-1 space-y-0.5">
                  <div>Latitude: {location.latitude}</div>
                  <div>Longitude: {location.longitude}</div>
                  <div>Raw Address: {location.displayName || 'N/A'}</div>
                </div>
              </details>
            )}
          </div>
        )}

        {isError && (
          <div className="space-y-2 text-rose-800">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-rose-900">Location Access Needed</h4>
            <p className="text-xs text-slate-700 max-w-sm mx-auto font-medium leading-relaxed">
              Allow location access in your browser settings, or choose the location manually on the map.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-center">
          <GlassButton
            variant={isSuccess ? 'secondary' : 'accent'}
            size="md"
            onClick={onLocateMe}
            disabled={isLocating}
            leftIcon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            }
          >
            {isSuccess ? 'Update Location' : isLocating ? 'Getting your location...' : 'Use My Current Location'}
          </GlassButton>
        </div>
      </GlassSurface>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-2">
        <GlassButton variant="secondary" size="md" fullWidth onClick={onBack}>
          &larr; Back
        </GlassButton>
        <GlassButton variant="primary" size="md" fullWidth onClick={onNext}>
          Continue to AI Review &rarr;
        </GlassButton>
      </div>
    </GlassSurface>
  );
};
