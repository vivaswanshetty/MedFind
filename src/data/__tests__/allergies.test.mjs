import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMON_ALLERGIES,
  ALL_ALLERGENS,
  searchAllergies,
} from '../allergies.ts';

test('Allergy Data & Search Tests', async (t) => {
  await t.test('COMMON_ALLERGIES contains the 9 primary common allergies', () => {
    assert.equal(COMMON_ALLERGIES.length, 9);
    assert.ok(COMMON_ALLERGIES.includes('Penicillin'));
    assert.ok(COMMON_ALLERGIES.includes('Aspirin'));
    assert.ok(COMMON_ALLERGIES.includes('Sulfa drugs'));
    assert.ok(COMMON_ALLERGIES.includes('Latex'));
    assert.ok(COMMON_ALLERGIES.includes('Peanuts'));
    assert.ok(COMMON_ALLERGIES.includes('Shellfish'));
    assert.ok(COMMON_ALLERGIES.includes('Dairy'));
    assert.ok(COMMON_ALLERGIES.includes('Gluten'));
    assert.ok(COMMON_ALLERGIES.includes('None'));
  });

  await t.test('ALL_ALLERGENS is populated with comprehensive medical & environmental allergies', () => {
    assert.ok(ALL_ALLERGENS.length >= 30);
    assert.ok(ALL_ALLERGENS.includes('Amoxicillin'));
    assert.ok(ALL_ALLERGENS.includes('Ibuprofen'));
    assert.ok(ALL_ALLERGENS.includes('Paracetamol (Acetaminophen)'));
    assert.ok(ALL_ALLERGENS.includes('Dust mites'));
    assert.ok(ALL_ALLERGENS.includes('Bee venom & Wasp stings'));
  });

  await t.test('searchAllergies returns prefix matches first', () => {
    const results = searchAllergies('pen');
    assert.ok(results.length > 0);
    assert.equal(results[0], 'Penicillin');
  });

  await t.test('searchAllergies matches case-insensitively and returns substring matches', () => {
    const results = searchAllergies('cillin');
    assert.ok(results.length >= 2);
    assert.ok(results.includes('Penicillin'));
    assert.ok(results.includes('Amoxicillin'));
    assert.ok(results.includes('Ampicillin'));
  });

  await t.test('searchAllergies returns default list when query is empty', () => {
    const results = searchAllergies('');
    assert.ok(results.length > 0);
    assert.ok(results.length <= 12);
  });

  await t.test('searchAllergies respects custom maxResults limit', () => {
    const results = searchAllergies('a', 5);
    assert.ok(results.length <= 5);
  });
});

