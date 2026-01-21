import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { storage } from '../storage';

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockedSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('storage', () => {
  const TOKEN_KEY = 'token';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getToken', () => {
    describe('on mobile (iOS/Android)', () => {
      beforeEach(() => {
        (Platform as any).OS = 'ios';
      });

      it('should get token from SecureStore', async () => {
        const mockToken = 'test-token';
        mockedSecureStore.getItemAsync.mockResolvedValue(mockToken);

        const result = await storage.getToken();

        expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
        expect(result).toBe(mockToken);
      });

      it('should return null when token does not exist', async () => {
        mockedSecureStore.getItemAsync.mockResolvedValue(null);

        const result = await storage.getToken();

        expect(mockedSecureStore.getItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
        expect(result).toBeNull();
      });
    });

    describe('on web', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('should get token from localStorage', async () => {
        const mockToken = 'web-test-token';
        localStorage.setItem(TOKEN_KEY, mockToken);

        const result = await storage.getToken();

        expect(result).toBe(mockToken);
        expect(mockedSecureStore.getItemAsync).not.toHaveBeenCalled();
      });

      it('should return null when token does not exist in localStorage', async () => {
        const result = await storage.getToken();

        expect(result).toBeNull();
        expect(mockedSecureStore.getItemAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('setToken', () => {
    describe('on mobile (iOS/Android)', () => {
      beforeEach(() => {
        (Platform as any).OS = 'android';
      });

      it('should set token in SecureStore', async () => {
        const mockToken = 'new-token';
        mockedSecureStore.setItemAsync.mockResolvedValue();

        await storage.setToken(mockToken);

        expect(mockedSecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, mockToken);
      });
    });

    describe('on web', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('should set token in localStorage', async () => {
        const mockToken = 'web-new-token';

        await storage.setToken(mockToken);

        expect(localStorage.getItem(TOKEN_KEY)).toBe(mockToken);
        expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
      });

      it('should overwrite existing token in localStorage', async () => {
        localStorage.setItem(TOKEN_KEY, 'old-token');

        const newToken = 'new-token';
        await storage.setToken(newToken);

        expect(localStorage.getItem(TOKEN_KEY)).toBe(newToken);
      });
    });
  });

  describe('removeToken', () => {
    describe('on mobile (iOS/Android)', () => {
      beforeEach(() => {
        (Platform as any).OS = 'ios';
      });

      it('should remove token from SecureStore', async () => {
        mockedSecureStore.deleteItemAsync.mockResolvedValue();

        await storage.removeToken();

        expect(mockedSecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
      });
    });

    describe('on web', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('should remove token from localStorage', async () => {
        localStorage.setItem(TOKEN_KEY, 'token-to-remove');

        await storage.removeToken();

        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
        expect(mockedSecureStore.deleteItemAsync).not.toHaveBeenCalled();
      });

      it('should handle removing non-existent token', async () => {
        await storage.removeToken();

        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });
    });
  });

  describe('cross-platform consistency', () => {
    it('should use SecureStore on iOS', async () => {
      (Platform as any).OS = 'ios';
      const token = 'ios-token';

      mockedSecureStore.setItemAsync.mockResolvedValue();
      mockedSecureStore.getItemAsync.mockResolvedValue(token);

      await storage.setToken(token);
      const result = await storage.getToken();

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalled();
      expect(mockedSecureStore.getItemAsync).toHaveBeenCalled();
      expect(result).toBe(token);
    });

    it('should use SecureStore on Android', async () => {
      (Platform as any).OS = 'android';
      const token = 'android-token';

      mockedSecureStore.setItemAsync.mockResolvedValue();
      mockedSecureStore.getItemAsync.mockResolvedValue(token);

      await storage.setToken(token);
      const result = await storage.getToken();

      expect(mockedSecureStore.setItemAsync).toHaveBeenCalled();
      expect(mockedSecureStore.getItemAsync).toHaveBeenCalled();
      expect(result).toBe(token);
    });

    it('should use localStorage on web', async () => {
      (Platform as any).OS = 'web';
      const token = 'web-token';

      await storage.setToken(token);
      const result = await storage.getToken();

      expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
      expect(result).toBe(token);
      expect(mockedSecureStore.setItemAsync).not.toHaveBeenCalled();
      expect(mockedSecureStore.getItemAsync).not.toHaveBeenCalled();
    });
  });
});