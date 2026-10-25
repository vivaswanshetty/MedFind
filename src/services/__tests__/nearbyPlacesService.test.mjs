// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

// In-memory localStorage shim for AsyncStorage in Node environment
const memoryStore = new Map();
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: {
      getItem: (k) => memoryStore.get(k) ?? null,
      setItem: (k, v) => {
        memoryStore.set(k, String(v));
      },
      removeItem: (k) => {
        memoryStore.delete(k);
      },
      clear: () => {
        memoryStore.clear();
      },
    },
  };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  roundCoordinates,
  buildOverpassQuery,
  formatOsmAddress,
  parseOsmElements,
  getNearbyPlaces,
  getNearbyPharmacies,
  clearNearbyPlacesCache,
  getCachedNearbyPlaces,
  setCachedNearbyPlaces,
  OSM_ATTRIBUTION,
  OVERPASS_SERVERS,
  OVERPASS_USER_AGENT,
} from '../nearbyPlacesService.ts';

test('OpenStreetMap Nearby Places Service Tests', async (t) => {
  t.beforeEach(async () => {
    memoryStore.clear();
    await clearNearbyPlacesCache();
  });

  await t.test('1. Privacy & Coordinate Rounding: strictly rounds to 2 decimals (~1 km) and sends nothing else', async () => {
    // Exact rounding calculation
    const rounded = roundCoordinates(40.748817, -73.985428);
    assert.equal(rounded.latitude, 40.75);
    assert.equal(rounded.longitude, -73.99);

    // buildOverpassQuery strictly contains rounded numbers
    const query = buildOverpassQuery(40.748817, -73.985428, 3000);
    assert.ok(query.includes('around:3000,40.75,-73.99'));
    assert.ok(!query.includes('40.748817'));
    assert.ok(!query.includes('-73.985428'));

    // Network request verification: ensures body sent across the wire contains only rounded coords
    let capturedBody = '';
    let capturedHeaders = {};
    const mockFetch = async (url, options) => {
      capturedBody = String(options.body);
      capturedHeaders = options.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          elements: [
            {
              type: 'node',
              id: 101,
              lat: 40.75,
              lon: -73.99,
              tags: { amenity: 'pharmacy', name: 'Privacy Pharmacy' },
            },
            { type: 'node', id: 102, lat: 40.751, lon: -73.991, tags: { amenity: 'pharmacy', name: 'P2' } },
            { type: 'node', id: 103, lat: 40.752, lon: -73.992, tags: { amenity: 'pharmacy', name: 'P3' } },
            { type: 'node', id: 104, lat: 40.753, lon: -73.993, tags: { amenity: 'pharmacy', name: 'P4' } },
            { type: 'node', id: 105, lat: 40.754, lon: -73.994, tags: { amenity: 'pharmacy', name: 'P5' } },
          ],
        }),
      };
    };

    await getNearbyPlaces(
      { latitude: 40.748817, longitude: -73.985428 },
      { fetchFn: mockFetch, bypassCache: true }
    );

    const decodedBody = decodeURIComponent(capturedBody);
    assert.ok(decodedBody.includes('40.75'), 'Body must contain rounded latitude');
    assert.ok(decodedBody.includes('-73.99'), 'Body must contain rounded longitude');
    assert.ok(!decodedBody.includes('40.748817'), 'Full precision latitude must never be sent');
    assert.ok(!decodedBody.includes('-73.985428'), 'Full precision longitude must never be sent');

    // Identifying User-Agent header
    assert.equal(capturedHeaders['User-Agent'], OVERPASS_USER_AGENT);
    assert.ok(capturedHeaders['User-Agent'].includes('MedFind'));
  });

  await t.test('2. Success: parses OSM elements, addresses, emergency department tag, raw opening hours, and sorts by distance', async () => {
    const rawOsmElements = [
      {
        type: 'node',
        id: 1,
        lat: 51.5074,
        lon: -0.1278,
        tags: {
          amenity: 'pharmacy',
          name: 'Central Chemist',
          'addr:housenumber': '10',
          'addr:street': 'High Street',
          'addr:city': 'London',
          'addr:postcode': 'SW1A 1AA',
          phone: '+44 20 7946 0991',
          opening_hours: 'Mo-Fr 08:00-20:00; Sa 09:00-18:00',
        },
      },
      {
        type: 'node',
        id: 2,
        lat: 51.5080,
        lon: -0.1280,
        tags: {
          amenity: 'hospital',
          name: 'St. Jude General Hospital',
          emergency: 'yes', // Emergency department tagged!
          'contact:phone': '+44 20 7946 0999',
          website: 'https://example.org/st-jude',
        },
      },
      {
        type: 'node',
        id: 3,
        lat: 51.5090,
        lon: -0.1290,
        tags: {
          amenity: 'hospital',
          name: 'Westside Community Hospital',
          emergency: 'no', // Not emergency=yes
        },
      },
      {
        type: 'way',
        id: 4,
        center: { lat: 51.5060, lon: -0.1260 },
        tags: {
          healthcare: 'clinic',
          name: 'Metro Walk-in Clinic',
        },
      },
      {
        type: 'node',
        id: 5,
        lat: 51.5050,
        lon: -0.1250,
        tags: {
          amenity: 'pharmacy',
          name: 'Corner Pharmacy',
        },
      },
    ];

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ elements: rawOsmElements }),
    });

    const places = await getNearbyPlaces(
      { latitude: 51.5072, longitude: -0.1276 },
      { fetchFn: mockFetch, bypassCache: true }
    );

    assert.equal(places.length, 5);

    // 1. Central Chemist
    const pharmacy = places.find((p) => p.name === 'Central Chemist');
    assert.ok(pharmacy);
    assert.equal(pharmacy.type, 'pharmacy');
    assert.equal(pharmacy.phone, '+44 20 7946 0991');
    assert.equal(pharmacy.address, '10 High Street, London, SW1A 1AA');
    assert.equal(pharmacy.openingHours, 'Mo-Fr 08:00-20:00; Sa 09:00-18:00');
    assert.equal(pharmacy.hasEmergencyDepartment, false);

    // 2. Hospital with emergency=yes
    const erHospital = places.find((p) => p.name === 'St. Jude General Hospital');
    assert.ok(erHospital);
    assert.equal(erHospital.type, 'hospital');
    assert.equal(erHospital.hasEmergencyDepartment, true, 'Hospital tagged emergency=yes must have emergency department');
    assert.equal(erHospital.phone, '+44 20 7946 0999');
    assert.equal(erHospital.website, 'https://example.org/st-jude');

    // 3. Hospital without emergency=yes
    const nonErHospital = places.find((p) => p.name === 'Westside Community Hospital');
    assert.ok(nonErHospital);
    assert.equal(nonErHospital.hasEmergencyDepartment, false, 'Hospital without emergency=yes must have hasEmergencyDepartment false');

    // 4. Clinic
    const clinic = places.find((p) => p.name === 'Metro Walk-in Clinic');
    assert.ok(clinic);
    assert.equal(clinic.type, 'clinic');
    assert.equal(clinic.coordinates.latitude, 51.5060);

    // 5. Sorted by distance
    for (let i = 0; i < places.length - 1; i++) {
      assert.ok(places[i].distanceKm <= places[i + 1].distanceKm);
    }
  });

  await t.test('3. Empty result & Widening: expands from 3 km to 10 km when fewer than 5 results are returned', async () => {
    const queriedRadii = [];
    const mockFetch = async (url, options) => {
      const body = decodeURIComponent(String(options.body));
      if (body.includes('around:3000')) {
        queriedRadii.push(3000);
        // Only 2 results within 3 km
        return {
          ok: true,
          status: 200,
          json: async () => ({
            elements: [
              { type: 'node', id: 1, lat: 48.8566, lon: 2.3522, tags: { amenity: 'pharmacy', name: 'Pharmacie 1' } },
              { type: 'node', id: 2, lat: 48.8570, lon: 2.3530, tags: { amenity: 'pharmacy', name: 'Pharmacie 2' } },
            ],
          }),
        };
      }
      if (body.includes('around:10000')) {
        queriedRadii.push(10000);
        // Widened search returns 6 results
        return {
          ok: true,
          status: 200,
          json: async () => ({
            elements: [
              { type: 'node', id: 1, lat: 48.8566, lon: 2.3522, tags: { amenity: 'pharmacy', name: 'Pharmacie 1' } },
              { type: 'node', id: 2, lat: 48.8570, lon: 2.3530, tags: { amenity: 'pharmacy', name: 'Pharmacie 2' } },
              { type: 'node', id: 3, lat: 48.8600, lon: 2.3600, tags: { amenity: 'pharmacy', name: 'Pharmacie 3' } },
              { type: 'node', id: 4, lat: 48.8700, lon: 2.3700, tags: { amenity: 'hospital', name: 'Hopital 4' } },
              { type: 'node', id: 5, lat: 48.8800, lon: 2.3800, tags: { amenity: 'clinic', name: 'Clinique 5' } },
              { type: 'node', id: 6, lat: 48.8900, lon: 2.3900, tags: { amenity: 'pharmacy', name: 'Pharmacie 6' } },
            ],
          }),
        };
      }
      throw new Error('Unexpected query');
    };

    const places = await getNearbyPlaces(
      { latitude: 48.8566, longitude: 2.3522 },
      { fetchFn: mockFetch, bypassCache: true }
    );

    assert.deepEqual(queriedRadii, [3000, 10000], 'Must query 3000m first, then widen to 10000m when < 5 results');
    assert.equal(places.length, 6);
  });

  await t.test('4. Empty result: returns empty array when no facilities exist within 10 km', async () => {
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ elements: [] }),
    });

    const places = await getNearbyPlaces(
      { latitude: -80.0, longitude: 0.0 },
      { fetchFn: mockFetch, bypassCache: true }
    );

    assert.equal(Array.isArray(places), true);
    assert.equal(places.length, 0);
  });

  await t.test('5. Fallback mirror: automatically falls back to secondary mirror when primary server fails', async () => {
    const contactedServers = [];
    const mockFetch = async (url) => {
      contactedServers.push(url);
      if (url === OVERPASS_SERVERS[0]) {
        // Primary server fails with 504 Gateway Timeout or 500
        return {
          ok: false,
          status: 504,
          json: async () => ({}),
        };
      }
      if (url === OVERPASS_SERVERS[1]) {
        // Secondary mirror succeeds
        return {
          ok: true,
          status: 200,
          json: async () => ({
            elements: [
              {
                type: 'node',
                id: 99,
                lat: 35.6762,
                lon: 139.6503,
                tags: { amenity: 'pharmacy', name: 'Tokyo Pharmacy' },
              },
              { type: 'node', id: 100, lat: 35.677, lon: 139.651, tags: { amenity: 'pharmacy', name: 'P2' } },
              { type: 'node', id: 101, lat: 35.678, lon: 139.652, tags: { amenity: 'pharmacy', name: 'P3' } },
              { type: 'node', id: 102, lat: 35.679, lon: 139.653, tags: { amenity: 'pharmacy', name: 'P4' } },
              { type: 'node', id: 103, lat: 35.680, lon: 139.654, tags: { amenity: 'pharmacy', name: 'P5' } },
            ],
          }),
        };
      }
      throw new Error(`Unexpected server ${url}`);
    };

    const places = await getNearbyPlaces(
      { latitude: 35.6762, longitude: 139.6503 },
      { fetchFn: mockFetch, bypassCache: true }
    );

    assert.equal(contactedServers[0], OVERPASS_SERVERS[0], 'Must attempt primary server first');
    assert.equal(contactedServers[1], OVERPASS_SERVERS[1], 'Must retry on secondary fallback mirror');
    assert.equal(places.length, 5);
    assert.equal(places[0].name, 'Tokyo Pharmacy');
  });

  await t.test('6. Timeout handling: handles 10-second timeout on primary and fallback mirror', async () => {
    const contactedServers = [];
    const mockFetch = async (url) => {
      contactedServers.push(url);
      // Simulate timeout abort
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    await assert.rejects(
      async () => {
        await getNearbyPlaces(
          { latitude: 1.3521, longitude: 103.8198 },
          { fetchFn: mockFetch, bypassCache: true }
        );
      },
      (err) => {
        assert.ok(
          err.message.includes('Unable to load nearby places from OpenStreetMap'),
          `Error should be friendly: ${err.message}`
        );
        return true;
      }
    );

    assert.equal(contactedServers.length, 2, 'Should have tried primary, then fallback mirror');
  });

  await t.test('7. Malformed data: gracefully rejects when response is not valid JSON or missing elements array', async () => {
    // Malformed JSON (missing elements)
    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ error: 'rate limited by gateway' }),
    });

    await assert.rejects(
      async () => {
        await getNearbyPlaces(
          { latitude: 28.6139, longitude: 77.2090 },
          { fetchFn: mockFetch, bypassCache: true }
        );
      },
      (err) => {
        assert.ok(err.message.includes('Unable to load nearby places'));
        return true;
      }
    );
  });

  await t.test('8. 24-Hour Cache: stores results keyed by rounded coordinates in AsyncStorage and avoids redundant network calls', async () => {
    let networkCalls = 0;
    const mockFetch = async () => {
      networkCalls++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          elements: [
            { type: 'node', id: 1, lat: 37.7749, lon: -122.4194, tags: { amenity: 'pharmacy', name: 'SF Pharmacy 1' } },
            { type: 'node', id: 2, lat: 37.7750, lon: -122.4195, tags: { amenity: 'pharmacy', name: 'SF Pharmacy 2' } },
            { type: 'node', id: 3, lat: 37.7751, lon: -122.4196, tags: { amenity: 'pharmacy', name: 'SF Pharmacy 3' } },
            { type: 'node', id: 4, lat: 37.7752, lon: -122.4197, tags: { amenity: 'pharmacy', name: 'SF Pharmacy 4' } },
            { type: 'node', id: 5, lat: 37.7753, lon: -122.4198, tags: { amenity: 'pharmacy', name: 'SF Pharmacy 5' } },
          ],
        }),
      };
    };

    // First call: populates cache
    const results1 = await getNearbyPlaces(
      { latitude: 37.774929, longitude: -122.419416 },
      { fetchFn: mockFetch }
    );
    assert.equal(networkCalls, 1);
    assert.equal(results1.length, 5);

    // Second call with slightly different coordinates rounding to the same 2 decimals (37.77, -122.42)
    const results2 = await getNearbyPlaces(
      { latitude: 37.774100, longitude: -122.419900 },
      { fetchFn: mockFetch }
    );
    assert.equal(networkCalls, 1, 'Network call must NOT be made when 24h cache is valid');
    assert.equal(results2.length, 5);

    // Bypass cache option triggers network call
    await getNearbyPlaces(
      { latitude: 37.774929, longitude: -122.419416 },
      { fetchFn: mockFetch, bypassCache: true }
    );
    assert.equal(networkCalls, 2);
  });

  await t.test('9. Pharmacy convenience helper & Attribution export', async () => {
    assert.equal(OSM_ATTRIBUTION, '© OpenStreetMap contributors');

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        elements: [
          { type: 'node', id: 1, lat: 10.0, lon: 20.0, tags: { amenity: 'pharmacy', name: 'Pharm A' } },
          { type: 'node', id: 2, lat: 10.1, lon: 20.1, tags: { amenity: 'hospital', name: 'Hosp B' } },
          { type: 'node', id: 3, lat: 10.2, lon: 20.2, tags: { amenity: 'clinic', name: 'Clinic C' } },
          { type: 'node', id: 4, lat: 10.3, lon: 20.3, tags: { amenity: 'pharmacy', name: 'Pharm D' } },
          { type: 'node', id: 5, lat: 10.4, lon: 20.4, tags: { amenity: 'pharmacy', name: 'Pharm E' } },
        ],
      }),
    });

    const pharmacies = await getNearbyPharmacies(
      { latitude: 10.0, longitude: 20.0 },
      { fetchFn: mockFetch, bypassCache: true }
    );

    assert.equal(pharmacies.length, 3);
    assert.ok(pharmacies.every((p) => p.type === 'pharmacy'));
  });
});
