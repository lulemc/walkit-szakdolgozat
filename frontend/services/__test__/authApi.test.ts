import api from '../api';
import { registerUser, refreshTokenRequest, testNetworkRequest } from '../authApi';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      const mockUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          id: '123',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await registerUser(mockUserData);

      expect(mockedApi.post).toHaveBeenCalledWith('/users/register', mockUserData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle registration error', async () => {
      const mockUserData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockError = new Error('Registration failed');
      mockedApi.post.mockRejectedValue(mockError);

      await expect(registerUser(mockUserData)).rejects.toThrow('Registration failed');

      expect(mockedApi.post).toHaveBeenCalledWith('/users/register', mockUserData);
    });
  });

  describe('refreshTokenRequest', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        data: {
          token: 'new-access-token',
        },
      };

      mockedApi.post.mockResolvedValue(mockResponse);

      const result = await refreshTokenRequest();

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toEqual({ token: 'new-access-token' });
    });

    it('should handle refresh token error', async () => {
      const mockError = new Error('Token refresh failed');
      mockedApi.post.mockRejectedValue(mockError);

      await expect(refreshTokenRequest()).rejects.toThrow('Token refresh failed');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/refresh');
    });
  });

  describe('testNetworkRequest', () => {
    it('should make test network request successfully', async () => {
      const mockResponse = {
        data: {
          message: 'Network test successful',
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockedApi.get.mockResolvedValue(mockResponse);

      const result = await testNetworkRequest();

      expect(mockedApi.get).toHaveBeenCalledWith('/users/test');
      expect(result).toEqual({ message: 'Network test successful' });
      expect(consoleSpy).toHaveBeenCalledWith(mockResponse.data);

      consoleSpy.mockRestore();
    });

    it('should handle network test error', async () => {
      const mockError = new Error('Network test failed');
      mockedApi.get.mockRejectedValue(mockError);

      await expect(testNetworkRequest()).rejects.toThrow('Network test failed');

      expect(mockedApi.get).toHaveBeenCalledWith('/users/test');
    });

    it('should log response data to console', async () => {
      const mockResponse = {
        data: {
          message: 'Test message',
        },
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockedApi.get.mockResolvedValue(mockResponse);

      await testNetworkRequest();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Test message' });

      consoleSpy.mockRestore();
    });
  });
});