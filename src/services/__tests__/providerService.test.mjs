import test from 'node:test';
import assert from 'node:assert/strict';
import { getProviderListings } from '../providerService.ts';

test('Provider Directory Service Tests', async (t) => {
  await t.test('Fetches all directory categories without blending', async () => {
    const res = await getProviderListings('all');
    assert(['database', 'demo'].includes(res.dataSource));
    assert(res.results.length > 0, 'Should return provider listings');

    // Verify all listings have required directory fields
    for (const item of res.results) {
      assert(item.id, 'Must have id');
      assert(item.name, 'Must have name');
      assert(item.address, 'Must have address');
      assert(item.type, 'Must have type');
      assert(item.source, 'Must have source');
      assert(item.reviewed_at, 'Must have reviewed_at timestamp');
    }
  });

  await t.test('Filters correctly by hospital category', async () => {
    const res = await getProviderListings('hospital');
    assert(res.results.length > 0, 'Should find hospitals');
    for (const item of res.results) {
      assert.equal(item.type, 'hospital');
    }
  });

  await t.test('Filters correctly by clinic category', async () => {
    const res = await getProviderListings('clinic');
    assert(res.results.length > 0, 'Should find clinics');
    for (const item of res.results) {
      assert.equal(item.type, 'clinic');
    }
  });

  await t.test('Filters correctly by ambulance category', async () => {
    const res = await getProviderListings('ambulance');
    assert(res.results.length > 0, 'Should find ambulance contacts');
    for (const item of res.results) {
      assert.equal(item.type, 'ambulance');
    }
  });

  await t.test('Demo records are explicitly flagged and have inactive contact strings', async () => {
    const res = await getProviderListings('all');
    const demoItems = res.results.filter((i) => i.is_demo);
    for (const item of demoItems) {
      assert.equal(item.is_demo, true);
      assert.match(item.phone, /No Call Action|Demo|Inactive/i);
    }
  });
});
