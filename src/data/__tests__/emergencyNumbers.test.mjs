// Define __DEV__ for Node.js test runner environment
if (typeof globalThis.__DEV__ === 'undefined') {
  globalThis.__DEV__ = false;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EMERGENCY_NUMBERS,
  getEmergencyNumbersForCountry,
  getAllCountries,
  resolveEmergencyCountry,
  setMockDeviceRegion,
  getDeviceRegion,
} from '../emergencyNumbers.ts';
import { getRegionForCoordinates } from '../../config/regions.ts';

test('Emergency Numbers & Country Resolution Tests', async (t) => {
  // Reset mock device region before each subtest
  t.beforeEach(() => {
    setMockDeviceRegion(null);
  });

  await t.test('1. Known country: retrieves verified emergency data with official sources', () => {
    // Test US
    const usData = getEmergencyNumbersForCountry('US');
    assert.ok(usData, 'US emergency data should exist');
    assert.equal(usData.isoCode, 'US');
    assert.equal(usData.name, 'United States');
    assert.equal(usData.numbers.general, '911');
    assert.equal(usData.numbers.police, '911');
    assert.equal(usData.numbers.ambulance, '911');
    assert.equal(usData.numbers.fire, '911');
    assert.ok(usData.numbers.sources.length >= 1, 'US must have at least one official source URL');
    assert.ok(usData.numbers.sources[0].includes('fcc.gov'));
    assert.ok(usData.numbers.verifiedAt.match(/^\d{4}-\d{2}-\d{2}$/));

    // Test UK (GB)
    const gbData = getEmergencyNumbersForCountry('gb'); // case-insensitive check
    assert.ok(gbData, 'GB emergency data should be found case-insensitively');
    assert.equal(gbData.numbers.general, '999');
    assert.ok(gbData.numbers.sources.some((s) => s.includes('gov.uk')));

    // Test Japan (JP) - distinct police (110) & fire/ambulance (119)
    const jpData = getEmergencyNumbersForCountry('JP');
    assert.ok(jpData);
    assert.equal(jpData.numbers.police, '110');
    assert.equal(jpData.numbers.ambulance, '119');
    assert.equal(jpData.numbers.fire, '119');
  });

  await t.test('2. Unknown country: graceful handling for unverified or invalid codes', () => {
    // Non-existent country code
    const invalid = getEmergencyNumbersForCountry('XX');
    assert.equal(invalid, null);

    const empty = getEmergencyNumbersForCountry('');
    assert.equal(empty, null);

    const nullLookup = getEmergencyNumbersForCountry(null);
    assert.equal(nullLookup, null);

    // resolveEmergencyCountry with unknown code
    const resolvedUnknown = resolveEmergencyCountry({
      manualCountryCode: 'XX',
    });
    assert.equal(resolvedUnknown.country, null);
    assert.equal(resolvedUnknown.countryCode, 'XX');
    assert.equal(resolvedUnknown.countryName, 'XX');
    assert.equal(resolvedUnknown.source, 'manual');

    // resolveEmergencyCountry with all nulls
    setMockDeviceRegion(null);
    const resolvedAllEmpty = resolveEmergencyCountry({});
    assert.equal(resolvedAllEmpty.country, null);
    assert.equal(resolvedAllEmpty.countryCode, null);
    assert.equal(resolvedAllEmpty.countryName, 'Unknown');
    assert.equal(resolvedAllEmpty.source, 'unknown');
  });

  await t.test('3. Country resolution priority: manual > GPS > device > unknown', () => {
    setMockDeviceRegion('AU'); // Device says Australia

    // A. Manual override wins over GPS and Device
    const manualResult = resolveEmergencyCountry({
      manualCountryCode: 'FR',
      gpsCountryCode: 'US',
      deviceRegionCode: 'AU',
    });
    assert.equal(manualResult.source, 'manual');
    assert.equal(manualResult.countryCode, 'FR');
    assert.equal(manualResult.country?.name, 'France');

    // B. GPS wins over Device when manual is unset
    const gpsResult = resolveEmergencyCountry({
      gpsCountryCode: 'CA',
      deviceRegionCode: 'AU',
    });
    assert.equal(gpsResult.source, 'gps');
    assert.equal(gpsResult.countryCode, 'CA');
    assert.equal(gpsResult.country?.name, 'Canada');

    // C. Device region used when manual & GPS are unset
    const deviceResult = resolveEmergencyCountry({});
    assert.equal(deviceResult.source, 'device');
    assert.equal(deviceResult.countryCode, 'AU');
    assert.equal(deviceResult.country?.name, 'Australia');

    // D. Unknown fallback when device is also unavailable
    setMockDeviceRegion(null);
    const fallbackResult = resolveEmergencyCountry({});
    assert.equal(fallbackResult.source, 'unknown');
    assert.equal(fallbackResult.countryCode, null);
    assert.equal(fallbackResult.country, null);
  });

  await t.test('4. India inside region: Bengaluru casualty & local helplines shown', () => {
    // User is in India
    const countryCode = 'IN';

    // Coords inside Bengaluru coverage (e.g. Bangalore center 12.9716, 77.5946 or Basavanagudi 12.9416, 77.5738)
    const bengaluruCoords = { latitude: 12.9716, longitude: 77.5946 };
    const region = getRegionForCoordinates(bengaluruCoords);
    assert.ok(region !== null, 'Coordinates should match a region');
    assert.equal(region?.id, 'bengaluru');

    const showBengaluruSpecificContacts = countryCode === 'IN' && region?.id === 'bengaluru';
    assert.equal(
      showBengaluruSpecificContacts,
      true,
      'Bengaluru specific casualty & 104 helpline should show for user in India inside Bengaluru'
    );
  });

  await t.test('5. India outside region: Bengaluru casualty & local helplines hidden', () => {
    const countryCode = 'IN';

    // Mumbai coordinates (19.0760, 72.8777)
    const mumbaiCoords = { latitude: 19.0760, longitude: 72.8777 };
    const mumbaiRegion = getRegionForCoordinates(mumbaiCoords);
    assert.equal(mumbaiRegion, null, 'Mumbai coordinates are outside Bengaluru coverage');

    const showInMumbai = countryCode === 'IN' && mumbaiRegion?.id === 'bengaluru';
    assert.equal(
      showInMumbai,
      false,
      'Bengaluru casualty should NOT show for user in India outside Bengaluru'
    );

    // Delhi coordinates (28.6139, 77.2090)
    const delhiCoords = { latitude: 28.6139, longitude: 77.2090 };
    const delhiRegion = getRegionForCoordinates(delhiCoords);
    assert.equal(delhiRegion, null);

    const showInDelhi = countryCode === 'IN' && delhiRegion?.id === 'bengaluru';
    assert.equal(showInDelhi, false);

    // Null user coordinates
    const noCoords = null;
    const noRegion = getRegionForCoordinates(noCoords);
    assert.equal(noRegion, null);
    const showWithoutCoords = countryCode === 'IN' && noRegion?.id === 'bengaluru';
    assert.equal(showWithoutCoords, false);

    // Non-India country with Bengaluru coordinates (e.g., user selected US manually while in Bengaluru)
    const usCountryInBengaluru = 'US';
    const bengaluruCoords = { latitude: 12.9716, longitude: 77.5946 };
    function regionMatchesBengaluru(coords) {
      return getRegionForCoordinates(coords)?.id === 'bengaluru';
    }
    const showForUsInBengaluru = usCountryInBengaluru === 'IN' && regionMatchesBengaluru(bengaluruCoords);
    assert.equal(showForUsInBengaluru, false, 'Non-India country must never show Bengaluru casualty');
  });

  await t.test('6. AUDIT: Every entry in emergency table must have official source and verifiedAt', () => {
    const entries = Object.entries(EMERGENCY_NUMBERS);
    assert.ok(entries.length >= 50, `Expected at least 50 verified countries, got ${entries.length}`);

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const urlRegex = /^https?:\/\/.+/;

    for (const [code, entry] of entries) {
      assert.equal(
        entry.isoCode,
        code,
        `Country entry ${code} has mismatched isoCode ${entry.isoCode}`
      );
      assert.ok(
        entry.name && entry.name.trim().length > 0,
        `Country entry ${code} must have a non-empty name`
      );

      const nums = entry.numbers;
      assert.ok(nums, `Country entry ${code} is missing numbers object`);

      // Verified date audit
      assert.ok(
        nums.verifiedAt && isoDateRegex.test(nums.verifiedAt),
        `Country entry ${code} must have a valid ISO YYYY-MM-DD verifiedAt date, got: "${nums?.verifiedAt}"`
      );

      // Sources audit: must be a non-empty array of valid URLs
      assert.ok(
        Array.isArray(nums.sources) && nums.sources.length >= 1,
        `Country entry ${code} must have at least one source URL in sources array`
      );

      for (const sourceUrl of nums.sources) {
        assert.ok(
          urlRegex.test(sourceUrl),
          `Country entry ${code} has invalid source URL: "${sourceUrl}"`
        );
      }

      // At least one valid emergency dialer number
      const hasNumber = Boolean(nums.general || nums.police || nums.ambulance || nums.fire);
      assert.ok(
        hasNumber,
        `Country entry ${code} must specify at least one emergency number (general, police, ambulance, fire)`
      );
    }
  });

  await t.test('7. getAllCountries returns sorted list of all country entries', () => {
    const list = getAllCountries();
    assert.equal(list.length, Object.keys(EMERGENCY_NUMBERS).length);

    // Verify alphabetical sorting by country name
    for (let i = 1; i < list.length; i++) {
      assert.ok(
        list[i - 1].name.localeCompare(list[i].name) <= 0,
        `Countries should be sorted alphabetically: "${list[i - 1].name}" vs "${list[i].name}"`
      );
    }
  });
});
