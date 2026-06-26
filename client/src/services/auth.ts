import { api } from './api';
import type { LoginDto, RegisterDto, AuthResponse } from '@/types';

export const authApi = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((res) => res.data),
  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((res) => res.data),
};
