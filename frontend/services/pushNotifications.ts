import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import api from './api';

// The push token sent to the backend, so logging out can remove it again
let registeredToken: string | null = null;

/** Notifications that arrive while the app is open are shown too */
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

/**
 * Asks for permission and tells the backend this phone's push token, so it
 * can notify about friend requests and group walk invitations in `language`.
 * Best effort: on a simulator, in Expo Go on Android, without permission or
 * without network it returns null and the app works as before.
 */
export const registerForPushNotifications = async (userId: string, language: string): Promise<string | null> => {
  if (!Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'WalkIt',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post(`/users/${userId}/push-tokens`, { token, language });
    registeredToken = token;
    return token;
  } catch {
    return null;
  }
};

/** Stops notifications on this phone for the user, e.g. when logging out; never fails */
export const unregisterPushNotifications = async (userId: string): Promise<void> => {
  const token = registeredToken;
  if (!token) return;
  registeredToken = null;
  try {
    await api.delete(`/users/${userId}/push-tokens`, { data: { token } });
  } catch {
    // The backend forgets the token by itself once the phone stops accepting it
  }
};
