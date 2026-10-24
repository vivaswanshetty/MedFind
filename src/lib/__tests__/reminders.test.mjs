import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRefillMoment,
  calculateExpiryReminderMoment,
  cancelItemReminders,
  cancelAllItemReminders,
  scheduleItemReminders,
  setMockNotificationClient,
} from '../reminders.js';

test('Reminders - calculateRefillMoment parses to 9:00 AM local time', () => {
  const moment = calculateRefillMoment('2026-11-15');
  assert.ok(moment instanceof Date);
  assert.equal(moment.getFullYear(), 2026);
  assert.equal(moment.getMonth(), 10); // November (0-indexed)
  assert.equal(moment.getDate(), 15);
  assert.equal(moment.getHours(), 9);
  assert.equal(moment.getMinutes(), 0);

  assert.equal(calculateRefillMoment(null), null);
  assert.equal(calculateRefillMoment('invalid-date'), null);
});

test('Reminders - calculateExpiryReminderMoment sets moment 30 days before expiry at 9:00 AM', () => {
  // Expiry ending November 30, 2026
  const moment = calculateExpiryReminderMoment('2026-11-30');
  assert.ok(moment instanceof Date);
  assert.equal(moment.getHours(), 9);
  assert.equal(moment.getMinutes(), 0);

  // Month format '2026-11' ends Nov 30; 30 days before is Oct 31 at 9:00 AM
  const monthMoment = calculateExpiryReminderMoment('2026-11');
  assert.ok(monthMoment instanceof Date);
  assert.equal(monthMoment.getMonth(), 9); // October
  assert.equal(monthMoment.getDate(), 31);
  assert.equal(monthMoment.getHours(), 9);

  // Month-precision expiry: "March 2027", "2027-03-01", and "2027-03-31"
  // All end on March 31, 2027; 30 days before is March 1, 2027 at 9:00 AM
  const marchFirstDayMoment = calculateExpiryReminderMoment('2027-03-01');
  const marchLastDayMoment = calculateExpiryReminderMoment('2027-03-31');
  const marchTextMoment = calculateExpiryReminderMoment('March 2027');

  assert.ok(marchFirstDayMoment instanceof Date);
  assert.equal(marchFirstDayMoment.getFullYear(), 2027);
  assert.equal(marchFirstDayMoment.getMonth(), 2); // March
  assert.equal(marchFirstDayMoment.getDate(), 1);
  assert.equal(marchFirstDayMoment.getHours(), 9);

  assert.equal(marchLastDayMoment.getFullYear(), 2027);
  assert.equal(marchLastDayMoment.getMonth(), 2);
  assert.equal(marchLastDayMoment.getDate(), 1);
  assert.equal(marchLastDayMoment.getHours(), 9);

  assert.equal(marchTextMoment.getFullYear(), 2027);
  assert.equal(marchTextMoment.getMonth(), 2);
  assert.equal(marchTextMoment.getDate(), 1);
  assert.equal(marchTextMoment.getHours(), 9);

  assert.equal(calculateExpiryReminderMoment(null), null);
});

test('Reminders - Cancellation on item edit and delete', async () => {
  const cancelledIds = [];

  const mockClient = {
    scheduleNotificationAsync: async () => 'notif-1',
    cancelScheduledNotificationAsync: async (id) => {
      cancelledIds.push(id);
    },
    cancelAllScheduledNotificationsAsync: async () => {
      cancelledIds.push('__ALL__');
    },
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    setNotificationChannelAsync: async () => null,
  };

  setMockNotificationClient(mockClient);

  // 1. Deleting an item: cancels both IDs
  const itemToDelete = {
    expiryNotificationId: 'notif-exp-123',
    refillNotificationId: 'notif-ref-456',
  };
  await cancelItemReminders(itemToDelete);
  assert.deepEqual(cancelledIds, ['notif-exp-123', 'notif-ref-456']);

  // 2. Editing an item: cancelling old IDs
  const itemToEditOld = {
    expiryNotificationId: 'old-exp-789',
    refillNotificationId: null,
  };
  await cancelItemReminders(itemToEditOld);
  assert.ok(cancelledIds.includes('old-exp-789'));

  // 3. Clear all: cancels all notifications
  await cancelAllItemReminders();
  assert.ok(cancelledIds.includes('__ALL__'));

  setMockNotificationClient(null);
});

test('Reminders - Neutral notification copy and scheduling', async () => {
  const scheduledRequests = [];

  const mockClient = {
    scheduleNotificationAsync: async (req) => {
      scheduledRequests.push(req);
      return `id-${scheduledRequests.length}`;
    },
    cancelScheduledNotificationAsync: async () => {},
    cancelAllScheduledNotificationsAsync: async () => {},
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
  };

  setMockNotificationClient(mockClient);

  const testNow = new Date('2026-10-24T00:00:00Z');
  const res = await scheduleItemReminders(
    {
      name: 'Amoxicillin 500mg',
      expiryDate: '2026-12-31',
      refillOn: '2026-11-10',
      remindersEnabled: true,
    },
    testNow
  );

  assert.equal(res.permissionGranted, true);
  assert.ok(res.expiryNotificationId);
  assert.ok(res.refillNotificationId);

  // Check neutral copy: never mentions dosage instructions or condition
  assert.equal(scheduledRequests.length, 2);
  const expReq = scheduledRequests[0];
  const refReq = scheduledRequests[1];

  assert.equal(expReq.content.body, 'Check the expiry date of Amoxicillin 500mg.');
  assert.equal(refReq.content.body, 'Time to restock Amoxicillin 500mg.');

  setMockNotificationClient(null);
});
