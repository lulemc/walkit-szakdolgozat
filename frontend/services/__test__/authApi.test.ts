import api from '../api';
import { registerUser } from '../authApi';

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

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', mockUserData);
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

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', mockUserData);
    });
  });
});
