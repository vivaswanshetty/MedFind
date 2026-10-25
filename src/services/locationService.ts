/**
 * Location Service for MedFind
 * 
 * Complies strictly with project requirements:
 * 1. Foreground location only — NEVER background tracking.
 * 2. In-memory session coordinates only — NEVER uploaded to Supabase, NEVER persisted to disk.
 * 3. Never uses demo coordinates as the user's location.
 * 4. Displays distance ONLY when both user location and listing real coordinates are present.
 * 5. Handles permission denial, approximate location, and errors gracefully.
 */

// Lazy-load expo-location to keep distance utilities pure and testable across all runtimes
let expoLocationModule: typeof import('expo-location') | null = null;

export function setMockLocationModule(mock: any): void {
  expoLocationModule = mock;
}

async function getLocationModule() {
  if (!expoLocationModule) {
    expoLocationModule = await import('expo-location');
  }
  return expoLocationModule;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface KnownArea {
  id: string;
  name: string;
  locality: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

/**
 * Verified areas in Bengaluru for manual area selection when GPS is skipped/denied.
 */
export const PREDEFINED_AREAS: KnownArea[] = [
  {
    id: 'area-basavanagudi',
    name: 'Basavanagudi, Bengaluru',
    locality: 'Basavanagudi',
    pincode: '560004',
    latitude: 12.9416,
    longitude: 77.5738,
  },
  {
    id: 'area-jayanagar',
    name: 'Jayanagar, Bengaluru',
    locality: 'Jayanagar',
    pincode: '560011',
    latitude: 12.9308,
    longitude: 77.5838,
  },
  {
    id: 'area-kalasipalya',
    name: 'Kalasipalya / City Market',
    locality: 'City Market',
    pincode: '560002',
    latitude: 12.9625,
    longitude: 77.5760,
  },
  {
    id: 'area-shivajinagar',
    name: 'Shivaji Nagar, Bengaluru',
    locality: 'Shivaji Nagar',
    pincode: '560001',
    latitude: 12.9825,
    longitude: 77.6040,
  },
  {
    id: 'area-malleshwaram',
    name: 'Malleshwaram, Bengaluru',
    locality: 'Malleshwaram',
    pincode: '560003',
    latitude: 13.0031,
    longitude: 77.5643,
  },
  {
    id: 'area-indiranagar',
    name: 'Indiranagar, Bengaluru',
    locality: 'Indiranagar',
    pincode: '560038',
    latitude: 12.9719,
    longitude: 77.6412,
  },
  {
    id: 'area-koramangala',
    name: 'Koramangala, Bengaluru',
    locality: 'Koramangala',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6245,
  },
  {
    id: 'area-hsr-layout',
    name: 'HSR Layout, Bengaluru',
    locality: 'HSR Layout',
    pincode: '560102',
    latitude: 12.9121,
    longitude: 77.6446,
  },
  {
    id: 'area-whitefield',
    name: 'Whitefield / ITPL, Bengaluru',
    locality: 'Whitefield',
    pincode: '560066',
    latitude: 12.9698,
    longitude: 77.7500,
  },
  {
    id: 'area-electronic-city',
    name: 'Electronic City, Bengaluru',
    locality: 'Electronic City',
    pincode: '560100',
    latitude: 12.8452,
    longitude: 77.6602,
  },
  {
    id: 'area-jp-nagar',
    name: 'JP Nagar, Bengaluru',
    locality: 'JP Nagar',
    pincode: '560078',
    latitude: 12.9063,
    longitude: 77.5857,
  },
  {
    id: 'area-rajajinagar',
    name: 'Rajajinagar, Bengaluru',
    locality: 'Rajajinagar',
    pincode: '560010',
    latitude: 12.9982,
    longitude: 77.5530,
  },
  {
    id: 'area-banashankari',
    name: 'Banashankari, Bengaluru',
    locality: 'Banashankari',
    pincode: '560070',
    latitude: 12.9255,
    longitude: 77.5468,
  },
  {
    id: 'area-btm-layout',
    name: 'BTM Layout, Bengaluru',
    locality: 'BTM Layout',
    pincode: '560068',
    latitude: 12.9166,
    longitude: 77.6101,
  },
  {
    id: 'area-hebbal',
    name: 'Hebbal, Bengaluru',
    locality: 'Hebbal',
    pincode: '560024',
    latitude: 13.0358,
    longitude: 77.5970,
  },
  {
    id: 'area-yelahanka',
    name: 'Yelahanka, Bengaluru',
    locality: 'Yelahanka',
    pincode: '560064',
    latitude: 13.1007,
    longitude: 77.5963,
  },
  {
    id: 'area-marathahalli',
    name: 'Marathahalli, Bengaluru',
    locality: 'Marathahalli',
    pincode: '560037',
    latitude: 12.9591,
    longitude: 77.6974,
  },
  {
    id: 'area-bellandur',
    name: 'Bellandur / ORR, Bengaluru',
    locality: 'Bellandur',
    pincode: '560103',
    latitude: 12.9304,
    longitude: 77.6784,
  },
  {
    id: 'area-frazer-town',
    name: 'Frazer Town / Pulikeshi Nagar',
    locality: 'Frazer Town',
    pincode: '560005',
    latitude: 12.9968,
    longitude: 77.6131,
  },
  {
    id: 'area-richmond-town',
    name: 'Richmond Town / Ashok Nagar',
    locality: 'Richmond Town',
    pincode: '560025',
    latitude: 12.9665,
    longitude: 77.6068,
  },
  {
    id: 'area-vijayanagar',
    name: 'Vijayanagar, Bengaluru',
    locality: 'Vijayanagar',
    pincode: '560040',
    latitude: 12.9719,
    longitude: 77.5303,
  },
  {
    id: 'area-yeshwanthpur',
    name: 'Yeshwanthpur, Bengaluru',
    locality: 'Yeshwanthpur',
    pincode: '560022',
    latitude: 13.0238,
    longitude: 77.5529,
  },
  {
    id: 'area-domlur',
    name: 'Domlur, Bengaluru',
    locality: 'Domlur',
    pincode: '560071',
    latitude: 12.9609,
    longitude: 77.6387,
  },
  {
    id: 'area-bannerghatta-rd',
    name: 'Bannerghatta Road, Bengaluru',
    locality: 'Bannerghatta Road',
    pincode: '560076',
    latitude: 12.8948,
    longitude: 77.5979,
  },
];

/**
 * Haversine formula to compute geodesic distance between two coordinate pairs in kilometers.
 */
export function calculateDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (
    lat1 === undefined || lat1 === null || isNaN(lat1) ||
    lon1 === undefined || lon1 === null || isNaN(lon1) ||
    lat2 === undefined || lat2 === null || isNaN(lat2) ||
    lon2 === undefined || lon2 === null || isNaN(lon2)
  ) {
    return null;
  }

  // Exact same point check
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10; // Rounded to 1 decimal place, e.g. 1.4 km
}

export const MAX_DISPLAY_DISTANCE_KM = 100;

/**
 * Returns a user-friendly distance string (e.g. "Nearby (< 100m)", "450m away", "2.4 km away"),
 * or null if:
 * - distance is null, undefined, or NaN
 * - distance is negative
 * - distance is farther than 100 km (avoids misleading long-distance claims)
 */
export function formatDistanceOrNull(distanceKm?: number | null): string | null {
  if (
    distanceKm === undefined ||
    distanceKm === null ||
    isNaN(distanceKm) ||
    distanceKm < 0 ||
    distanceKm > MAX_DISPLAY_DISTANCE_KM
  ) {
    return null;
  }

  if (distanceKm < 0.1) {
    return 'Nearby (< 100m)';
  }

  if (distanceKm < 1.0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Format distance in a user-friendly string (suppresses distances > 100 km)
 */
export function formatDistance(distanceKm?: number | null): string | null {
  return formatDistanceOrNull(distanceKm);
}

export interface LocationRequestResult {
  granted: boolean;
  coords?: Coordinates;
  areaName?: string;
  isoCountryCode?: string | null;
  error?: string;
  isOutsideCoverage?: boolean;
}

import { getRegionForCoordinates, Region } from '../config/regions';
export { getRegionForCoordinates, Region } from '../config/regions';

export interface PlaceSearchResult {
  name: string;
  locality: string;
  latitude: number;
  longitude: number;
  isoCountryCode?: string | null;
}


/**
 * Detects whether a reverse-geocoded candidate is a door number, house number,
 * postal code, or generic noise that should NOT be displayed as a neighborhood.
 */
export function isInvalidLocality(str?: string | null): boolean {
  if (!str) return true;
  const s = str.trim();
  if (s.length === 0) return true;
  // Pure numbers (e.g. "520", "12")
  if (/^\d+$/.test(s)) return true;
  // Postal pincodes (e.g. "560004")
  if (/^\d{5,6}$/.test(s)) return true;
  // Door/flat/house/plot numbers (e.g. "No. 520", "#520", "Plot 12", "520/A", "520-B")
  if (/^(no\.?|plot|flat|door|site|shop|#|building)?\s*\d+([a-z\/\-0-9]*)$/i.test(s)) return true;
  // Generic placeholders
  if (/^(Current Location|Current area|Unnamed Road)$/i.test(s)) return true;
  return false;
}

/**
 * Strips administrative noise (e.g. "Division", "District") from reverse geocoded names.
 */
export function cleanLocalityName(raw?: string | null): string {
  if (!raw) return '';
  let clean = raw.trim();
  clean = clean.replace(/\s*(Division|District|Sub-District)\b/gi, '').trim();
  if (/^Bangalore$/i.test(clean)) return 'Bengaluru';
  return clean;
}

/**
 * Searches places worldwide using expo-location geocodeAsync.
 * Does not require external API keys. Handles geocoding errors gracefully.
 */
export async function searchPlacesWorldwide(
  query: string,
  maxResults: number = 5
): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const Location = await getLocationModule();
    const geocoded = await Location.geocodeAsync(trimmed);
    if (!geocoded || geocoded.length === 0) {
      return [];
    }

    const capped = geocoded.slice(0, maxResults);
    const results: PlaceSearchResult[] = [];

    for (const item of capped) {
      let displayName = trimmed;
      let locality = trimmed;
      let isoCountryCode: string | null = null;

      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: item.latitude,
          longitude: item.longitude,
        });

        if (places && places.length > 0) {
          const p = places[0];
          isoCountryCode = p.isoCountryCode ? p.isoCountryCode.toUpperCase() : null;
          const name = cleanLocalityName(p.name);
          const street = cleanLocalityName(p.street);
          const sub = cleanLocalityName(p.subregion);
          const dist = cleanLocalityName(p.district);
          const city = cleanLocalityName(p.city);
          const region = cleanLocalityName(p.region);
          const country = p.country || '';

          const candidate = [name, sub, dist, street, city].find(
            (c) => c && !isInvalidLocality(c)
          );
          locality = candidate || city || region || trimmed;

          const contextParts = [city, region, country].filter(
            (cp) => cp && cp.toLowerCase() !== locality.toLowerCase()
          );
          const uniqueContext = Array.from(new Set(contextParts));
          displayName = uniqueContext.length > 0 ? `${locality}, ${uniqueContext.join(', ')}` : locality;
        }
      } catch {
        // Fallback gracefully to query name
      }

      results.push({
        name: displayName,
        locality,
        latitude: item.latitude,
        longitude: item.longitude,
        isoCountryCode,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Requests foreground location permission from the device.
 * Never requests background location.
 */
export async function requestDeviceLocation(): Promise<LocationRequestResult> {
  try {
    const Location = await getLocationModule();
    const permission = await Location.requestForegroundPermissionsAsync();

    if (permission.status !== 'granted') {
      return {
        granted: false,
        error: 'Foreground location permission not granted by user.',
      };
    }

    // Get current position with High accuracy for street-level GPS precision
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coords: Coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    // Attempt to reverse geocode to a friendly locality name
    let areaName = 'Current area';
    let isoCountryCode: string | null = null;
    try {
      const places = await Location.reverseGeocodeAsync(coords);
      if (places && places.length > 0) {
        const p = places[0];
        isoCountryCode = p.isoCountryCode ? p.isoCountryCode.toUpperCase() : null;
        const name = cleanLocalityName(p.name);
        const street = cleanLocalityName(p.street);
        const sub = cleanLocalityName(p.subregion);
        const dist = cleanLocalityName(p.district);
        const city = cleanLocalityName(p.city);
        const region = cleanLocalityName(p.region);
        const country = p.country || '';

        const candidates = [sub, dist, street, name].filter(
          (c) => c && !isInvalidLocality(c)
        );
        let locality = candidates[0] || city || region || 'Current area';

        const broader = city && city !== locality ? city : region && region !== locality ? region : country;
        areaName = broader && locality !== broader ? `${locality}, ${broader}` : locality;
      }
    } catch {
      // Reverse geocode is best-effort; keep "Current area" fallback
    }

    const currentRegion = getRegionForCoordinates(coords);
    return {
      granted: true,
      coords,
      areaName,
      isoCountryCode,
      isOutsideCoverage: currentRegion === null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      granted: false,
      error: `Could not retrieve device location: ${message}`,
    };
  }
}

/**
 * Check existing foreground permission status without triggering an OS prompt
 */
export async function checkLocationPermission(): Promise<boolean> {
  try {
    const Location = await getLocationModule();
    const perm = await Location.getForegroundPermissionsAsync();
    return perm.status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Sorts listings by distance from user location when both user and listing coordinates are present.
 * Does not invent distances for items missing coordinates.
 */
export function sortListingsByDistance<T extends { latitude?: number | null; longitude?: number | null }>(
  listings: T[],
  userCoords: Coordinates | null
): (T & { distanceKm?: number })[] {
  if (!userCoords || userCoords.latitude === undefined || userCoords.longitude === undefined) {
    return listings.map((item) => ({ ...item, distanceKm: (item as any).distanceKm }));
  }

  return listings
    .map((item) => {
      const dist = calculateDistanceKm(
        userCoords.latitude,
        userCoords.longitude,
        item.latitude ?? undefined,
        item.longitude ?? undefined
      );
      return {
        ...item,
        distanceKm: dist !== null ? dist : undefined,
      };
    })
    .sort((a, b) => {
      if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== undefined) return -1;
      if (b.distanceKm !== undefined) return 1;
      return 0;
    });
}
