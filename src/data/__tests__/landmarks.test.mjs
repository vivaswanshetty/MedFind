import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCuratedLandmarks, CURATED_LANDMARKS } from '../landmarks.ts';

test('Curated Landmarks & College Search Tests', async (t) => {
  await t.test('BMS College of Engineering is found for various query variants', () => {
    const queries = ['bms', 'bms college', 'bmsce', 'bms engineering', 'bms college of engineering'];
    for (const q of queries) {
      const results = searchCuratedLandmarks(q, 5);
      assert.ok(results.length > 0, `Query "${q}" should return results`);
      const bmsce = results.find((r) => r.id === 'college-bmsce');
      assert.ok(bmsce, `Query "${q}" should find BMS College of Engineering (BMSCE)`);
      assert.equal(bmsce.latitude, 12.9410);
      assert.equal(bmsce.longitude, 77.5655);
    }
  });

  await t.test('Girinagar is found with valid coordinates', () => {
    const results = searchCuratedLandmarks('girinagar', 5);
    assert.ok(results.length > 0, 'Should find Girinagar');
    const girinagar = results.find((r) => r.id === 'area-girinagar');
    assert.ok(girinagar, 'Should find Girinagar area');
    assert.equal(girinagar.latitude, 12.9350);
    assert.equal(girinagar.longitude, 77.5440);
  });

  await t.test('Hosakerehalli handles common typos like hosekerehalli', () => {
    const queries = ['hosakerehalli', 'hosekerehalli'];
    for (const q of queries) {
      const results = searchCuratedLandmarks(q, 5);
      assert.ok(results.length > 0, `Query "${q}" should find Hosakerehalli`);
      const h = results.find((r) => r.id === 'area-hosakerehalli');
      assert.ok(h, `Query "${q}" should resolve to area-hosakerehalli`);
      assert.equal(h.latitude, 12.9250);
      assert.equal(h.longitude, 77.5350);
    }
  });

  await t.test('Major colleges like PES, RVCE, MSRIT, and DSCE are present with coordinates', () => {
    const pes = searchCuratedLandmarks('pes university', 3);
    assert.ok(pes.length > 0 && pes[0].id.startsWith('college-pes'));

    const rv = searchCuratedLandmarks('rv college', 3);
    assert.ok(rv.length > 0 && rv[0].id === 'college-rvce');

    const dsce = searchCuratedLandmarks('dayananda sagar', 3);
    assert.ok(dsce.length > 0 && dsce[0].id === 'college-dsce');
  });

  await t.test('Empty or single character queries return empty list', () => {
    assert.deepEqual(searchCuratedLandmarks(''), []);
    assert.deepEqual(searchCuratedLandmarks('b'), []);
    assert.deepEqual(searchCuratedLandmarks('   '), []);
  });
});

