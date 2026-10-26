import api from '../api';
import { loginUser, registerUser } from '../authApi';

jest.mock('../api');

const mockedApi = api as jest.Mocked<typeof api>;
const loggedIn = { token: 'jwt', user: { _id: '123', name: 'John Doe', email: 'john@example.com' } };

describe('authApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers and returns the token and user from { success, data }', async () => {
    const details = { name: 'John Doe', email: 'john@example.com', password: 'password123' };
    mockedApi.post.mockResolvedValue({ data: { success: true, data: loggedIn } });

    await expect(registerUser(details)).resolves.toEqual(loggedIn);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', details);
  });

  it('logs in and returns the token and user from { success, data }', async () => {
    const credentials = { email: 'john@example.com', password: 'password123' };
    mockedApi.post.mockResolvedValue({ data: { success: true, data: loggedIn } });

    await expect(loginUser(credentials)).resolves.toEqual(loggedIn);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', credentials);
  });

  it('passes request errors on', async () => {
    mockedApi.post.mockRejectedValue(new Error('Registration failed'));

    await expect(registerUser({ name: 'J', email: 'j@x.com', password: 'p' })).rejects.toThrow('Registration failed');
  });
});
