// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  formatDistance,
  formatDistanceOrNull,
  sortListingsByDistance,
  PREDEFINED_AREAS,
  cleanLocalityName,
  isInvalidLocality,
  getRegionForCoordinates,
  searchPlacesWorldwide,
  setMockLocationModule,
} from '../locationService.ts';
import { REGIONS } from '../../config/regions.ts';

test('Location Service & Distance Calculation Tests', async (t) => {
  await t.test('cleanLocalityName strips administrative noise and maps Bangalore to Bengaluru', () => {
    assert.equal(cleanLocalityName('Bangalore Division'), 'Bengaluru');
    assert.equal(cleanLocalityName('Bengaluru District'), 'Bengaluru');
    assert.equal(cleanLocalityName('Bangalore Urban District'), 'Bangalore Urban');
    assert.equal(cleanLocalityName('Basavanagudi Division'), 'Basavanagudi');
    assert.equal(cleanLocalityName('Bangalore'), 'Bengaluru');
    assert.equal(cleanLocalityName(''), '');
    assert.equal(cleanLocalityName(null), '');
  });

  await t.test('isInvalidLocality accurately identifies numbers, door codes and noise', () => {
    assert.equal(isInvalidLocality('520'), true);
    assert.equal(isInvalidLocality('12'), true);
    assert.equal(isInvalidLocality('No. 520'), true);
    assert.equal(isInvalidLocality('#520'), true);
    assert.equal(isInvalidLocality('560004'), true);
    assert.equal(isInvalidLocality('Current Location'), true);
    assert.equal(isInvalidLocality('Current area'), true);
    assert.equal(isInvalidLocality('Unnamed Road'), true);
    assert.equal(isInvalidLocality('Bengaluru'), false);
    assert.equal(isInvalidLocality('Basavanagudi'), false);
    assert.equal(isInvalidLocality('Indiranagar'), false);
    assert.equal(isInvalidLocality('Koramangala'), false);
  });

  await t.test('Calculates exact zero distance for identical coordinates', () => {
    const d = calculateDistanceKm(12.9416, 77.5738, 12.9416, 77.5738);
    assert.equal(d, 0);
  });

  await t.test('Calculates accurate distance between known Bengaluru points', () => {
    // Basavanagudi (12.9416, 77.5738) to Victoria Hospital Kalasipalya (12.9625, 77.5760) is ~2.3 km
    const d = calculateDistanceKm(12.9416, 77.5738, 12.9625, 77.5760);
    assert.ok(d !== null);
    assert.ok(d >= 2.0 && d <= 2.6, `Distance ${d} km should be ~2.3 km`);
  });

  await t.test('Returns null when any coordinate is missing, null, or undefined', () => {
    assert.equal(calculateDistanceKm(null, 77.5738, 12.9416, 77.5738), null);
    assert.equal(calculateDistanceKm(12.9416, undefined, 12.9416, 77.5738), null);
    assert.equal(calculateDistanceKm(12.9416, 77.5738, null, 77.5738), null);
    assert.equal(calculateDistanceKm(12.9416, 77.5738, 12.9416, undefined), null);
    assert.equal(calculateDistanceKm(NaN, 77.5738, 12.9416, 77.5738), null);
  });

  await t.test('formatDistanceOrNull handles under 100 m, under 1 km, normal, over 100 km, and null coordinates', () => {
    // Under 100 m
    assert.equal(formatDistanceOrNull(0.05), 'Nearby (< 100m)');
    assert.equal(formatDistanceOrNull(0.099), 'Nearby (< 100m)');

    // Under 1 km
    assert.equal(formatDistanceOrNull(0.1), '100m away');
    assert.equal(formatDistanceOrNull(0.4), '400m away');
    assert.equal(formatDistanceOrNull(0.99), '990m away');

    // Normal (1 km to 100 km)
    assert.equal(formatDistanceOrNull(1.0), '1.0 km away');
    assert.equal(formatDistanceOrNull(1.4), '1.4 km away');
    assert.equal(formatDistanceOrNull(12.8), '12.8 km away');
    assert.equal(formatDistanceOrNull(100.0), '100.0 km away');

    // Over 100 km (do not show a distance at all)
    assert.equal(formatDistanceOrNull(100.1), null);
    assert.equal(formatDistanceOrNull(150), null);
    assert.equal(formatDistanceOrNull(8024), null);

    // Null, undefined, NaN, and negative coordinates
    assert.equal(formatDistanceOrNull(null), null);
    assert.equal(formatDistanceOrNull(undefined), null);
    assert.equal(formatDistanceOrNull(NaN), null);
    assert.equal(formatDistanceOrNull(-1), null);
  });

  await t.test('Predefined areas list has valid real Bengaluru coordinates', () => {
    assert.ok(PREDEFINED_AREAS.length >= 5);
    for (const area of PREDEFINED_AREAS) {
      assert.ok(area.id);
      assert.ok(area.name);
      assert.ok(area.latitude >= 12.0 && area.latitude <= 14.0);
      assert.ok(area.longitude >= 76.0 && area.longitude <= 78.5);
    }
  });

  await t.test('sortListingsByDistance sorts closest first when coordinates available', () => {
    const userLocation = { latitude: 12.9416, longitude: 77.5738 }; // Basavanagudi
    const sampleListings = [
      { id: 'far', name: 'Far Hosp', latitude: 13.0031, longitude: 77.5643 }, // Malleshwaram ~7km
      { id: 'near', name: 'Near Clinic', latitude: 12.9420, longitude: 77.5740 }, // ~0.1km
      { id: 'nocoord', name: 'No Coords' }, // Missing coords
      { id: 'mid', name: 'Mid Hosp', latitude: 12.9625, longitude: 77.5760 }, // ~2.3km
    ];

    const sorted = sortListingsByDistance(sampleListings, userLocation);
    assert.equal(sorted[0].id, 'near');
    assert.equal(sorted[1].id, 'mid');
    assert.equal(sorted[2].id, 'far');
    assert.equal(sorted[3].id, 'nocoord');
    assert.equal(sorted[3].distanceKm, undefined);
  });

  await t.test('sortListingsByDistance preserves original order when user location is null', () => {
    const sampleListings = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    const sorted = sortListingsByDistance(sampleListings, null);
    assert.equal(sorted[0].id, '1');
    assert.equal(sorted[1].id, '2');
  });

  await t.test('Location prompt resolves to Set your area when locationSource is none, and area name otherwise', () => {
    function resolveLocationPrompt(source, areaName) {
      if (source === 'none') return 'Set your area';
      return areaName.split(',')[0] || 'Current area';
    }

    assert.equal(resolveLocationPrompt('none', 'No area set'), 'Set your area');
    assert.equal(resolveLocationPrompt('none', ''), 'Set your area');
    assert.equal(resolveLocationPrompt('gps', 'Indiranagar, Bengaluru'), 'Indiranagar');
    assert.equal(resolveLocationPrompt('manual_area', 'Jayanagar, Bengaluru'), 'Jayanagar');
  });

  await t.test('getRegionForCoordinates handles inside, boundary, outside, and null', () => {
    const bengaluru = REGIONS.find((r) => r.id === 'bengaluru');
    assert.ok(bengaluru, 'Bengaluru region should exist');

    // Inside: centroid
    const centroidResult = getRegionForCoordinates(bengaluru.centroid.latitude, bengaluru.centroid.longitude);
    assert.equal(centroidResult?.id, 'bengaluru');
    assert.equal(centroidResult?.hasPharmacyData, true);

    // Inside: coordinates object signature
    const objResult = getRegionForCoordinates(bengaluru.centroid);
    assert.equal(objResult?.id, 'bengaluru');

    // Inside: neighborhoods
    assert.equal(getRegionForCoordinates(12.9416, 77.5738)?.id, 'bengaluru'); // Basavanagudi
    assert.equal(getRegionForCoordinates(12.9719, 77.6412)?.id, 'bengaluru'); // Indiranagar

    // Boundary: calculate distances relative to centroid
    // ~44.9 km away (inside 45 km radius)
    const onBoundaryPoint = { latitude: bengaluru.centroid.latitude + 0.404, longitude: bengaluru.centroid.longitude };
    const onBoundaryDist = calculateDistanceKm(
      bengaluru.centroid.latitude,
      bengaluru.centroid.longitude,
      onBoundaryPoint.latitude,
      onBoundaryPoint.longitude
    );
    assert.ok(onBoundaryDist !== null && onBoundaryDist <= 45.0, `Expected distance <= 45km, got ${onBoundaryDist}`);
    assert.equal(getRegionForCoordinates(onBoundaryPoint)?.id, 'bengaluru');

    // Just outside boundary: ~46.1 km away
    const justOutsidePoint = { latitude: bengaluru.centroid.latitude + 0.415, longitude: bengaluru.centroid.longitude };
    const justOutsideDist = calculateDistanceKm(
      bengaluru.centroid.latitude,
      bengaluru.centroid.longitude,
      justOutsidePoint.latitude,
      justOutsidePoint.longitude
    );
    assert.ok(justOutsideDist !== null && justOutsideDist > 45.0, `Expected distance > 45km, got ${justOutsideDist}`);
    assert.equal(getRegionForCoordinates(justOutsidePoint), null);

    // Outside: other Indian cities and overseas
    assert.equal(getRegionForCoordinates(13.3409, 77.1010), null); // Tumkur (~70km)
    assert.equal(getRegionForCoordinates(12.2958, 76.6394), null); // Mysore (~130km)
    assert.equal(getRegionForCoordinates(19.0760, 72.8777), null); // Mumbai
    assert.equal(getRegionForCoordinates(51.5074, -0.1278), null); // London
    assert.equal(getRegionForCoordinates(40.7128, -74.0060), null); // New York

    // Null and invalid inputs
    assert.equal(getRegionForCoordinates(null, null), null);
    assert.equal(getRegionForCoordinates(undefined, undefined), null);
    assert.equal(getRegionForCoordinates(null), null);
    assert.equal(getRegionForCoordinates(undefined), null);
    assert.equal(getRegionForCoordinates(NaN, 77.5946), null);
    assert.equal(getRegionForCoordinates(12.9716, NaN), null);
    assert.equal(getRegionForCoordinates({ latitude: NaN, longitude: 77.5946 }), null);
  });

  await t.test('searchPlacesWorldwide handles geocoding failure path, empty queries, and success', async () => {
    // Queries shorter than 2 chars return empty without hitting geocoder
    assert.deepEqual(await searchPlacesWorldwide(''), []);
    assert.deepEqual(await searchPlacesWorldwide('a'), []);
    assert.deepEqual(await searchPlacesWorldwide('   '), []);

    // Failure path: geocoder throws network / platform error
    setMockLocationModule({
      geocodeAsync: async () => {
        throw new Error('Geocoder service unavailable or network error');
      },
      reverseGeocodeAsync: async () => [],
    });

    const failedResults = await searchPlacesWorldwide('Nowhere Land');
    assert.deepEqual(failedResults, [], 'Should return empty array on geocoding error without throwing');

    // Empty results path: geocoder finds 0 matches
    setMockLocationModule({
      geocodeAsync: async () => [],
      reverseGeocodeAsync: async () => [],
    });

    const emptyResults = await searchPlacesWorldwide('NonexistentPlaceXYZ123');
    assert.deepEqual(emptyResults, []);

    // Success path: geocoder finds places and reverse geocodes context
    setMockLocationModule({
      geocodeAsync: async () => [
        { latitude: 51.5074, longitude: -0.1278 },
      ],
      reverseGeocodeAsync: async () => [
        {
          name: 'Westminster',
          street: 'Whitehall',
          subregion: 'Westminster',
          district: 'Greater London',
          city: 'London',
          region: 'England',
          country: 'United Kingdom',
        },
      ],
    });

    const successResults = await searchPlacesWorldwide('Westminster London', 5);
    assert.equal(successResults.length, 1);
    assert.equal(successResults[0].latitude, 51.5074);
    assert.equal(successResults[0].longitude, -0.1278);
    assert.equal(successResults[0].locality, 'Westminster');
    assert.ok(successResults[0].name.includes('Westminster'));
    assert.ok(successResults[0].name.includes('London'));

    // Reset mock
    setMockLocationModule(null);
  });
});
