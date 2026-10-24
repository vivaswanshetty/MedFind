import test from 'node:test';
import assert from 'node:assert/strict';
import { getRecommendations, getHomeGreeting } from '../recommendations.ts';

test('Recommendations - Empty and null profile returns empty array', () => {
  assert.deepEqual(getRecommendations(null), []);
  assert.deepEqual(getRecommendations(undefined), []);
});

test('Recommendations - Profile with no matching rules returns empty array', () => {
  const adultProfile = {
    who: 'me',
    ageGroup: '18to59',
    answers: {
      medicineBox: false,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: false,
      comparesPrices: false,
    },
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  assert.deepEqual(getRecommendations(adultProfile), []);
});

test('Recommendations - Stock issues recommends checking nearby availability', () => {
  const stockProfile = {
    who: 'me',
    ageGroup: '18to59',
    answers: {
      medicineBox: false,
      stockIssues: true,
      buysForFamily: false,
      wantsReminders: false,
      comparesPrices: false,
    },
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  const recs = getRecommendations(stockProfile);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].id, 'rec-stock-availability');
  assert.equal(recs[0].title, 'Check availability near you');
  assert.equal(recs[0].route, '/(tabs)/search');
  assert.match(recs[0].whyReason, /struggled to find a medicine in stock/i);
});

test('Recommendations - Child and minor rules', () => {
  // Case A: who='child' with ageGroup='5to12'
  const childProfile = {
    who: 'child',
    ageGroup: '5to12',
    answers: null,
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  const recsChild = getRecommendations(childProfile);
  assert.equal(recsChild.length, 1);
  assert.equal(recsChild[0].id, 'rec-pediatric-clinic');
  assert.equal(recsChild[0].kind, 'category');
  assert.match(recsChild[0].route, /\(tabs\)\/care/);
  // Verify safety rule: no drug or dosage form suggested
  assert.doesNotMatch(recsChild[0].title, /syrup|drops|paracetamol/i);
  assert.doesNotMatch(recsChild[0].subtitle, /syrup|drops|paracetamol/i);

  // Case B: under5 ageGroup includes the pediatric safety tip
  const under5Profile = {
    who: 'child',
    ageGroup: 'under5',
    answers: null,
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  const recsUnder5 = getRecommendations(under5Profile);
  assert.equal(recsUnder5.length, 2);
  const tip = recsUnder5.find((r) => r.id === 'rec-under5-safety-tip');
  assert.ok(tip);
  assert.equal(tip.kind, 'tip');
  assert.equal(tip.title, 'For your child');
  assert.equal(
    tip.subtitle,
    'Always check the label and ask a pharmacist or doctor before giving any medicine to a young child.'
  );
  assert.equal(tip.route, undefined);

  // Case C: teen ageGroup (13to17)
  const teenProfile = {
    who: 'me',
    ageGroup: '13to17',
    answers: null,
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  const recsTeen = getRecommendations(teenProfile);
  assert.equal(recsTeen.length, 1);
  assert.equal(recsTeen[0].id, 'rec-pediatric-clinic');
});

test('Recommendations - Senior (60plus) rule', () => {
  const seniorProfile = {
    who: 'me',
    ageGroup: '60plus',
    answers: null,
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  const recs = getRecommendations(seniorProfile);
  assert.equal(recs.length, 2);

  const careRec = recs.find((r) => r.id === 'rec-senior-care-directory');
  assert.ok(careRec);
  assert.equal(careRec.kind, 'category');
  assert.equal(careRec.route, '/(tabs)/care');
  // Must NOT describe facilities as chronic care
  assert.doesNotMatch(careRec.subtitle, /chronic care/i);

  const tipRec = recs.find((r) => r.id === 'rec-senior-interactions-tip');
  assert.ok(tipRec);
  assert.equal(tipRec.kind, 'tip');
  assert.equal(
    tipRec.subtitle,
    'Ask a pharmacist about interactions when taking several medicines.'
  );
});

test('Recommendations - Remaining gaps produce zero cards', () => {
  const gapsProfile = {
    who: 'me',
    ageGroup: '18to59',
    answers: {
      medicineBox: false,
      stockIssues: false,
      buysForFamily: true,
      wantsReminders: false,
      comparesPrices: true,
    },
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };
  const recs = getRecommendations(gapsProfile);
  assert.deepEqual(recs, [], 'Remaining gaps (buysForFamily, comparesPrices) should produce no placeholder cards');
});

test('Recommendations - Medicine Box and Reminders cards', () => {
  const baseProfile = {
    who: 'me',
    ageGroup: '18to59',
    buddy: null,
    onboardingComplete: true,
    createdAt: '',
  };

  // Case 1: Only medicineBox === true
  const medBoxOnlyProfile = {
    ...baseProfile,
    answers: {
      medicineBox: true,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: false,
      comparesPrices: false,
    },
  };
  const recsMedBoxOnly = getRecommendations(medBoxOnlyProfile);
  assert.equal(recsMedBoxOnly.length, 1);
  assert.equal(recsMedBoxOnly[0].id, 'rec-medicine-box-only');
  assert.equal(recsMedBoxOnly[0].title, 'Open your medicine box');
  assert.equal(recsMedBoxOnly[0].subtitle, "Track what you have at home so you don't buy twice");
  assert.equal(recsMedBoxOnly[0].kind, 'feature');
  assert.equal(recsMedBoxOnly[0].route, '/medicine-box');

  // Case 2: Only wantsReminders === true
  const remindersOnlyProfile = {
    ...baseProfile,
    answers: {
      medicineBox: false,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: true,
      comparesPrices: false,
    },
  };
  const recsRemindersOnly = getRecommendations(remindersOnlyProfile);
  assert.equal(recsRemindersOnly.length, 1);
  assert.equal(recsRemindersOnly[0].id, 'rec-medicine-reminders-only');
  assert.equal(recsRemindersOnly[0].title, 'Set refill & expiry reminders');
  assert.equal(recsRemindersOnly[0].subtitle, 'Never run out of essentials');
  assert.equal(recsRemindersOnly[0].kind, 'feature');
  assert.equal(recsRemindersOnly[0].route, '/medicine-box');

  // Case 3: Both medicineBox === true AND wantsReminders === true (Show exactly ONE card)
  const bothProfile = {
    ...baseProfile,
    answers: {
      medicineBox: true,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: true,
      comparesPrices: false,
    },
  };
  const recsBoth = getRecommendations(bothProfile);
  assert.equal(recsBoth.length, 1, 'When both are true, exactly one combined card must be shown');
  assert.equal(recsBoth[0].id, 'rec-medicine-box-both');
  assert.equal(recsBoth[0].title, 'My Medicine Box');
  assert.equal(recsBoth[0].subtitle, 'Track your home medicines and get refill reminders');
  assert.equal(recsBoth[0].kind, 'feature');
  assert.equal(recsBoth[0].route, '/medicine-box');

  // Case 4: Neither is true
  const neitherProfile = {
    ...baseProfile,
    answers: {
      medicineBox: false,
      stockIssues: false,
      buysForFamily: false,
      wantsReminders: false,
      comparesPrices: false,
    },
  };
  const recsNeither = getRecommendations(neitherProfile);
  assert.equal(recsNeither.length, 0);
});

test('Recommendations - Home greeting formatting', () => {
  const profileWithCustomName = {
    who: 'me',
    ageGroup: '18to59',
    displayName: 'Aarav',
    buddy: {
      name: 'Remy',
      archetype: 'The Organizer',
      traits: ['Organized'],
      blurb: "I'll keep your medicine box tidy and expiry dates in check.",
    },
    hasSeenFirstHomeVisit: false,
    onboardingComplete: true,
    createdAt: '',
    answers: null,
  };

  // First visit
  const firstVisitGreeting = getHomeGreeting(profileWithCustomName);
  assert.equal(firstVisitGreeting.headline, 'Hi Aarav');
  assert.equal(firstVisitGreeting.caption, 'Remy, The Organizer');
  assert.equal(
    firstVisitGreeting.subline,
    "I'll keep your medicine box tidy and expiry dates in check."
  );
  assert.equal(firstVisitGreeting.isFirstVisit, true);

  // Subsequent visit
  const returningProfile = {
    ...profileWithCustomName,
    hasSeenFirstHomeVisit: true,
  };
  const returningGreeting = getHomeGreeting(returningProfile);
  assert.equal(returningGreeting.headline, 'Hi Aarav');
  assert.equal(returningGreeting.isFirstVisit, false);
  assert.match(returningGreeting.subline, /recommendations/i);

  // Neutral greeting when displayName is not provided
  const anonymousProfile = {
    ...profileWithCustomName,
    displayName: null,
  };
  const anonGreeting = getHomeGreeting(anonymousProfile);
  assert.equal(anonGreeting.headline, 'Welcome');
});

test('Recommendations - Skipped onboarding rule (rec-finish-setup)', () => {
  const timestamp = '2026-10-24T20:00:00.000Z';

  // 1. Show card when onboardingSkippedAt is set and onboardingComplete is false
  const skippedProfile = {
    who: null,
    ageGroup: null,
    answers: null,
    buddy: null,
    onboardingComplete: false,
    onboardingSkippedAt: timestamp,
    dismissedSetupCard: false,
    createdAt: timestamp,
  };
  const recs = getRecommendations(skippedProfile);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].id, 'rec-finish-setup');
  assert.equal(recs[0].title, 'Finish setting up (takes 1 minute)');
  assert.equal(recs[0].route, 'restart-onboarding');
  assert.equal(recs[0].kind, 'feature');
  assert.equal(recs[0].dismissible, true);

  // 2. Hide card when dismissedSetupCard is true
  const dismissedProfile = {
    ...skippedProfile,
    dismissedSetupCard: true,
  };
  const recsDismissed = getRecommendations(dismissedProfile);
  assert.equal(recsDismissed.length, 0, 'Must hide finish-setup card when dismissed');

  // 3. Hide card once onboarding is complete
  const completedProfile = {
    ...skippedProfile,
    onboardingComplete: true,
    dismissedSetupCard: false,
  };
  const recsCompleted = getRecommendations(completedProfile);
  assert.equal(recsCompleted.length, 0, 'Must hide finish-setup card once onboarding is completed');

  // 4. Hide card when onboardingSkippedAt is null
  const regularIncompleteProfile = {
    ...skippedProfile,
    onboardingSkippedAt: null,
  };
  const recsRegular = getRecommendations(regularIncompleteProfile);
  assert.equal(recsRegular.length, 0, 'Must not show finish-setup card if onboarding was not skipped');
});

test('Recommendations - Null and partial profile safety', () => {
  // Case A: Completely empty object
  assert.doesNotThrow(() => getRecommendations({}));
  assert.deepEqual(getRecommendations({}), []);

  // Case B: Profile with all null properties
  const allNullProfile = {
    who: null,
    ageGroup: null,
    answers: null,
    buddy: null,
    buddyName: null,
    buddyTrait: null,
    displayName: null,
    onboardingComplete: false,
    onboardingSkippedAt: null,
    dismissedSetupCard: false,
    createdAt: '',
  };
  assert.doesNotThrow(() => getRecommendations(allNullProfile));
  assert.deepEqual(getRecommendations(allNullProfile), []);

  // Case C: Partial profile with partial answers
  const partialAnswersProfile = {
    ...allNullProfile,
    answers: {
      medicineBox: true,
    },
  };
  const recsPartial = getRecommendations(partialAnswersProfile);
  assert.equal(recsPartial.length, 1);
  assert.equal(recsPartial[0].id, 'rec-medicine-box-only');

  // Case D: getHomeGreeting with null/partial profile
  assert.doesNotThrow(() => getHomeGreeting(null));
  assert.doesNotThrow(() => getHomeGreeting(undefined));
  assert.doesNotThrow(() => getHomeGreeting(allNullProfile));

  const nullGreeting = getHomeGreeting(null);
  assert.equal(nullGreeting.headline, 'Welcome');
  assert.equal(nullGreeting.caption, 'Pip, The Explorer');
  assert.equal(typeof nullGreeting.subline, 'string');
});

