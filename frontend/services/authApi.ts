import { User } from '@/types/User';
import api from './api';

type AuthResponse = {
  token: string;
  user: User;
};

export const registerUser = async (data: { name: string; email: string; password: string }) => {
  const res = await api.post<AuthResponse>('/auth/register', data);
  return res.data;
};

export const loginUser = async (data: { email: string; password: string }) => {
  const res = await api.post<AuthResponse>('/auth/login', data);
  return res.data;
};
