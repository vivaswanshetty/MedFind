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
    getExpiryStatus({ expiryDate: '2026-09-15' }, now), // Ended Sept 30
    'expired'
  );
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-09' }, now), // Ended Sept 30
    'expired'
  );
});

test('ExpiryStatus - Month-precision expiry for March 2027 (first and last day of month)', () => {
  const firstDay = { expiryDate: '2027-03-01' };
  const lastDay = { expiryDate: '2027-03-31' };
  const monthOnly = { expiryDate: '2027-03' };
  const textMonth = { expiryDate: 'March 2027' };

  // Before 1 April 2027 (e.g. 31 March 2027 at 12:00 noon local), must NOT show Expired
  const march31 = new Date(2027, 2, 31, 12, 0, 0);
  assert.notEqual(getExpiryStatus(firstDay, march31), 'expired');
  assert.notEqual(getExpiryStatus(lastDay, march31), 'expired');
  assert.notEqual(getExpiryStatus(monthOnly, march31), 'expired');
  assert.notEqual(getExpiryStatus(textMonth, march31), 'expired');

  // On or after 1 April 2027 (e.g. 1 April 2027 at 00:00:01 local), must show Expired
  const april1 = new Date(2027, 3, 1, 0, 0, 1);
  assert.equal(getExpiryStatus(firstDay, april1), 'expired');
  assert.equal(getExpiryStatus(lastDay, april1), 'expired');
  assert.equal(getExpiryStatus(monthOnly, april1), 'expired');
  assert.equal(getExpiryStatus(textMonth, april1), 'expired');
});

test('ExpiryStatus - Soon (within 30 days)', () => {
  const now = new Date(2026, 9, 24, 12, 0, 0); // Oct 24, 2026
  // Month precision ending Oct 31, 2026 (7 days away)
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-10-31' }, now),
    'soon'
  );
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-10' }, now),
    'soon'
  );
  assert.equal(
    getExpiryStatus({ expiryDate: 'October 2026' }, now),
    'soon'
  );

  // When reference is Nov 10, 2026: November ends Nov 30 (20 days away)
  const novNow = new Date(2026, 10, 10, 12, 0, 0);
  assert.equal(
    getExpiryStatus({ expiryDate: '2026-11-03' }, novNow), // ends Nov 30
    'soon'
  );
});

test('ExpiryStatus - OK (> 30 days)', () => {
  const now = new Date(2026, 9, 24, 12, 0, 0);
  // Dec 2026 ends Dec 31 (68 days away)
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
  const now = new Date(2026, 9, 24, 12, 0, 0); // Oct 24, 2026

  // Expired (ended Sept 30, 2026)
  const expInfo = getExpiryChipInfo({ expiryDate: '2026-09-15' }, now);
  assert.deepEqual(expInfo, { status: 'expired', tone: 'bad', label: 'Expired' });

  // Soon (ends Oct 31, 2026 -> 7 days away)
  const soonInfo = getExpiryChipInfo({ expiryDate: '2026-10-31' }, now);
  assert.equal(soonInfo?.status, 'soon');
  assert.equal(soonInfo?.tone, 'warn');
  assert.ok(soonInfo?.label.includes('Expires in'));

  // OK (ends Dec 31, 2026)
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

