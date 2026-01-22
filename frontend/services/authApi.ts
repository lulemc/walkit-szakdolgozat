import api from './api';

type AuthResponse = {
  token: string;
};

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  const res = await api.post<AuthResponse>('/auth/register', data);
  return res.data;
};

export const loginUser = async (data: { email: string; password: string }) => {
  const res = await api.post<AuthResponse>('/auth/login', data);
  return res.data;
};

export async function refreshTokenRequest(): Promise<{ token: string }> {
  const { data } = await api.post('/auth/refresh');
  return data;
}

export async function testNetworkRequest(): Promise<{ message: string }> {
  const { data } = await api.get<{ message: string }>('/users/test');
  console.log(data);
  return data;
}
