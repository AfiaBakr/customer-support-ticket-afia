import axios, { type AxiosInstance } from 'axios';
import { API_URL } from './constants';
import { useAuth } from '@/store/auth';

export const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      const { token, logout } = useAuth.getState();
      // Only bounce if we actually thought we were logged in.
      if (token) {
        logout();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=1';
        }
      }
    }
    return Promise.reject(error);
  },
);
