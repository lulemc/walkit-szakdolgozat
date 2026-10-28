import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '@/services/api';
import { registerForPushNotifications, unregisterPushNotifications } from '../pushNotifications';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'project-1' } } } },
}));
jest.mock('@/services/api', () => ({ __esModule: true, default: { post: jest.fn(), delete: jest.fn() } }));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const http = api as jest.Mocked<typeof api>;
const TOKEN = 'ExponentPushToken[abc]';
const originalOS = Platform.OS;

beforeEach(async () => {
  jest.clearAllMocks();
  (Device as { isDevice: boolean }).isDevice = true;
  Platform.OS = 'ios';
  notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
  notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
  notifications.getExpoPushTokenAsync.mockResolvedValue({ data: TOKEN, type: 'expo' });
  http.post.mockResolvedValue({});
  http.delete.mockResolvedValue({});
  // Forget the token remembered by the previous test
  await unregisterPushNotifications('u0');
  jest.clearAllMocks();
});

afterAll(() => {
  Platform.OS = originalOS;
});

describe('registerForPushNotifications', () => {
  it("sends this phone's push token, with the app language, to the backend", async () => {
    await expect(registerForPushNotifications('u1', 'hu')).resolves.toBe(TOKEN);

    expect(notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
    expect(http.post).toHaveBeenCalledWith('/users/u1/push-tokens', { token: TOKEN, language: 'hu' });
  });

  it('asks for permission first when it has not been given yet', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as never);

    await registerForPushNotifications('u1', 'en');

    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(http.post).toHaveBeenCalled();
  });

  it('does nothing more when notifications are not allowed', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);
    notifications.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);

    await expect(registerForPushNotifications('u1', 'en')).resolves.toBeNull();
    expect(notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(http.post).not.toHaveBeenCalled();
  });

  it("doesn't ask on a simulator, which can't get push notifications", async () => {
    (Device as { isDevice: boolean }).isDevice = false;

    await expect(registerForPushNotifications('u1', 'en')).resolves.toBeNull();
    expect(notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  // e.g. in Expo Go on Android, or without network
  it('gives up quietly when there is no token or the backend is unreachable', async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('not supported'));
    await expect(registerForPushNotifications('u1', 'en')).resolves.toBeNull();

    notifications.getExpoPushTokenAsync.mockResolvedValue({ data: TOKEN, type: 'expo' });
    http.post.mockRejectedValue(new Error('offline'));
    await expect(registerForPushNotifications('u1', 'en')).resolves.toBeNull();
  });

  it('sets up the Android notification channel', async () => {
    Platform.OS = 'android';

    await registerForPushNotifications('u1', 'en');

    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      'default',
      expect.objectContaining({ name: 'WalkIt', importance: 3 }),
    );
  });
});

describe('unregisterPushNotifications', () => {
  it('tells the backend to stop notifying this phone', async () => {
    await registerForPushNotifications('u1', 'en');

    await unregisterPushNotifications('u1');

    expect(http.delete).toHaveBeenCalledWith('/users/u1/push-tokens', { data: { token: TOKEN } });
  });

  it('does nothing when this phone was never registered', async () => {
    await unregisterPushNotifications('u1');

    expect(http.delete).not.toHaveBeenCalled();
  });

  it('never fails, so logging out always works', async () => {
    await registerForPushNotifications('u1', 'en');
    http.delete.mockRejectedValue(new Error('offline'));

    await expect(unregisterPushNotifications('u1')).resolves.toBeUndefined();
  });
});
