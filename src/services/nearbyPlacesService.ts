/**
 * Real Nearby Healthcare Places Service using OpenStreetMap (Overpass API)
 * 
 * Complies strictly with project requirements:
 * 1. Real data from OpenStreetMap — zero invented facilities, zero invented phone numbers, zero invented hours.
 * 2. Privacy-first: coordinates sent to Overpass servers are strictly rounded to 2 decimals (~1 km) and nothing else.
 * 3. 10-second timeout, one fallback mirror retry, friendly error on failure.
 * 4. 24-hour local caching in AsyncStorage keyed by rounded coordinates.
 * 5. Hospital emergency department flagged ONLY when tagged emergency=yes.
 * 6. Stock status is always "Stock unknown. Call to check." — never invented.
 * 7. Clear attribution: "© OpenStreetMap contributors".
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NEARBY_PLACES_CACHE_STORAGE_KEY } from '../constants/storageKeys';
import { calculateDistanceKm } from './locationService';

export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

export const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

export const OVERPASS_USER_AGENT =
  'MedFind-App/1.0 (https://github.com/vivaswanshetty/MedFind; medical-app)';

export const NEARBY_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type NearbyPlaceType = 'pharmacy' | 'hospital' | 'clinic';

export interface NearbyPlace {
  id: string;
  name: string;
  type: NearbyPlaceType;
  address: string | null;
  phone: string | null;
  website: string | null;
  openingHours: string | null; // Raw text labelled "from OpenStreetMap, may be out of date"
  coordinates: {
    latitude: number;
    longitude: number;
  };
  hasEmergencyDepartment: boolean; // Only true if type === 'hospital' and tags.emergency === 'yes'
  distanceKm?: number | null;
}

export interface CachedPlacesEntry {
  timestamp: number;
  places: NearbyPlace[];
}

export interface NearbyPlacesCache {
  [coordKey: string]: CachedPlacesEntry;
}

// Module-level mock hook for test suites
let mockFetchFn: typeof fetch | null = null;

export function setMockOverpassFetch(mock: typeof fetch | null): void {
  mockFetchFn = mock;
}

/**
 * Rounds coordinates to 2 decimal places (approx. 1.1 km accuracy) for privacy.
 */
export function roundCoordinates(lat: number, lon: number): { latitude: number; longitude: number } {
  return {
    latitude: Math.round(lat * 100) / 100,
    longitude: Math.round(lon * 100) / 100,
  };
}

/**
 * Generates an Overpass QL query string with the given radius and rounded coordinates.
 */
export function buildOverpassQuery(
  lat: number,
  lon: number,
  radiusMeters: number,
  types?: NearbyPlaceType[]
): string {
  const rounded = roundCoordinates(lat, lon);
  const roundedLat = rounded.latitude.toFixed(2);
  const roundedLon = rounded.longitude.toFixed(2);
  const requested = types || ['pharmacy', 'hospital', 'clinic'];

  const queryParts: string[] = [];
  if (requested.includes('pharmacy')) {
    queryParts.push(`nwr["amenity"="pharmacy"](around:${radiusMeters},${roundedLat},${roundedLon});`);
  }
  if (requested.includes('hospital')) {
    queryParts.push(`nwr["amenity"="hospital"](around:${radiusMeters},${roundedLat},${roundedLon});`);
  }
  if (requested.includes('clinic')) {
    queryParts.push(`nwr["amenity"="clinic"](around:${radiusMeters},${roundedLat},${roundedLon});`);
    queryParts.push(`nwr["healthcare"="clinic"](around:${radiusMeters},${roundedLat},${roundedLon});`);
  }

  return `[out:json][timeout:10];
(
  ${queryParts.join('\n  ')}
);
out center tags;`;
}

/**
 * Formats a clean human-readable address from OSM addr:* tags.
 */
export function formatOsmAddress(tags: Record<string, string | undefined>): string | null {
  if (tags['addr:full']) {
    return tags['addr:full'].trim();
  }
  const streetParts = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const locality = tags['addr:suburb'] || tags['addr:district'] || tags['addr:neighbourhood'];
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || tags['addr:municipality'];
  const postcode = tags['addr:postcode'];

  const parts = [streetParts, locality, city, postcode].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return null;
}

/**
 * Parses raw Overpass elements into typed NearbyPlace objects.
 */
export function parseOsmElements(
  elements: any[],
  userLocation?: { latitude: number; longitude: number }
): NearbyPlace[] {
  if (!Array.isArray(elements)) {
    return [];
  }

  const places: NearbyPlace[] = [];
  const seenIds = new Set<string>();

  for (const el of elements) {
    if (!el || typeof el !== 'object') continue;
    const tags: Record<string, string | undefined> = el.tags || {};

    const elementId = `osm-${el.type || 'node'}-${el.id}`;
    if (seenIds.has(elementId)) continue;
    seenIds.add(elementId);

    // Determine type
    let type: NearbyPlaceType | null = null;
    if (tags.amenity === 'pharmacy') {
      type = 'pharmacy';
    } else if (tags.amenity === 'hospital') {
      type = 'hospital';
    } else if (tags.amenity === 'clinic' || tags.healthcare === 'clinic') {
      type = 'clinic';
    }

    if (!type) continue;

    // Determine coordinates (node has lat/lon, way/relation has center.lat/center.lon)
    const lat = typeof el.lat === 'number' ? el.lat : el.center?.lat;
    const lon = typeof el.lon === 'number' ? el.lon : el.center?.lon;
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      continue;
    }

    // Name (fallback to facility type if unnamed)
    const defaultName =
      type === 'pharmacy' ? 'Pharmacy' : type === 'hospital' ? 'Hospital' : 'Clinic';
    const name = tags.name || tags['name:en'] || defaultName;

    // Address
    const address = formatOsmAddress(tags);

    // Phone (never invent phone numbers)
    const phone = tags.phone || tags['contact:phone'] || null;

    // Website
    const website = tags.website || tags['contact:website'] || null;

    // Opening hours (raw text, never invent or parse)
    const openingHours = tags.opening_hours || null;

    // Emergency department: only if hospital AND emergency=yes
    const hasEmergencyDepartment = type === 'hospital' && tags.emergency === 'yes';

    // Distance calculation relative to user coordinates
    const distanceKm = userLocation
      ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lon)
      : null;

    places.push({
      id: elementId,
      name,
      type,
      address,
      phone,
      website,
      openingHours,
      coordinates: { latitude: lat, longitude: lon },
      hasEmergencyDepartment,
      distanceKm,
    });
  }

  // Sort closest first when distance is available
  places.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm;
    }
    return 0;
  });

  return places;
}

/**
 * Retrieve cached nearby places for the given coordinates from AsyncStorage.
 */
export async function getCachedNearbyPlaces(
  lat: number,
  lon: number
): Promise<NearbyPlace[] | null> {
  try {
    const raw = await AsyncStorage.getItem(NEARBY_PLACES_CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cache: NearbyPlacesCache = JSON.parse(raw);
    const rounded = roundCoordinates(lat, lon);
    const key = `${rounded.latitude.toFixed(2)},${rounded.longitude.toFixed(2)}`;
    const entry = cache[key];
    if (!entry) return null;
    const isExpired = Date.now() - entry.timestamp > NEARBY_CACHE_TTL_MS;
    if (isExpired) return null;
    return entry.places;
  } catch {
    return null;
  }
}

/**
 * Save nearby places to the 24-hour cache in AsyncStorage.
 */
export async function setCachedNearbyPlaces(
  lat: number,
  lon: number,
  places: NearbyPlace[]
): Promise<void> {
  try {
    let cache: NearbyPlacesCache = {};
    const raw = await AsyncStorage.getItem(NEARBY_PLACES_CACHE_STORAGE_KEY);
    if (raw) {
      try {
        cache = JSON.parse(raw);
      } catch {
        cache = {};
      }
    }
    const rounded = roundCoordinates(lat, lon);
    const key = `${rounded.latitude.toFixed(2)},${rounded.longitude.toFixed(2)}`;
    cache[key] = {
      timestamp: Date.now(),
      places,
    };
    await AsyncStorage.setItem(NEARBY_PLACES_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Gracefully ignore cache writing errors
  }
}

/**
 * Clears the nearby places cache from AsyncStorage.
 */
export async function clearNearbyPlacesCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NEARBY_PLACES_CACHE_STORAGE_KEY);
  } catch {
    // Gracefully ignore
  }
}

/**
 * Executes an Overpass query with a 10s timeout and automatic single retry on the fallback mirror.
 */
async function executeOverpassRequest(
  query: string,
  fetchFn: typeof fetch
): Promise<any> {
  const timeoutMs = 10000; // 10-second timeout

  for (let i = 0; i < OVERPASS_SERVERS.length; i++) {
    const serverUrl = OVERPASS_SERVERS[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': OVERPASS_USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Overpass server returned HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!json || !Array.isArray(json.elements)) {
        throw new Error('Malformed Overpass response: missing elements array');
      }

      return json;
    } catch {
      clearTimeout(timeoutId);
      // If primary failed, loop continues to fallback mirror
    }
  }

  // If both servers fail, throw friendly user-facing error
  throw new Error(
    'Unable to load nearby places from OpenStreetMap. Please check your connection and try again.'
  );
}

export interface FetchNearbyOptions {
  bypassCache?: boolean;
  fetchFn?: typeof fetch;
  types?: NearbyPlaceType[];
}

/**
 * Queries pharmacies, hospitals, and clinics within 3 km of the user's approximate location,
 * widening to 10 km if fewer than 5 results are returned. Caps at 40 results.
 */
export async function getNearbyPlaces(
  coords: { latitude: number; longitude: number },
  options?: FetchNearbyOptions
): Promise<NearbyPlace[]> {
  const fetchFn = options?.fetchFn || mockFetchFn || globalThis.fetch;
  const rounded = roundCoordinates(coords.latitude, coords.longitude);

  // 1. Check 24-hour cache unless explicitly bypassed
  if (!options?.bypassCache) {
    const cached = await getCachedNearbyPlaces(rounded.latitude, rounded.longitude);
    if (cached) {
      // Recompute distances for exact user coords if provided
      const recomputed = cached.map((p) => ({
        ...p,
        distanceKm: calculateDistanceKm(
          coords.latitude,
          coords.longitude,
          p.coordinates.latitude,
          p.coordinates.longitude
        ),
      }));
      recomputed.sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
      return recomputed;
    }
  }

  // 2. Query within 3 km (3000m)
  const query3km = buildOverpassQuery(rounded.latitude, rounded.longitude, 3000, options?.types);
  const data3km = await executeOverpassRequest(query3km, fetchFn);
  let places = parseOsmElements(data3km.elements, coords);

  // 3. If fewer than 5 results, widen to 10 km (10000m)
  if (places.length < 5) {
    const query10km = buildOverpassQuery(rounded.latitude, rounded.longitude, 10000, options?.types);
    const data10km = await executeOverpassRequest(query10km, fetchFn);
    places = parseOsmElements(data10km.elements, coords);
  }

  // 4. Cap at 40 results
  places = places.slice(0, 40);

  // 5. Store in 24-hour cache
  await setCachedNearbyPlaces(rounded.latitude, rounded.longitude, places);

  return places;
}

/**
 * Convenience helper to get nearby pharmacies specifically.
 */
export async function getNearbyPharmacies(
  coords: { latitude: number; longitude: number },
  options?: FetchNearbyOptions
): Promise<NearbyPlace[]> {
  const places = await getNearbyPlaces(coords, options);
  return places.filter((p) => p.type === 'pharmacy');
}
