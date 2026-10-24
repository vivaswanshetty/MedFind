import test from 'node:test';
import assert from 'node:assert/strict';
import { mapSwipeAnswers, DEFAULT_PROFILE } from '../profile.ts';

test('Profile Store - DEFAULT_PROFILE integrity', () => {
  assert.equal(DEFAULT_PROFILE.onboardingComplete, false);
  assert.equal(DEFAULT_PROFILE.onboardingSkippedAt, null);
  assert.equal(DEFAULT_PROFILE.dismissedSetupCard, false);
  assert.equal(DEFAULT_PROFILE.who, null);
  assert.equal(DEFAULT_PROFILE.ageGroup, null);
  assert.equal(DEFAULT_PROFILE.answers, null);
  assert.equal(DEFAULT_PROFILE.buddy, null);
  assert.equal(DEFAULT_PROFILE.buddyName, null);
  assert.equal(DEFAULT_PROFILE.buddyTrait, null);
  assert.equal(DEFAULT_PROFILE.hasSeenFirstHomeVisit, false);
});

test('Profile Store - Skipping onboarding leaves onboardingComplete false and sets onboardingSkippedAt', () => {
  const timestamp = new Date().toISOString();
  const skippedProfile = {
    ...DEFAULT_PROFILE,
    onboardingSkippedAt: timestamp,
  };

  assert.equal(skippedProfile.onboardingComplete, false, 'onboardingComplete must remain false after skip');
  assert.equal(skippedProfile.onboardingSkippedAt, timestamp, 'onboardingSkippedAt must hold ISO string');
  assert.equal(skippedProfile.who, null, 'Guest profile must have null who');
  assert.equal(skippedProfile.ageGroup, null, 'Guest profile must have null ageGroup');
  assert.equal(skippedProfile.answers, null, 'Guest profile must have null answers');
  assert.equal(skippedProfile.buddy, null, 'Guest profile must have null buddy');
});

test('Profile Store - mapSwipeAnswers card order mapping', () => {
  // 1. All true
  const allTrue = mapSwipeAnswers([true, true, true, true, true]);
  assert.deepEqual(allTrue, {
    medicineBox: true,
    stockIssues: true,
    buysForFamily: true,
    wantsReminders: true,
    comparesPrices: true,
  });

  // 2. All false
  const allFalse = mapSwipeAnswers([false, false, false, false, false]);
  assert.deepEqual(allFalse, {
    medicineBox: false,
    stockIssues: false,
    buysForFamily: false,
    wantsReminders: false,
    comparesPrices: false,
  });

  // 3. Selective card ordering:
  // Card 1: medicineBox = true
  // Card 2: stockIssues = false
  // Card 3: buysForFamily = true
  // Card 4: wantsReminders = false
  // Card 5: comparesPrices = true
  const mixed = mapSwipeAnswers([true, false, true, false, true]);
  assert.equal(mixed.medicineBox, true, 'Card 1 must map to medicineBox');
  assert.equal(mixed.stockIssues, false, 'Card 2 must map to stockIssues');
  assert.equal(mixed.buysForFamily, true, 'Card 3 must map to buysForFamily');
  assert.equal(mixed.wantsReminders, false, 'Card 4 must map to wantsReminders');
  assert.equal(mixed.comparesPrices, true, 'Card 5 must map to comparesPrices');

  // 4. Inverted mixed
  const inverted = mapSwipeAnswers([false, true, false, true, false]);
  assert.equal(inverted.medicineBox, false);
  assert.equal(inverted.stockIssues, true);
  assert.equal(inverted.buysForFamily, false);
  assert.equal(inverted.wantsReminders, true);
  assert.equal(inverted.comparesPrices, false);

  // 5. Handling partial array with falsy defaults
  const partial = mapSwipeAnswers([true]);
  assert.equal(partial.medicineBox, true);
  assert.equal(partial.stockIssues, false);
  assert.equal(partial.buysForFamily, false);
  assert.equal(partial.wantsReminders, false);
  assert.equal(partial.comparesPrices, false);
});
