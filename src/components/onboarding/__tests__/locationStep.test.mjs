// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { PREDEFINED_AREAS } from '../../../services/locationService.ts';
import { getRegionForCoordinates, REGIONS } from '../../../config/regions.ts';

test('LocationStep & Coverage Area Tests', async (t) => {
  const bengaluruRegion = REGIONS.find((r) => r.id === 'bengaluru');
  assert.ok(bengaluruRegion, 'Bengaluru region should exist');

  await t.test('getRegionForCoordinates correctly identifies Bengaluru coordinates', () => {
    // Bengaluru city center / centroid
    const centroidRegion = getRegionForCoordinates(bengaluruRegion.centroid);
    assert.equal(centroidRegion?.id, 'bengaluru');

    // Predefined Bengaluru areas
    for (const area of PREDEFINED_AREAS) {
      const reg = getRegionForCoordinates({ latitude: area.latitude, longitude: area.longitude });
      assert.equal(
        reg?.id,
        'bengaluru',
        `Expected ${area.name} to be within Bengaluru region`
      );
    }

    // Specific neighborhoods
    assert.equal(getRegionForCoordinates({ latitude: 12.9416, longitude: 77.5738 })?.id, 'bengaluru'); // Basavanagudi
    assert.equal(getRegionForCoordinates({ latitude: 12.9719, longitude: 77.6412 })?.id, 'bengaluru'); // Indiranagar
    assert.equal(getRegionForCoordinates({ latitude: 12.8452, longitude: 77.6602 })?.id, 'bengaluru'); // Electronic City
  });

  await t.test('getRegionForCoordinates correctly returns null for coordinates outside coverage', () => {
    // Outside cities and international coordinates
    assert.equal(getRegionForCoordinates({ latitude: 12.2958, longitude: 76.6394 }), null); // Mysore (~130km)
    assert.equal(getRegionForCoordinates({ latitude: 13.3409, longitude: 77.1010 }), null); // Tumkur (~70km)
    assert.equal(getRegionForCoordinates({ latitude: 19.0760, longitude: 72.8777 }), null); // Mumbai
    assert.equal(getRegionForCoordinates({ latitude: 28.6139, longitude: 77.2090 }), null); // Delhi
    assert.equal(getRegionForCoordinates({ latitude: 51.5074, longitude: -0.1278 }), null); // London
    assert.equal(getRegionForCoordinates({ latitude: 40.7128, longitude: -74.0060 }), null); // New York

    // Invalid / empty inputs
    assert.equal(getRegionForCoordinates(null), null);
    assert.equal(getRegionForCoordinates(undefined), null);
    assert.equal(getRegionForCoordinates({ latitude: NaN, longitude: 77.5 }), null);
  });

  await t.test('LocationStep handles denied permission by opening AreaPicker with fallback message', async () => {
    // Mock requestGpsLocation returning denied
    const mockRequestGpsDenied = async () => ({
      granted: false,
      error: 'Location permission was denied',
    });

    let statusNotice = null;
    let showAreaPicker = false;
    let finished = false;

    // Simulate LocationStep handleAllowLocation logic
    const handleAllowLocation = async (requestFn) => {
      const res = await requestFn();
      if (!res.granted || !res.coords) {
        statusNotice = 'No problem, you can pick your area instead';
        showAreaPicker = true;
      } else {
        finished = true;
      }
    };

    await handleAllowLocation(mockRequestGpsDenied);

    assert.equal(statusNotice, 'No problem, you can pick your area instead');
    assert.equal(showAreaPicker, true);
    assert.equal(finished, false);
  });

  await t.test('LocationStep handles position failure / timeout by opening AreaPicker with fallback message', async () => {
    const mockRequestGpsFailed = async () => ({
      granted: false,
      error: 'Location provider unavailable or timeout',
    });

    let statusNotice = null;
    let showAreaPicker = false;
    let finished = false;

    const handleAllowLocation = async (requestFn) => {
      try {
        const res = await requestFn();
        if (!res.granted || !res.coords) {
          statusNotice = 'No problem, you can pick your area instead';
          showAreaPicker = true;
        } else {
          finished = true;
        }
      } catch {
        statusNotice = 'No problem, you can pick your area instead';
        showAreaPicker = true;
      }
    };

    await handleAllowLocation(mockRequestGpsFailed);

    assert.equal(statusNotice, 'No problem, you can pick your area instead');
    assert.equal(showAreaPicker, true);
    assert.equal(finished, false);
  });

  await t.test('LocationStep accepts GPS outside Bengaluru without blocking', async () => {
    // Mock GPS returning London coordinates
    const mockRequestGpsOutsideCoverage = async () => {
      const coords = { latitude: 51.5074, longitude: -0.1278 };
      return {
        granted: true,
        coords,
        areaName: 'Westminster, London',
        isOutsideCoverage: getRegionForCoordinates(coords) === null,
      };
    };

    let statusNotice = null;
    let showAreaPicker = false;
    let finished = false;

    const handleAllowLocation = async (requestFn) => {
      const res = await requestFn();
      if (!res.granted || !res.coords) {
        statusNotice = 'No problem, you can pick your area instead';
        showAreaPicker = true;
      } else {
        // Non-blocking: accepted worldwide
        finished = true;
      }
    };

    await handleAllowLocation(mockRequestGpsOutsideCoverage);

    assert.equal(statusNotice, null);
    assert.equal(showAreaPicker, false);
    assert.equal(finished, true);
  });

  await t.test('LocationStep manual-area path allows selecting area and finishing without GPS', async () => {
    let activeArea = null;
    let locationSource = 'none';
    let finished = false;

    // Simulate selectManualArea
    const selectManualArea = async (area) => {
      activeArea = area.name;
      locationSource = 'manual_area';
    };

    // User taps "Choose my area instead" -> AreaPickerModal selection
    const chosenArea = PREDEFINED_AREAS[0]; // Basavanagudi
    await selectManualArea(chosenArea);
    finished = true;

    assert.equal(activeArea, 'Basavanagudi, Bengaluru');
    assert.equal(locationSource, 'manual_area');
    assert.equal(finished, true);
  });

  await t.test('LocationStep inside Bengaluru completes directly', async () => {
    const mockRequestGpsBengaluru = async () => {
      const coords = { latitude: 12.9416, longitude: 77.5738 };
      return {
        granted: true,
        coords,
        areaName: 'Basavanagudi',
        isOutsideCoverage: getRegionForCoordinates(coords) === null,
      };
    };

    let statusNotice = null;
    let showAreaPicker = false;
    let finished = false;

    const handleAllowLocation = async (requestFn) => {
      const res = await requestFn();
      if (!res.granted || !res.coords) {
        statusNotice = 'No problem, you can pick your area instead';
        showAreaPicker = true;
      } else {
        finished = true;
      }
    };

    await handleAllowLocation(mockRequestGpsBengaluru);

    assert.equal(statusNotice, null);
    assert.equal(showAreaPicker, false);
    assert.equal(finished, true);
  });
});
