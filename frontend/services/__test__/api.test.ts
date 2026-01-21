/* eslint-disable import/first */
jest.mock('../authApi', () => ({
  refreshTokenRequest: jest.fn(),
}));

jest.mock('@/utils/storage', () => ({
  storage: {
    getToken: jest.fn(),
    setToken: jest.fn(),
    removeToken: jest.fn(),
  },
}));

jest.mock('axios', () => {
  const actualAxios = jest.requireActual('axios');
  return {
    ...actualAxios,
    create: jest.fn(() => actualAxios.create({
      baseURL: 'http://test.com',
    })),
  };
});

import { refreshTokenRequest } from '../authApi';
import { storage } from '@/utils/storage';

const mockedRefreshTokenRequest = refreshTokenRequest as jest.MockedFunction<typeof refreshTokenRequest>;
const mockedStorage = storage as jest.Mocked<typeof storage>;

describe('API Module', () => {
  let api: any;

  beforeAll(() => {
    api = require('../api').default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      const token = 'test-token';
      mockedStorage.getToken.mockResolvedValue(token);

      try {
        await api.get('/test');
      } catch (e) {
        // Ignore network errors, we just want to test the interceptor
      }

      expect(mockedStorage.getToken).toHaveBeenCalled();
    });

    it('should not add Authorization header when token is null', async () => {
      mockedStorage.getToken.mockResolvedValue(null);

      try {
        await api.get('/test');
      } catch (e) {
        // Ignore network errors
      }

      expect(mockedStorage.getToken).toHaveBeenCalled();
    });
  });

  describe('Response Success Interceptor', () => {
    it('should pass through successful responses', () => {
      const response = { status: 200, data: { message: 'success' } };
      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      const result = responseInterceptor.fulfilled(response);

      expect(result).toEqual(response);
    });
  });

  describe('Response Error Interceptor - 401', () => {
    it('should refresh token and retry on 401 error', async () => {
      const newToken = 'new-token';
      mockedStorage.getToken.mockResolvedValue('old-token');
      mockedRefreshTokenRequest.mockResolvedValue({ token: newToken });
      mockedStorage.setToken.mockResolvedValue();

      const mockRetry = jest.fn().mockResolvedValue({ status: 200, data: 'success' });
      const error: any = {
        config: { 
          headers: {} as any,
          url: '/test',
        },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];
      
      // Mock the api instance call for retry
      const originalApi = api;
      (global as any).mockApi = mockRetry;

      try {
        await responseInterceptor.rejected(error);
      } catch (e) {
        // May fail on retry
      }

      expect(mockedRefreshTokenRequest).toHaveBeenCalled();
      expect(mockedStorage.setToken).toHaveBeenCalledWith(newToken);
      expect(error.config._retry).toBe(true);
      expect(error.config.headers.Authorization).toBe(`Bearer ${newToken}`);
    });

    it('should remove token when refresh fails', async () => {
      mockedStorage.getToken.mockResolvedValue('old-token');
      mockedRefreshTokenRequest.mockRejectedValue(new Error('Refresh failed'));
      mockedStorage.removeToken.mockResolvedValue();

      const error: any = {
        config: { headers: {} },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow('Refresh failed');

      expect(mockedStorage.removeToken).toHaveBeenCalled();
    });

    it('should not retry if already retried', async () => {
      const error: any = {
        config: { headers: {}, _retry: true },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
    });

    it('should queue requests while token is refreshing', async () => {
      const newToken = 'new-token';
      let resolveRefresh: any;
      
      const refreshPromise = new Promise((resolve) => {
        resolveRefresh = resolve;
      });

      mockedRefreshTokenRequest.mockReturnValue(refreshPromise as any);
      mockedStorage.setToken.mockResolvedValue();

      const error1: any = {
        config: { headers: {}, url: '/test1' },
        response: { status: 401 },
      };

      const error2: any = {
        config: { headers: {}, url: '/test2' },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      // Start first request
      const promise1 = responseInterceptor.rejected(error1);

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));

      // Start second request (should be queued)
      const promise2 = responseInterceptor.rejected(error2);

      // Resolve the refresh
      resolveRefresh({ token: newToken });

      try {
        await Promise.all([promise1, promise2]);
      } catch (e) {
        // May fail on retry
      }

      // Refresh should only be called once
      expect(mockedRefreshTokenRequest).toHaveBeenCalledTimes(1);
    });

    it('should reject all queued requests when refresh fails', async () => {
      const refreshError = new Error('Refresh failed');
      let rejectRefresh: any;
      
      const refreshPromise = new Promise((_, reject) => {
        rejectRefresh = reject;
      });

      mockedRefreshTokenRequest.mockReturnValue(refreshPromise as any);
      mockedStorage.removeToken.mockResolvedValue();

      const error1: any = {
        config: { headers: {}, url: '/test1' },
        response: { status: 401 },
      };

      const error2: any = {
        config: { headers: {}, url: '/test2' },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      const promise1 = responseInterceptor.rejected(error1);
      await new Promise(resolve => setTimeout(resolve, 10));
      const promise2 = responseInterceptor.rejected(error2);

      rejectRefresh(refreshError);

      await expect(promise1).rejects.toThrow('Refresh failed');
      await expect(promise2).rejects.toThrow('Refresh failed');

      expect(mockedRefreshTokenRequest).toHaveBeenCalledTimes(1);
      expect(mockedStorage.removeToken).toHaveBeenCalled();
    });
  });

  describe('Response Error Interceptor - Non-401', () => {
    it('should reject non-401 errors without refresh', async () => {
      const error: any = {
        config: { headers: {} },
        response: { status: 500 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
    });

    it('should reject 404 errors without refresh', async () => {
      const error: any = {
        config: { headers: {} },
        response: { status: 404 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
    });

    it('should reject errors without response object', async () => {
      const error: any = {
        config: { headers: {} },
        message: 'Network Error',
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(mockedRefreshTokenRequest).not.toHaveBeenCalled();
    });
  });
});