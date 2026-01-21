import api from './api';

type RefreshResponse = {
  token: string;
};

/*export async function loginRequest(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/users/login', {
    email,
    password,
  });

  return data;
}
*/

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  const res = await api.post('/users/register', data);
  return res.data;
};

export async function refreshTokenRequest(): Promise<RefreshResponse> {
  const { data } = await api.post<RefreshResponse>('/auth/refresh');
  return data;
}

export async function testNetworkRequest(): Promise<{ message: string }> {
  const { data } = await api.get<{ message: string }>('/users/test');
  console.log(data)
  return data;
}
