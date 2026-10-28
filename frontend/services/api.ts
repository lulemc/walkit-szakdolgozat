import axios from 'axios';
import { storage } from '@/utils/storage';

/** Without a limit a request on a bad connection waits forever */
export const REQUEST_TIMEOUT_MS = 15_000;

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: REQUEST_TIMEOUT_MS,
});

/* ---------------- unauthorized handler ---------------- */

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

/* ---------------- request interceptor ---------------- */

api.interceptors.request.use(async (config) => {
  const token = await storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------------- response interceptor ---------------- */

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  }
);

export default api;
