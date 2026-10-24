import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpiryStatus, parseExpiryDate, getExpiryChipInfo, formatRefillDate } from '../medicineBoxStatus.js';

test('ExpiryStatus - None for missing or invalid dates', () => {
  assert.equal(getExpiryStatus(null), 'none');
  assert.equal(getExpiryStatus({}), 'none');
  assert.equal(getExpiryStatus({ expiryDate: '' }), 'none');
  assert.equal(getExpiryStatus({ expiryDate: 'not-a-date' }), 'none');
});

test('ExpiryStatus - Expired when past reference time', () => {
  const now = new Date('2026-10-24T12:00:00Z');
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-10-20' }, now),
    'expired'
  );
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-09' }, now), // Ended Sept 30
    'expired'
  );
});

test('ExpiryStatus - Soon (within 30 days)', () => {
  const now = new Date('2026-10-24T12:00:00Z');
  // 10 days away
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-11-03' }, now),
    'soon'
  );
  // Exactly 25 days away
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-11-18' }, now),
    'soon'
  );
  // Month precision ending Oct 31, 2026 (7 days away)
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-10' }, now),
    'soon'
  );
});

test('ExpiryStatus - OK (> 30 days)', () => {
  const now = new Date('2026-10-24T12:00:00Z');
  // 60 days away
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-12-31' }, now),
    'ok'
  );
  // Far future month
  assert.equal(
    getExpiryStatus({ expiryDate: '2027-06' }, now),
    'ok'
  );
});

test('ExpiryStatus - Month boundaries and leap years', () => {
  // February in a non-leap year (2025)
  const febNonLeap = parseExpiryDate('2025-02');
  assert.equal(febNonLeap.getFullYear(), 2025);
  assert.equal(febNonLeap.getMonth(), 1); // 0-indexed Feb
  assert.equal(febNonLeap.getDate(), 28);

  // February in a leap year (2028)
  const febLeap = parseExpiryDate('2028-02');
  assert.equal(febLeap.getFullYear(), 2028);
  assert.equal(febLeap.getMonth(), 1);
  assert.equal(febLeap.getDate(), 29);

  // Year boundary (Dec 31)
  const decDate = parseExpiryDate('2026-12');
  assert.equal(decDate.getFullYear(), 2026);
  assert.equal(decDate.getMonth(), 11);
  assert.equal(decDate.getDate(), 31);
});

test('ExpiryStatus - getExpiryChipInfo and formatRefillDate formatting', () => {
  const now = new Date('2026-10-24T12:00:00Z');

  // Expired
  const expInfo = getExpiryChipInfo({ expiryDate: '2026-10-20' }, now);
  assert.deepEqual(expInfo, { status: 'expired', tone: 'bad', label: 'Expired' });

  // Soon
  const soonInfo = getExpiryChipInfo({ expiryDate: '2026-11-03' }, now);
  assert.equal(soonInfo?.status, 'soon');
  assert.equal(soonInfo?.tone, 'warn');
  assert.ok(soonInfo?.label.includes('Expires in'));

  // OK
  const okInfo = getExpiryChipInfo({ expiryDate: '2026-12-31' }, now);
  assert.deepEqual(okInfo, { status: 'ok', tone: 'ok', label: 'Expires Dec 2026' });

  // None
  assert.equal(getExpiryChipInfo({ expiryDate: '' }, now), null);
  assert.equal(getExpiryChipInfo(null, now), null);

  // formatRefillDate
  assert.equal(formatRefillDate('2026-11-15'), '15 Nov 2026');
  assert.equal(formatRefillDate('invalid'), null);
  assert.equal(formatRefillDate(null), null);
});

