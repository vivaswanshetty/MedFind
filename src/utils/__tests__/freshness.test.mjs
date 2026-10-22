import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFreshness } from '../freshness.ts';

test('Freshness boundary tests for MedFind', async (t) => {
  const baseTime = new Date('2026-10-22T12:00:00.000Z');

  await t.test('Recent state: <= 30 minutes', () => {
    // Exact same time (0 min)
    const res0 = calculateFreshness('2026-10-22T12:00:00.000Z', baseTime);
    assert.equal(res0.state, 'recent');
    assert.equal(res0.requiresCallFirst, false);
    assert.match(res0.badgeLabel, /Recent/);

    // 15 minutes ago
    const res15 = calculateFreshness('2026-10-22T11:45:00.000Z', baseTime);
    assert.equal(res15.state, 'recent');
    assert.equal(res15.requiresCallFirst, false);
    assert.equal(res15.ageMinutes, 15);

    // Exactly 30 minutes ago (boundary inclusive)
    const res30 = calculateFreshness('2026-10-22T11:30:00.000Z', baseTime);
    assert.equal(res30.state, 'recent');
    assert.equal(res30.requiresCallFirst, false);
    assert.equal(res30.ageMinutes, 30);
  });

  await t.test('Aging state: > 30 minutes and <= 120 minutes (2 hours)', () => {
    // 31 minutes ago
    const res31 = calculateFreshness('2026-10-22T11:29:00.000Z', baseTime);
    assert.equal(res31.state, 'aging');
    assert.equal(res31.requiresCallFirst, true);
    assert.match(res31.badgeLabel, /Aging/);

    // 60 minutes ago (1 hour)
    const res60 = calculateFreshness('2026-10-22T11:00:00.000Z', baseTime);
    assert.equal(res60.state, 'aging');
    assert.equal(res60.requiresCallFirst, true);
    assert.equal(res60.ageMinutes, 60);

    // Exactly 120 minutes ago (2 hours boundary inclusive)
    const res120 = calculateFreshness('2026-10-22T10:00:00.000Z', baseTime);
    assert.equal(res120.state, 'aging');
    assert.equal(res120.requiresCallFirst, true);
    assert.equal(res120.ageMinutes, 120);
  });

  await t.test('Stale state: > 120 minutes (> 2 hours)', () => {
    // 121 minutes ago
    const res121 = calculateFreshness('2026-10-22T09:59:00.000Z', baseTime);
    assert.equal(res121.state, 'stale');
    assert.equal(res121.requiresCallFirst, true);
    assert.match(res121.badgeLabel, /Stale/);

    // 24 hours ago
    const res24h = calculateFreshness('2026-10-21T12:00:00.000Z', baseTime);
    assert.equal(res24h.state, 'stale');
    assert.equal(res24h.requiresCallFirst, true);
    assert.equal(res24h.ageMinutes, 1440);
  });

  await t.test('Unknown fallback for missing, invalid or empty inputs', () => {
    // Null
    const resNull = calculateFreshness(null, baseTime);
    assert.equal(resNull.state, 'unknown');
    assert.equal(resNull.requiresCallFirst, true);
    assert.match(resNull.badgeLabel, /Unknown/);

    // Undefined
    const resUndefined = calculateFreshness(undefined, baseTime);
    assert.equal(resUndefined.state, 'unknown');
    assert.equal(resUndefined.requiresCallFirst, true);

    // Empty string
    const resEmpty = calculateFreshness('   ', baseTime);
    assert.equal(resEmpty.state, 'unknown');
    assert.equal(resEmpty.requiresCallFirst, true);

    // Garbage date string
    const resInvalid = calculateFreshness('not-a-valid-timestamp', baseTime);
    assert.equal(resInvalid.state, 'unknown');
    assert.equal(resInvalid.requiresCallFirst, true);
  });

  await t.test('Preserves raw timestamp in output', () => {
    const raw = '2026-10-22T11:42:15.000Z';
    const res = calculateFreshness(raw, baseTime);
    assert.equal(res.rawTimestamp, raw);
  });
});
