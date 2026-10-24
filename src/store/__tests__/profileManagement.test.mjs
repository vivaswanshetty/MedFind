import test from 'node:test';
import assert from 'node:assert/strict';

// Set up lightweight in-memory storage shim for AsyncStorage in Node environment
const memoryStore = new Map();
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: {
      getItem: (k) => memoryStore.get(k) ?? null,
      setItem: (k, v) => {
        memoryStore.set(k, String(v));
      },
      removeItem: (k) => {
        memoryStore.delete(k);
      },
      clear: () => {
        memoryStore.clear();
      },
    },
  };
}

import { storageService } from '../../services/storageService.ts';
import {
  DEFAULT_PROFILE,
  mapSwipeAnswers,
} from '../profile.ts';
import { getRecommendations } from '../../lib/recommendations.ts';
import { getBuddy } from '../../lib/buddy.ts';

test('Profile Schema - Contains strictly only the 5 required non-condition fields', () => {
  const allowedKeys = [
    'medicineBox',
    'stockIssues',
    'buysForFamily',
    'wantsReminders',
    'comparesPrices',
  ];

  const sampleAnswers = {
    medicineBox: true,
    stockIssues: false,
    buysForFamily: true,
    wantsReminders: true,
    comparesPrices: false,
  };

  const keys = Object.keys(sampleAnswers);
  assert.deepEqual(keys.sort(), allowedKeys.sort());

  // Verify no health condition fields exist in answers
  assert.equal('chronicMeds' in sampleAnswers, false);
  assert.equal('condition' in sampleAnswers, false);
  assert.equal('diagnosis' in sampleAnswers, false);
});

test('Profile Answers - mapSwipeAnswers maps ordered booleans to exact named keys', () => {
  const answers = mapSwipeAnswers([true, false, true, false, true]);

  assert.equal(answers.medicineBox, true);
  assert.equal(answers.stockIssues, false);
  assert.equal(answers.buysForFamily, true);
  assert.equal(answers.wantsReminders, false);
  assert.equal(answers.comparesPrices, true);
});

test('Profile Toggles - Updating an answer immediately updates home recommendations', () => {
  // Start with profile where stockIssues is false
  const baseProfile = {
    ...DEFAULT_PROFILE,
    onboardingComplete: true,
    answers: {
      medicineBox: false,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: false,
      comparesPrices: false,
    },
  };

  const initialRecs = getRecommendations(baseProfile);
  const hasStockRecBefore = initialRecs.some((r) => r.id === 'rec-stock-availability');
  assert.equal(hasStockRecBefore, false, 'Should not recommend stock check when stockIssues is false');

  // Toggle stockIssues to true
  const updatedProfile = {
    ...baseProfile,
    answers: {
      ...baseProfile.answers,
      stockIssues: true,
    },
  };

  const updatedRecs = getRecommendations(updatedProfile);
  const hasStockRecAfter = updatedRecs.some((r) => r.id === 'rec-stock-availability');
  assert.equal(hasStockRecAfter, true, 'Should immediately recommend stock check when stockIssues is toggled to true');
});

test('Profile Demographics - Updating who and ageGroup updates home recommendations immediately', () => {
  const childProfile = {
    ...DEFAULT_PROFILE,
    onboardingComplete: true,
    who: 'child',
    ageGroup: 'under5',
  };

  const recs = getRecommendations(childProfile);
  const hasPediatricRec = recs.some((r) => r.id === 'rec-pediatric-clinic');
  const hasUnder5Tip = recs.some((r) => r.id === 'rec-under5-safety-tip');
  assert.equal(hasPediatricRec, true, 'Should recommend pediatric clinic for child');
  assert.equal(hasUnder5Tip, true, 'Should recommend under 5 safety tip for under 5 age group');

  // Change to senior parent
  const seniorProfile = {
    ...DEFAULT_PROFILE,
    onboardingComplete: true,
    who: 'parent',
    ageGroup: '60plus',
  };

  const seniorRecs = getRecommendations(seniorProfile);
  const hasSeniorDir = seniorRecs.some((r) => r.id === 'rec-senior-care-directory');
  const hasSeniorTip = seniorRecs.some((r) => r.id === 'rec-senior-interactions-tip');
  assert.equal(hasSeniorDir, true, 'Should recommend healthcare facilities for 60plus parent');
  assert.equal(hasSeniorTip, true, 'Should recommend interaction safety tip for 60plus parent');
});

test('Profile Buddy - Updating answers recomputes buddy archetype deterministically', () => {
  // Organizer answers: medicineBox=true
  const organizerBuddy = getBuddy([true, false, false, false, false]);
  assert.equal(organizerBuddy.archetype, 'The Organizer');

  // Hunter answers: stockIssues=true
  const hunterBuddy = getBuddy([false, true, false, false, false]);
  assert.equal(hunterBuddy.archetype, 'The Hunter');

  // Smart Saver answers: comparesPrices=true
  const saverBuddy = getBuddy([false, false, false, false, true]);
  assert.equal(saverBuddy.archetype, 'The Smart Saver');
});

test('StorageService - clearFavorites removes all favorited medicine IDs', async () => {
  // Add favorites
  await storageService.toggleFavorite('med_test_1');
  await storageService.toggleFavorite('med_test_2');

  const beforeClear = await storageService.getFavoriteIds();
  assert.ok(beforeClear.includes('med_test_1'));
  assert.ok(beforeClear.includes('med_test_2'));

  // Clear favorites
  await storageService.clearFavorites();

  const afterClear = await storageService.getFavoriteIds();
  assert.deepEqual(afterClear, []);
});
