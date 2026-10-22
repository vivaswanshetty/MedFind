import test from 'node:test';
import assert from 'node:assert/strict';
import { searchMedicineStock } from '../medicineSearch.ts';

test('Medicine Search Data Layer & Fallback Tests', async (t) => {
  await t.test('Returns unblended essential medicine catalog when database has 0 snapshots', async () => {
    const res = await searchMedicineStock('Paracetamol', 'All');
    
    // Check data source
    assert.equal(res.dataSource, 'demo');
    assert(res.results.length > 0, 'Should find NLEM Paracetamol records');

    // Verify all items are un-reported catalog items with verified source attribution
    for (const item of res.results) {
      assert.equal(item.isReported, false);
      assert.equal(item.state, 'unknown');
      assert.equal(item.freshness.badgeLabel, 'Availability not reported');
      assert.equal(item.sourceName, 'National List of Essential Medicines (NLEM India 2022)');
      assert.equal(item.sourceUrl, 'https://cdsco.gov.in');
      assert.match(item.genericName.toLowerCase(), /paracetamol/);
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

  await t.test('No unverified record uses "In Stock" or invented contact numbers', async () => {
    const res = await searchMedicineStock('', 'All');
    for (const item of res.results) {
      // Must not contain "In Stock" in badge or guidance
      assert.doesNotMatch(item.freshness.badgeLabel, /In Stock/i);
      assert.doesNotMatch(item.freshness.guidanceText, /confirmed by store/i);
      // No fictional phone numbers for unreported catalog entries
      assert.equal(item.pharmacyPhone, '');
    }
  });
});
