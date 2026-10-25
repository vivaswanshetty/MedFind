// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRegionForCoordinates,
  sortListingsByDistance,
} from '../locationService.ts';
import { REGIONS } from '../../config/regions.ts';

// Simulated app state logic mirroring care.tsx and search.tsx
function computeCoverageState(userLocation, locationSource) {
  const userRegion = getRegionForCoordinates(userLocation);
  // When no area is set (locationSource === 'none'), isOutsideCoverage is false
  const isOutsideCoverage = userLocation !== null && userRegion === null;
  return { userRegion, isOutsideCoverage };
}

function resolveCareListings(listings, userLocation, isOutsideCoverage) {
  if (isOutsideCoverage) {
    return [];
  }
  if (userLocation) {
    return sortListingsByDistance(listings, userLocation);
  }
  return listings;
}

function resolveSearchPharmacies(baseStores, userLocation, isOutsideCoverage) {
  if (isOutsideCoverage) {
    return [];
  }
  if (userLocation) {
    return sortListingsByDistance(baseStores, userLocation);
  }
  return baseStores;
}

test('Region Behavior Tests (Inside Region, Outside Region, No Area)', async (t) => {
  const sampleListings = [
    { id: '1', name: 'Victoria Hospital', latitude: 12.9625, longitude: 77.5760 },
    { id: '2', name: 'Apollo Clinic', latitude: 12.9420, longitude: 77.5740 },
  ];

  const sampleStores = [
    { id: 's1', pharmacyName: 'Lalbagh Pharmacy', latitude: 12.9510, longitude: 77.5850 },
    { id: 's2', pharmacyName: 'Gandhi Bazaar Medicals', latitude: 12.9430, longitude: 77.5710 },
  ];

  await t.test('1. Inside region: user in Bengaluru has active pharmacy & care listings', () => {
    const userLocation = { latitude: 12.9416, longitude: 77.5738 }; // Basavanagudi
    const locationSource = 'gps';

    const { userRegion, isOutsideCoverage } = computeCoverageState(userLocation, locationSource);
    assert.ok(userRegion !== null, 'Should detect Bengaluru region');
    assert.equal(userRegion.id, 'bengaluru');
    assert.equal(userRegion.hasPharmacyData, true);
    assert.equal(isOutsideCoverage, false, 'Inside coverage should not be outside coverage');

    // Care listings
    const careListings = resolveCareListings(sampleListings, userLocation, isOutsideCoverage);
    assert.equal(careListings.length, 2);
    assert.equal(careListings[0].id, '2', 'Nearest provider should be sorted first');

    // Search pharmacy items
    const searchStores = resolveSearchPharmacies(sampleStores, userLocation, isOutsideCoverage);
    assert.equal(searchStores.length, 2);
    assert.equal(searchStores[0].id, 's2', 'Nearest pharmacy should be sorted first');
  });

  await t.test('2. Outside region: user in Mumbai/London/overseas gets empty listings & honest state', () => {
    const testCases = [
      { name: 'Mumbai', location: { latitude: 19.0760, longitude: 72.8777 } },
      { name: 'London', location: { latitude: 51.5074, longitude: -0.1278 } },
      { name: 'New York', location: { latitude: 40.7128, longitude: -74.0060 } },
      { name: 'Mysore', location: { latitude: 12.2958, longitude: 76.6394 } },
    ];

    for (const tc of testCases) {
      const { userRegion, isOutsideCoverage } = computeCoverageState(tc.location, 'gps');
      assert.equal(userRegion, null, `${tc.name} should be outside verified regions`);
      assert.equal(isOutsideCoverage, true, `${tc.name} must trigger isOutsideCoverage`);

      // Care listings MUST be empty (no Bengaluru data leaked)
      const careListings = resolveCareListings(sampleListings, tc.location, isOutsideCoverage);
      assert.deepEqual(careListings, [], `${tc.name} must return 0 care listings`);

      // Search pharmacy items MUST be empty (no Bengaluru stores leaked)
      const searchStores = resolveSearchPharmacies(sampleStores, tc.location, isOutsideCoverage);
      assert.deepEqual(searchStores, [], `${tc.name} must return 0 pharmacy stores`);
    }
  });

  await t.test('3. No area set: user with no GPS/manual area retains current default behavior', () => {
    const userLocation = null;
    const locationSource = 'none';

    const { userRegion, isOutsideCoverage } = computeCoverageState(userLocation, locationSource);
    assert.equal(userRegion, null);
    assert.equal(isOutsideCoverage, false, 'No area set must not trigger isOutsideCoverage banner');

    // Care listings fall back to default demo listings
    const careListings = resolveCareListings(sampleListings, userLocation, isOutsideCoverage);
    assert.equal(careListings.length, sampleListings.length, 'Default listings preserved');
    assert.equal(careListings[0].id, '1');

    // Search stores fall back to default base stores
    const searchStores = resolveSearchPharmacies(sampleStores, userLocation, isOutsideCoverage);
    assert.equal(searchStores.length, sampleStores.length, 'Default stores preserved');
  });
});
