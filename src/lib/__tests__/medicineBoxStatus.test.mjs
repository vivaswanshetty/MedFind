import test from 'node:test';
import assert from 'node:assert/strict';
import { getExpiryStatus, parseExpiryDate, getExpiryChipInfo, formatRefillDate } from '../medicineBoxStatus.ts';

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

test('ExpiryStatus - Exact day only (the day before is ok, the day after is expired)', () => {
  const item = { exactExpiryDate: '2027-03-15' };

  // 60 days before (14 Jan 2027) -> ok
  const jan14 = new Date(2027, 0, 14, 12, 0, 0);
  assert.equal(getExpiryStatus(item, jan14), 'ok');

  // The day before (14 March 2027 12:00) -> not expired (soon: within 30 days)
  const march14 = new Date(2027, 2, 14, 12, 0, 0);
  assert.notEqual(getExpiryStatus(item, march14), 'expired');
  assert.equal(getExpiryStatus(item, march14), 'soon');

  // On the exact day (15 March 2027 12:00) -> not expired yet (expires at end of day 23:59:59.999)
  const march15Noon = new Date(2027, 2, 15, 12, 0, 0);
  assert.notEqual(getExpiryStatus(item, march15Noon), 'expired');

  // The day after (16 March 2027 00:00:01) -> expired
  const march16 = new Date(2027, 2, 16, 0, 0, 1);
  assert.equal(getExpiryStatus(item, march16), 'expired');
});

test('ExpiryStatus - Both set (exact day wins)', () => {
  // Month is March 2027 (which would end March 31), but exact day is March 15
  const item = { expiryDate: '2027-03', exactExpiryDate: '2027-03-15' };

  // The day before exact day (14 March 2027 12:00) -> not expired
  const march14 = new Date(2027, 2, 14, 12, 0, 0);
  assert.notEqual(getExpiryStatus(item, march14), 'expired');

  // The day after exact day (16 March 2027 00:00:01) -> expired (exact day wins over month end March 31!)
  const march16 = new Date(2027, 2, 16, 0, 0, 1);
  assert.equal(getExpiryStatus(item, march16), 'expired');
});

test('ExpiryStatus - Legacy stored items with full date but no exactExpiryDate are treated as month precision', () => {
  // Legacy item saved with full date like '2027-03-15' but without exactExpiryDate field
  const legacyItem = { expiryDate: '2027-03-15' };

  // On 20 March 2027 -> MUST NOT show expired because month precision extends to March 31
  const march20 = new Date(2027, 2, 20, 12, 0, 0);
  assert.notEqual(getExpiryStatus(legacyItem, march20), 'expired');

  // On 1 April 2027 -> expired
  const april1 = new Date(2027, 3, 1, 0, 0, 1);
  assert.equal(getExpiryStatus(legacyItem, april1), 'expired');
});


