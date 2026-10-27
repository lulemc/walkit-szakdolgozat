import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { userStorage } from '../userStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const secureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const user = { _id: 'u1', name: 'Ann', email: 'ann@example.com' } as never;
const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.clearAllMocks();
});

describe('userStorage on the phone (SecureStore)', () => {
  it('stores, reads and removes the user as JSON', async () => {
    secureStore.getItemAsync.mockResolvedValue(JSON.stringify(user));

    await userStorage.setUser(user);
    const loaded = await userStorage.getUser();
    await userStorage.removeUser();

    expect(secureStore.setItemAsync).toHaveBeenCalledWith('user', JSON.stringify(user));
    expect(loaded).toEqual(user);
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('user');
  });

  it('returns null when no user is stored', async () => {
    secureStore.getItemAsync.mockResolvedValue(null);

    await expect(userStorage.getUser()).resolves.toBeNull();
  });
});

describe('userStorage on the web (localStorage)', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Platform.OS = 'web';
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => (store[key] = value),
        removeItem: (key: string) => delete store[key],
      },
    });
  });

  it('stores, reads and removes the user in localStorage', async () => {
    await userStorage.setUser(user);
    expect(await userStorage.getUser()).toEqual(user);

    await userStorage.removeUser();
    expect(await userStorage.getUser()).toBeNull();
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });
});
