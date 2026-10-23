// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  formatDistance,
  sortListingsByDistance,
  PREDEFINED_AREAS,
  cleanLocalityName,
  isInvalidLocality,
} from '../locationService.ts';

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
    assert.equal(isInvalidLocality('Bengaluru'), true);
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

  await t.test('Formats distances clearly according to threshold rules', () => {
    assert.equal(formatDistance(null), null);
    assert.equal(formatDistance(undefined), null);
    assert.equal(formatDistance(0.05), 'Nearby (< 100m)');
    assert.equal(formatDistance(0.4), '400m away');
    assert.equal(formatDistance(1.4), '1.4 km away');
    assert.equal(formatDistance(12.8), '12.8 km away');
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
});
