/**
 * Clear All User Data Service
 * Implements privacy-first device wiping for MedFind:
 * - Deletes all user-generated and cached data stored locally
 * - Cancels all scheduled local medicine reminders
 * - Explicitly preserves appearance (theme) and language preferences
 * - Completely resets onboarding flags so onboarding restarts cleanly
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllItemReminders } from '../lib/reminders';
import { pharmacyPortalService } from './pharmacyPortalService';
import {
  CLEARED_STORAGE_KEYS,
  KEPT_STORAGE_KEYS,
} from '../constants/storageKeys';

export { CLEARED_STORAGE_KEYS, KEPT_STORAGE_KEYS };

/**
 * Clears all user data, preferences, portal credentials, and scheduled notifications
 * while strictly preserving theme and language preferences.
 */
export async function clearAllUserData(): Promise<void> {
  // 1. Cancel all pending local notifications
  try {
    await cancelAllItemReminders();
  } catch (err) {
    console.warn('[clearAllUserData] Failed to cancel scheduled notifications:', err);
  }

  // 2. Clear in-memory pharmacy portal auth state
  try {
    await pharmacyPortalService.clearStorePartnerAuth();
  } catch (err) {
    console.warn('[clearAllUserData] Failed to clear in-memory partner auth:', err);
  }

  // 3. Clear all designated storage keys
  try {
    await AsyncStorage.multiRemove(CLEARED_STORAGE_KEYS);
  } catch (err) {
    // Fallback to individual key removal if multiRemove encounters an error
    for (const key of CLEARED_STORAGE_KEYS) {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // Continue clearing remaining keys
      }
    }
  }
}
