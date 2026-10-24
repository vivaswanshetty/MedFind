import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

let initialized = false;

/**
 * Initializes global notification presentation behavior once at application launch.
 */
export function initNotifications(): void {
  if (initialized || Platform.OS === 'web') {
    return;
  }
  initialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
