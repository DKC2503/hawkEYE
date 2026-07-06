import type { LocationCoordinates } from '../types/civic';

export interface SearchResult {
  id: string;
  displayName: string;
  coordinates: LocationCoordinates;
}

export interface GeocodingProvider {
  searchLocation(query: string): Promise<SearchResult[]>;
}

/**
 * Isolated Geocoding Service Architecture.
 * Future stages can plug in OpenStreetMap Nominatim or custom city ward GIS endpoints.
 */
class LocalGeocodingService implements GeocodingProvider {
  async searchLocation(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    // Isolated architecture stub ready for live Nominatim / City GIS API connection
    console.log(`[GeocodingService] Search query queued for stage integration: "${query}"`);
    return [];
  }
}

export const geocodingService = new LocalGeocodingService();
