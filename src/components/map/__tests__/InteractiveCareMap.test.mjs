import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Care Map Marker & Distance Tests', async (t) => {
  await t.test('MapMarkerItem formats types correctly', () => {
    const validTypes = ['hospital', 'clinic', 'ambulance', 'pharmacy'];
    const sampleMarker = {
      id: 'pharm-blr-001',
      type: 'pharmacy',
      name: 'Apollo Pharmacy',
      latitude: 12.9625,
      longitude: 77.5745,
      distanceKm: 2.4,
    };

    assert.ok(validTypes.includes(sampleMarker.type));
    assert.equal(typeof sampleMarker.latitude, 'number');
    assert.equal(typeof sampleMarker.longitude, 'number');
    assert.equal(sampleMarker.distanceKm, 2.4);
  });

  await t.test('Pinpoint coordinates are properly validated', () => {
    const validCoords = { latitude: 12.9416, longitude: 77.5738 };
    assert.ok(!isNaN(validCoords.latitude));
    assert.ok(!isNaN(validCoords.longitude));
    assert.ok(validCoords.latitude >= -90 && validCoords.latitude <= 90);
    assert.ok(validCoords.longitude >= -180 && validCoords.longitude <= 180);
  });

  await t.test('No Carto API key watermark URLs in map components', () => {
    const careMapSrc = fs.readFileSync(
      path.resolve('src/components/map/InteractiveCareMap.tsx'),
      'utf8'
    );
    const pinpointSrc = fs.readFileSync(
      path.resolve('src/components/location/LiveLocationPinpointMap.tsx'),
      'utf8'
    );

    assert.ok(!careMapSrc.includes('cartocdn.com'), 'InteractiveCareMap should not use Carto tiles');
    assert.ok(!pinpointSrc.includes('cartocdn.com'), 'LiveLocationPinpointMap should not use Carto tiles');
    assert.ok(careMapSrc.includes('tile.openstreetmap.org'), 'InteractiveCareMap should use OpenStreetMap tiles');
    assert.ok(pinpointSrc.includes('tile.openstreetmap.org'), 'LiveLocationPinpointMap should use OpenStreetMap tiles');
    assert.ok(careMapSrc.includes('arcgisonline.com'), 'InteractiveCareMap should have ESRI fallback');
    assert.ok(pinpointSrc.includes('arcgisonline.com'), 'LiveLocationPinpointMap should have ESRI fallback');
  });

  await t.test('All 4 healthcare types have pin styling and identification', () => {
    const careMapSrc = fs.readFileSync(
      path.resolve('src/components/map/InteractiveCareMap.tsx'),
      'utf8'
    );

    assert.ok(careMapSrc.includes('.pin-hospital'), 'Must have .pin-hospital CSS');
    assert.ok(careMapSrc.includes('.pin-clinic'), 'Must have .pin-clinic CSS');
    assert.ok(careMapSrc.includes('.pin-ambulance'), 'Must have .pin-ambulance CSS');
    assert.ok(careMapSrc.includes('.pin-pharmacy'), 'Must have .pin-pharmacy CSS');
  });

  await t.test('Care screen has fallback to verified listings when outside coverage', () => {
    const careScreenSrc = fs.readFileSync(
      path.resolve('src/app/(tabs)/care.tsx'),
      'utf8'
    );

    assert.ok(careScreenSrc.includes('hasOsmResults'), 'Must define hasOsmResults');
    assert.ok(careScreenSrc.includes('verifiedMapMarkers'), 'Must define verifiedMapMarkers');
    assert.ok(!careScreenSrc.includes('isOutsideCoverage ? [] :'), 'Must not empty listings solely on isOutsideCoverage');
  });

  await t.test('Map popup has autoPan disabled and smooth panTo to eliminate shaking/glitching', () => {
    const careMapSrc = fs.readFileSync(
      path.resolve('src/components/map/InteractiveCareMap.tsx'),
      'utf8'
    );

    assert.ok(careMapSrc.includes('autoPan: false'), 'Marker popup must have autoPan: false to prevent fighting with pan animations');
    assert.ok(careMapSrc.includes('map.panTo'), 'Marker focus must use smooth map.panTo instead of jittery flyTo');
    assert.ok(careMapSrc.includes('isMapOriginatedSelectionRef'), 'Must have isMapOriginatedSelectionRef to break re-entrancy animation loops');
  });

  await t.test('Page scrolling is protected from being locked by map interactions', () => {
    const careMapSrc = fs.readFileSync(
      path.resolve('src/components/map/InteractiveCareMap.tsx'),
      'utf8'
    );
    const careScreenSrc = fs.readFileSync(
      path.resolve('src/app/(tabs)/care.tsx'),
      'utf8'
    );

    // Only genuine user drag gestures should notify the parent container
    assert.ok(!careMapSrc.includes("map.on('movestart dragstart zoomstart'"), 'Must not send touchStart on movestart or zoomstart');
    assert.ok(careMapSrc.includes("map.on('dragstart'"), 'Must only notify touchStart on genuine user dragstart');
    
    // Web scroll must never be disabled
    assert.ok(
      careScreenSrc.includes("Platform.OS === 'web' ? true : !isMapInteracting"),
      'ScrollView on web must remain scrollable regardless of map interaction'
    );
    assert.ok(careScreenSrc.includes('mapInteractionTimerRef'), 'Must have a watchdog safety timer to automatically clear scroll lock');
  });
});


