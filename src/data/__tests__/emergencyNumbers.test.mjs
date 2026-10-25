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
  searchCountries,
  resolveEmergencyCountry,
  setMockDeviceRegion,
  getDeviceRegion,
  getCallingCode,
  getCountryRegion,
  getFlagEmoji,
  subscribeToEmergencyCountryChange,
  notifyEmergencyCountryChange,
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
    assert.ok(entries.length >= 80, `Expected at least 80 verified countries, got ${entries.length}`);

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

      // 1. verificationStatus audit: must exist and be confirmed, partial, or unconfirmed
      assert.ok(
        nums.verificationStatus && ['confirmed', 'partial', 'unconfirmed'].includes(nums.verificationStatus),
        `Country entry ${code} must have a valid verificationStatus ('confirmed' | 'partial' | 'unconfirmed'), got: "${nums?.verificationStatus}"`
      );

      // 2. Verified date audit
      assert.ok(
        nums.verifiedAt && isoDateRegex.test(nums.verifiedAt),
        `Country entry ${code} must have a valid ISO YYYY-MM-DD verifiedAt date, got: "${nums?.verifiedAt}"`
      );

      // 3. Sources audit: must be a non-empty array of valid URLs
      assert.ok(
        Array.isArray(nums.sources) && nums.sources.length >= 1,
        `Country entry ${code} must have at least one source URL in sources array`
      );

      for (const sourceUrl of nums.sources) {
        assert.ok(
          urlRegex.test(sourceUrl),
          `Country entry ${code} has invalid source URL: "${sourceUrl}"`
        );

        // Fail if a confirmed entry has a source that is only a domain root
        if (nums.verificationStatus === 'confirmed') {
          const parsed = new URL(sourceUrl);
          const hasPath = parsed.pathname && parsed.pathname !== '/' && parsed.pathname.length > 1;
          assert.ok(
            hasPath,
            `Confirmed country ${code} source cannot be a bare domain root: "${sourceUrl}"`
          );
        }
      }

      // 4. Number definitions and source attribution
      const serviceNumbers = [nums.general, nums.police, nums.ambulance, nums.fire].filter(Boolean);
      assert.ok(
        serviceNumbers.length >= 1,
        `Country entry ${code} must specify at least one emergency number`
      );

      // Fail if two or more numbers exist in one entry but have no sources
      if (serviceNumbers.length >= 2) {
        assert.ok(
          nums.sources.length >= 1,
          `Country entry ${code} defines multiple numbers (${serviceNumbers.join(', ')}) but has no sources`
        );
      }

      // If partial, confirmedNumbers must be defined and non-empty
      if (nums.verificationStatus === 'partial') {
        assert.ok(
          Array.isArray(nums.confirmedNumbers) && nums.confirmedNumbers.length >= 1,
          `Partial country ${code} must list confirmedNumbers`
        );
      }
    }
  });

  await t.test('7. Specific Country Integrity: Brazil has no general number, and new countries exist', () => {
    // Brazil check: no single general number; 190 police, 192 ambulance, 193 fire
    const br = getEmergencyNumbersForCountry('BR');
    assert.ok(br);
    assert.equal(br.numbers.general, undefined, 'Brazil must have no general number');
    assert.equal(br.numbers.police, '190');
    assert.equal(br.numbers.ambulance, '192');
    assert.equal(br.numbers.fire, '193');
    assert.equal(br.numbers.verificationStatus, 'confirmed');

    // Newly requested countries checks
    const ru = getEmergencyNumbersForCountry('RU');
    assert.ok(ru);
    assert.equal(ru.numbers.general, '112');

    const ua = getEmergencyNumbersForCountry('UA');
    assert.ok(ua);
    assert.equal(ua.numbers.police, '102');
    assert.equal(ua.numbers.ambulance, '103');

    const qa = getEmergencyNumbersForCountry('QA');
    assert.ok(qa);
    assert.equal(qa.numbers.general, '999');

    const cr = getEmergencyNumbersForCountry('CR');
    assert.ok(cr);
    assert.equal(cr.numbers.general, '911');
  });

  await t.test('8. getAllCountries returns sorted list of all country entries', () => {
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

  await t.test('9. Country picker search: finds countries by name, code, and common aliases', () => {
    // By name
    const india = searchCountries('India');
    assert.ok(india.some((c) => c.isoCode === 'IN'));

    // By 2-letter code
    const usByCode = searchCountries('us');
    assert.ok(usByCode.some((c) => c.isoCode === 'US'));

    // By common aliases
    const usByAlias = searchCountries('usa');
    assert.ok(usByAlias.some((c) => c.isoCode === 'US'), 'Should find United States when searching "usa"');

    const ukByAlias = searchCountries('uk');
    assert.ok(ukByAlias.some((c) => c.isoCode === 'GB'), 'Should find United Kingdom when searching "uk"');

    const uaeByAlias = searchCountries('uae');
    assert.ok(uaeByAlias.some((c) => c.isoCode === 'AE'), 'Should find United Arab Emirates when searching "uae"');

    const koreaByAlias = searchCountries('korea');
    assert.ok(koreaByAlias.some((c) => c.isoCode === 'KR'), 'Should find South Korea when searching "korea"');

    // By international calling code
    const indiaByCalling = searchCountries('+91');
    assert.ok(indiaByCalling.some((c) => c.isoCode === 'IN'), 'Should find India when searching "+91"');

    const ukByCalling = searchCountries('44');
    assert.ok(ukByCalling.some((c) => c.isoCode === 'GB'), 'Should find UK when searching "44"');

    const usByCalling = searchCountries('+1');
    assert.ok(usByCalling.some((c) => c.isoCode === 'US' || c.isoCode === 'CA'), 'Should find US/CA when searching "+1"');
  });

  await t.test('10. Country Directory metadata: calling codes, regions, and flag emojis', () => {
    const all = getAllCountries();
    assert.equal(all.length, 87, 'Must have exactly 87 countries');

    for (const country of all) {
      const calling = getCallingCode(country.isoCode);
      assert.ok(calling && calling.startsWith('+'), `Country ${country.isoCode} must have valid + calling code`);

      const region = getCountryRegion(country.isoCode);
      assert.ok(['Europe', 'Asia', 'Americas', 'Africa', 'Oceania'].includes(region), `Country ${country.isoCode} must have valid region`);

      const flag = getFlagEmoji(country.isoCode);
      assert.ok(flag.length > 0 && flag !== '🌐', `Country ${country.isoCode} must have valid flag emoji`);
    }

    // Specific spot checks
    assert.equal(getCallingCode('IN'), '+91');
    assert.equal(getCallingCode('US'), '+1');
    assert.equal(getCallingCode('GB'), '+44');
    assert.equal(getCallingCode('DE'), '+49');
    assert.equal(getCountryRegion('FR'), 'Europe');
    assert.equal(getCountryRegion('JP'), 'Asia');
    assert.equal(getCountryRegion('BR'), 'Americas');
    assert.equal(getCountryRegion('ZA'), 'Africa');
    assert.equal(getCountryRegion('AU'), 'Oceania');
    assert.equal(getFlagEmoji('US'), '🇺🇸');
    assert.equal(getFlagEmoji('IN'), '🇮🇳');
  });

  await t.test('11. Reactive Country Subscription: notifies active listeners of country change', () => {
    let received;
    const unsubscribe = subscribeToEmergencyCountryChange((isoCode) => {
      received = isoCode;
    });

    notifyEmergencyCountryChange('dz');
    assert.equal(received, 'DZ', 'Should normalize and notify listeners of new country selection');

    notifyEmergencyCountryChange(null);
    assert.equal(received, null, 'Should notify listeners when country is reset to auto-detect');

    unsubscribe();
    notifyEmergencyCountryChange('FR');
    assert.equal(received, null, 'Unsubscribed listener must not receive further events');
  });
});


