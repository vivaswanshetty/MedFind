import type * as Notifications from 'expo-notifications';
import { parseExpiryDate, resolveItemExpiryDate, ExpiryInputItem } from './medicineBoxStatus';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

export interface ScheduleResult {
  expiryNotificationId?: string;
  refillNotificationId?: string;
  permissionGranted: boolean;
  warning?: string;
}

export interface NotificationClient {
  scheduleNotificationAsync: (req: any) => Promise<string>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  cancelAllScheduledNotificationsAsync: () => Promise<void>;
  requestPermissionsAsync?: () => Promise<{ status: string }>;
  getPermissionsAsync?: () => Promise<{ status: string }>;
  setNotificationChannelAsync?: (id: string, config: any) => Promise<any>;
}

let mockClient: NotificationClient | null = null;

/**
 * Allows injecting a mock notification client in unit tests.
 */
export function setMockNotificationClient(client: NotificationClient | null): void {
  mockClient = client;
}

function getNotificationClient(): NotificationClient {
  if (mockClient) return mockClient;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-notifications');
}

/**
 * Ensures the Android notification channel exists.
 * In standalone/dev builds, sets up 'default' channel with custom vibration and #87A96B light.
 * In Expo Go, catches the guest-scoped error safely without disrupting scheduling.
 */
export async function ensureNotificationChannel(): Promise<void> {
  const client = getNotificationClient();
  if (typeof client.setNotificationChannelAsync === 'function') {
    try {
      await client.setNotificationChannelAsync('default', {
        name: 'default',
        importance: 7, // Notifications.AndroidImportance.MAX
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#87A96B',
      });
    } catch (e) {
      // In Expo Go, notification channels are managed at the host shell level
      console.warn('Could not set custom notification channel in Expo Go (safe to ignore):', e);
    }
  }
}

/**
 * Requests notification permission from the system.
 * ONLY called on demand when the user toggles "Remind me", never at app launch.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) return false;
  const client = getNotificationClient();
  try {
    if (client.getPermissionsAsync) {
      const { status: existingStatus } = await client.getPermissionsAsync();
      if (existingStatus === 'granted') return true;
    }
    if (client.requestPermissionsAsync) {
      const { status } = await client.requestPermissionsAsync();
      return status === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Cancels scheduled notifications for an item.
 */
export async function cancelItemReminders(
  item: { expiryNotificationId?: string | null; refillNotificationId?: string | null }
): Promise<void> {
  if (isWeb) return;
  const client = getNotificationClient();
  try {
    if (item.expiryNotificationId) {
      await client.cancelScheduledNotificationAsync(item.expiryNotificationId);
    }
    if (item.refillNotificationId) {
      await client.cancelScheduledNotificationAsync(item.refillNotificationId);
    }
  } catch (e) {
    console.warn('Failed to cancel scheduled notification:', e);
  }
}

/**
 * Cancels all scheduled notifications across the application.
 */
export async function cancelAllItemReminders(): Promise<void> {
  if (isWeb) return;
  const client = getNotificationClient();
  try {
    await client.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Failed to cancel all scheduled notifications:', e);
  }
}

/**
 * Parses refill date (YYYY-MM-DD) into a local 9:00 AM Date object.
 */
export function calculateRefillMoment(refillOn?: string | null): Date | null {
  if (!refillOn) return null;
  const match = refillOn.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 9, 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculates the expiry reminder moment: 30 days before expiry at 9:00 AM local time.
 */
export function calculateExpiryReminderMoment(
  itemOrDate?: string | ExpiryInputItem | null
): Date | null {
  let expiry: Date | null = null;
  if (typeof itemOrDate === 'string') {
    expiry = parseExpiryDate(itemOrDate);
  } else if (itemOrDate && typeof itemOrDate === 'object') {
    expiry = resolveItemExpiryDate(itemOrDate);
  }
  if (!expiry) return null;
  // 30 days before expiry
  const reminderDate = new Date(expiry.getTime() - 30 * 24 * 60 * 60 * 1000);
  reminderDate.setHours(9, 0, 0, 0);
  return reminderDate;
}

/**
 * Schedules reminders for a medicine box item if remindersEnabled is true.
 * - Expiry: 30 days before expiry at 9:00 AM local time (if in future)
 * - Refill: on refillOn at 9:00 AM local time (if in future)
 * - Copy is strictly neutral: "Check the expiry date of {name}" and "Time to restock {name}".
 */
export async function scheduleItemReminders(
  item: {
    name: string;
    expiryDate?: string | null;
    exactExpiryDate?: string | null;
    refillOn?: string | null;
    remindersEnabled?: boolean;
  },
  now = new Date()
): Promise<ScheduleResult> {
  if (!item.remindersEnabled || isWeb) {
    return { permissionGranted: true };
  }

  const hasDate = Boolean(item.expiryDate || item.exactExpiryDate || item.refillOn);
  if (!hasDate) {
    return { permissionGranted: true };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return {
      permissionGranted: false,
      warning: 'Reminders are off. You can turn them on in your phone settings.',
    };
  }

  await ensureNotificationChannel();

  const client = getNotificationClient();
  let expiryNotificationId: string | undefined;
  let refillNotificationId: string | undefined;

  const nowMs = now.getTime();

  // 1. Expiry reminder: 30 days before expiry at 9:00 AM
  const expiryMoment = calculateExpiryReminderMoment(item);
  if (expiryMoment && expiryMoment.getTime() > nowMs) {
    try {
      expiryNotificationId = await client.scheduleNotificationAsync({
        content: {
          title: 'Medicine reminder',
          body: `Check the expiry date of ${item.name}.`,
        },
        trigger: {
          type: 'date',
          date: expiryMoment,
          channelId: 'default',
        },
      });
    } catch (e) {
      console.warn('Failed to schedule expiry reminder:', e);
    }
  }

  // 2. Refill reminder: on refillOn at 9:00 AM
  const refillMoment = calculateRefillMoment(item.refillOn);
  if (refillMoment && refillMoment.getTime() > nowMs) {
    try {
      refillNotificationId = await client.scheduleNotificationAsync({
        content: {
          title: 'Medicine reminder',
          body: `Time to restock ${item.name}.`,
        },
        trigger: {
          type: 'date',
          date: refillMoment,
          channelId: 'default',
        },
      });
    } catch (e) {
      console.warn('Failed to schedule refill reminder:', e);
    }
  }

  return {
    expiryNotificationId,
    refillNotificationId,
    permissionGranted: true,
  };
}

/**
 * Shared proof-of-concept helper for __DEV__ settings test reminder.
 */
export async function sendDevTestReminder(): Promise<{ success: boolean; message: string }> {
  if (isWeb) {
    return { success: false, message: 'Local notifications are not supported on web.' };
  }

  const granted = await requestNotificationPermission();
  if (!granted) {
    return { success: false, message: 'Notification permission was denied. You can enable it in Settings.' };
  }

  await ensureNotificationChannel();
  const client = getNotificationClient();

  try {
    await client.scheduleNotificationAsync({
      content: {
        title: 'MedFind Reminder',
        body: 'Time to check your medicine box.',
      },
      trigger: {
        type: 'timeInterval',
        seconds: 10,
        repeats: false,
        channelId: 'default',
      },
    });

    return {
      success: true,
      message: 'Test reminder scheduled! It will arrive in 10 seconds. You can background the app or lock the screen.',
    };
  } catch (err: any) {
    console.error('Error scheduling dev reminder:', err);
    return {
      success: false,
      message: `Could not schedule reminder: ${err?.message || err}`,
    };
  }
}
