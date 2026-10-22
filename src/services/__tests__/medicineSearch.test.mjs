import test from 'node:test';
import assert from 'node:assert/strict';
import { searchMedicineStock } from '../medicineSearch.ts';

test('Medicine Search Data Layer & Fallback Tests', async (t) => {
  await t.test('Returns unblended demo data when database has 0 snapshots', async () => {
    const res = await searchMedicineStock('Paracetamol', 'All');
    
    // Check data source
    assert.equal(res.dataSource, 'demo');
    assert(res.results.length > 0, 'Should find demo Paracetamol records');

    // Verify all items are marked isDemo and have valid freshness
    for (const item of res.results) {
      assert.equal(item.isDemo, true);
      assert.match(item.genericName.toLowerCase(), /paracetamol/);
      assert(item.freshness, 'Each item must have a freshness calculation');
      assert.notEqual(item.freshness.state, undefined);
      assert(item.freshness.isSimulated, 'Demo items must have simulated freshness flag');
    }
  });

  await t.test('Filters correctly by dosage form', async () => {
    const resInhaler = await searchMedicineStock('', 'Inhaler');
    assert.equal(resInhaler.dataSource, 'demo');
    assert(resInhaler.results.length > 0, 'Should find inhaler records');

    for (const item of resInhaler.results) {
      assert.equal(item.dosageForm?.toLowerCase(), 'inhaler');
    }

    const resCapsule = await searchMedicineStock('', 'Capsule');
    for (const item of resCapsule.results) {
      assert.equal(item.dosageForm?.toLowerCase(), 'capsule');
    }
  });

  await t.test('Handles empty search results cleanly without blending', async () => {
    const resNonExistent = await searchMedicineStock('NonExistentMedicineNameXYZ', 'All');
    assert.equal(resNonExistent.results.length, 0);
  });

  await t.test('No demo record uses "In Stock" or implies real store confirmation', async () => {
    const res = await searchMedicineStock('', 'All');
    for (const item of res.results) {
      // Must not contain "In Stock" in badge or guidance
      assert.doesNotMatch(item.freshness.badgeLabel, /In Stock/i);
      assert.doesNotMatch(item.freshness.guidanceText, /confirmed by store/i);
      // Phone numbers must be inactive demo placeholders
      assert.match(item.pharmacyPhone, /Inactive Number|No Call Action/i);
    }
  });
});
