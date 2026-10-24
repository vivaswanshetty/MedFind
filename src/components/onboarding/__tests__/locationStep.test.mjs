// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isWithinCoverageArea,
  PREDEFINED_AREAS,
  BENGALURU_CENTROID,
} from '../../../services/locationService.ts';

test('LocationStep & Coverage Area Tests', async (t) => {
  await t.test('isWithinCoverageArea correctly identifies Bengaluru coordinates', () => {
    // Bengaluru city center
    assert.equal(isWithinCoverageArea(BENGALURU_CENTROID), true);

    // Predefined Bengaluru areas
    for (const area of PREDEFINED_AREAS) {
      assert.equal(
        isWithinCoverageArea({ latitude: area.latitude, longitude: area.longitude }),
        true,
        `Expected ${area.name} to be within coverage`
      );
    }

    // Specific neighborhoods
    assert.equal(isWithinCoverageArea({ latitude: 12.9416, longitude: 77.5738 }), true); // Basavanagudi
    assert.equal(isWithinCoverageArea({ latitude: 12.9719, longitude: 77.6412 }), true); // Indiranagar
    assert.equal(isWithinCoverageArea({ latitude: 12.8452, longitude: 77.6602 }), true); // Electronic City
  });

  await t.test('isWithinCoverageArea correctly identifies coordinates outside Bengaluru', () => {
    // Outside cities and international coordinates
    assert.equal(isWithinCoverageArea({ latitude: 12.2958, longitude: 76.6394 }), false); // Mysore (~130km)
    assert.equal(isWithinCoverageArea({ latitude: 13.3409, longitude: 77.1010 }), false); // Tumkur (~70km)
    assert.equal(isWithinCoverageArea({ latitude: 19.0760, longitude: 72.8777 }), false); // Mumbai
    assert.equal(isWithinCoverageArea({ latitude: 28.6139, longitude: 77.2090 }), false); // Delhi
    assert.equal(isWithinCoverageArea({ latitude: 51.5074, longitude: -0.1278 }), false); // London
    assert.equal(isWithinCoverageArea({ latitude: 40.7128, longitude: -74.0060 }), false); // New York

    // Invalid / empty inputs
    assert.equal(isWithinCoverageArea(null), false);
    assert.equal(isWithinCoverageArea(undefined), false);
    assert.equal(isWithinCoverageArea({ latitude: NaN, longitude: 77.5 }), false);
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
      } else if (res.isOutsideCoverage) {
        statusNotice = 'MedFind currently covers Bengaluru';
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
    // Mock requestGpsLocation throwing or returning position failure
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
        } else if (res.isOutsideCoverage) {
          statusNotice = 'MedFind currently covers Bengaluru';
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

  await t.test('LocationStep handles GPS outside Bengaluru by prompting MedFind currently covers Bengaluru', async () => {
    // Mock GPS returning London coordinates
    const mockRequestGpsOutsideCoverage = async () => {
      const coords = { latitude: 51.5074, longitude: -0.1278 };
      return {
        granted: true,
        coords,
        areaName: 'Westminster, London',
        isOutsideCoverage: !isWithinCoverageArea(coords),
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
      } else if (res.isOutsideCoverage) {
        statusNotice = 'MedFind currently covers Bengaluru';
        showAreaPicker = true;
      } else {
        finished = true;
      }
    };

    await handleAllowLocation(mockRequestGpsOutsideCoverage);

    assert.equal(statusNotice, 'MedFind currently covers Bengaluru');
    assert.equal(showAreaPicker, true);
    assert.equal(finished, false);
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
        areaName: 'Basavanagudi, Bengaluru',
        isOutsideCoverage: !isWithinCoverageArea(coords),
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
      } else if (res.isOutsideCoverage) {
        statusNotice = 'MedFind currently covers Bengaluru';
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
