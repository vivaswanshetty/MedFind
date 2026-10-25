export interface Region {
  id: string;
  name: string;
  countryCode: string;
  centroid: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
  hasPharmacyData: boolean;
}

export const REGIONS: Region[] = [
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    countryCode: 'IN',
    centroid: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
    radiusKm: 45,
    hasPharmacyData: true,
  },
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Resolves which known Region contains the specified coordinates.
 * Returns null if the coordinates are outside all known regions or invalid.
 * Accepts either (latitude, longitude) or a coordinates object { latitude, longitude }.
 */
export function getRegionForCoordinates(
  latOrCoords?: number | { latitude?: number | null; longitude?: number | null } | null,
  lon?: number | null
): Region | null {
  let latitude: number | null | undefined;
  let longitude: number | null | undefined;

  if (typeof latOrCoords === 'object' && latOrCoords !== null) {
    latitude = latOrCoords.latitude;
    longitude = latOrCoords.longitude;
  } else {
    latitude = latOrCoords;
    longitude = lon;
  }

  if (
    latitude === undefined ||
    latitude === null ||
    Number.isNaN(latitude) ||
    longitude === undefined ||
    longitude === null ||
    Number.isNaN(longitude)
  ) {
    return null;
  }

  for (const region of REGIONS) {
    const dist = haversineDistanceKm(
      latitude,
      longitude,
      region.centroid.latitude,
      region.centroid.longitude
    );
    if (dist <= region.radiusKm) {
      return region;
    }
  }

  return null;
}
