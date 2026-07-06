import type { StructuredLocation } from '../types/civic';

// In-memory cache to prevent repeated reverse geocoding requests for identical coordinates
const geocodeCache = new Map<string, StructuredLocation>();

export class ReverseGeocodingService {
  async reverseGeocode(
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<StructuredLocation> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

    if (geocodeCache.has(cacheKey)) {
      const cached = geocodeCache.get(cacheKey)!;
      return { ...cached, accuracy };
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'hawkEYE-Civic-App/1.0 (citizen-issue-reporting)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding HTTP ${response.status}`);
      }

      const data = await response.json();
      const addr = data.address || {};

      // Area / neighbourhood extraction hierarchy
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.village ||
        addr.subdistrict ||
        addr.road ||
        '';

      // City extraction hierarchy
      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.county ||
        addr.state_district ||
        '';

      // State & Country
      const state = addr.state || '';
      const country = addr.country || '';
      const postalCode = addr.postcode || '';

      // Format citizen-facing primary area string
      let formattedAddress = 'Location captured successfully';

      if (area && city) {
        formattedAddress = `${area}, ${city}`;
      } else if (city && state) {
        formattedAddress = `${city}, ${state}`;
      } else if (area && state) {
        formattedAddress = `${area}, ${state}`;
      } else if (data.display_name) {
        // Shorten long OSM display names to first 3 comma parts
        formattedAddress = data.display_name.split(',').slice(0, 3).join(',').trim();
      }

      const structuredResult: StructuredLocation = {
        latitude,
        longitude,
        accuracy,
        displayName: data.display_name || formattedAddress,
        area: area || undefined,
        city: city || undefined,
        state: state || undefined,
        country: country || undefined,
        postalCode: postalCode || undefined,
        formattedAddress,
      };

      geocodeCache.set(cacheKey, structuredResult);
      return structuredResult;
    } catch (error) {
      // Reverse geocoding failure fallback: keep valid lat/lng intact!
      console.warn('Reverse geocoding unavailable, using coordinate fallback:', error);
      return {
        latitude,
        longitude,
        accuracy,
        formattedAddress: 'Location captured successfully',
      };
    }
  }
}

export const reverseGeocodingService = new ReverseGeocodingService();
