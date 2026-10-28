/* eslint-disable import/first */
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

import { storage } from '@/utils/storage';

const mockedStorage = storage as jest.Mocked<typeof storage>;

describe('API Module', () => {
  let api: any;
  let setUnauthorizedHandler: (fn: (() => void) | null) => void;

  let createConfig: { timeout?: number } | undefined;

  beforeAll(() => {
    const apiModule = require('../api');
    api = apiModule.default;
    setUnauthorizedHandler = apiModule.setUnauthorizedHandler;
    createConfig = (require('axios').create as jest.Mock).mock.calls[0]?.[0];
  });

  it('gives up on requests after 15 seconds instead of waiting forever', () => {
    expect(createConfig?.timeout).toBe(15000);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    setUnauthorizedHandler(null);
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      mockedStorage.getToken.mockResolvedValue('test-token');
      const requestInterceptor = (api.interceptors.request as any).handlers[0];

      const config = await requestInterceptor.fulfilled({ headers: {} });

      expect(config.headers.Authorization).toBe('Bearer test-token');
    });

    it('should not add Authorization header when token is null', async () => {
      mockedStorage.getToken.mockResolvedValue(null);
      const requestInterceptor = (api.interceptors.request as any).handlers[0];

      const config = await requestInterceptor.fulfilled({ headers: {} });

      expect(config.headers.Authorization).toBeUndefined();
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
    it('should call the unauthorized handler and reject', async () => {
      const handler = jest.fn();
      setUnauthorizedHandler(handler);

      const error: any = {
        config: { headers: {} },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should reject without throwing when no handler is registered', async () => {
      const error: any = {
        config: { headers: {} },
        response: { status: 401 },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);
    });
  });

  describe('Response Error Interceptor - Non-401', () => {
    it.each([500, 404])('should reject %i errors without calling the handler', async (status) => {
      const handler = jest.fn();
      setUnauthorizedHandler(handler);

      const error: any = {
        config: { headers: {} },
        response: { status },
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject errors without response object', async () => {
      const handler = jest.fn();
      setUnauthorizedHandler(handler);

      const error: any = {
        config: { headers: {} },
        message: 'Network Error',
      };

      const responseInterceptor = (api.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toEqual(error);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
