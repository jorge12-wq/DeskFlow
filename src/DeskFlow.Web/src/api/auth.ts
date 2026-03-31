import apiClient from './client';
import type { AuthResponse, LoginRequest } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then(r => r.data),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then(r => r.data),

  logout: () => apiClient.post('/auth/logout'),
};
