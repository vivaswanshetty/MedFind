import test from 'node:test';
import assert from 'node:assert/strict';
import { searchMedicineStock } from '../medicineSearch.ts';

test('Medicine Search Data Layer & Fallback Tests', async (t) => {
  await t.test('Returns verified pharmacy stock when reported snapshots exist', async () => {
    const res = await searchMedicineStock('Paracetamol', 'All');
    
    // Check data source
    assert.equal(res.dataSource, 'demo');
    assert(res.results.length > 0, 'Should find Paracetamol records');

    // Verify reported items reflect real participating pharmacies
    const reported = res.results.filter((item) => item.isReported);
    assert.ok(reported.length > 0, 'Should contain verified reported pharmacy stock');

    for (const item of reported) {
      assert.equal(item.isReported, true);
      assert.ok(item.pharmacyPhone, 'Reported store must have real phone number');
      assert.ok(item.pharmacyName, 'Reported store must have real store name');
      assert.ok(item.pharmacyAddress, 'Reported store must have real address');
      assert.match(item.genericName.toLowerCase(), /paracetamol/);
    }
  });

  await t.test('Correctly identifies catalog medicines without reported snapshots as unreported', async () => {
    const res = await searchMedicineStock('Famocid', 'All');
    assert.equal(res.dataSource, 'demo');
    assert(res.results.length > 0, 'Should find Famocid in catalog');

    for (const item of res.results) {
      assert.equal(item.isReported, false);
      assert.equal(item.state, 'unknown');
      assert.equal(item.freshness.badgeLabel, 'Availability not reported');
      assert.equal(item.pharmacyPhone, '');
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

  await t.test('No unverified catalog record uses "In Stock" or invented contact numbers', async () => {
    const res = await searchMedicineStock('', 'All');
    const unreported = res.results.filter((item) => !item.isReported);
    assert.ok(unreported.length > 0, 'Catalog should contain medicines pending store report');

    for (const item of unreported) {
      // Must not contain "In Stock" in badge or guidance
      assert.doesNotMatch(item.freshness.badgeLabel, /In Stock/i);
      assert.doesNotMatch(item.freshness.guidanceText, /confirmed by store/i);
      // No fictional phone numbers for unreported catalog entries
      assert.equal(item.pharmacyPhone, '');
    }
  });
});
