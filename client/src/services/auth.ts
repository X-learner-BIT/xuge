import { api } from './api';
import type { LoginDto, RegisterDto, AuthResponse, User } from '@/types';

export const authApi = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((res) => res.data),
  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((res) => res.data),
  updateNickname: (nickname: string) =>
    api.put<{ user: User }>('/auth/profile', { nickname }).then((res) => res.data),
  updatePassword: (oldPassword: string, newPassword: string) =>
    api.put<{ message: string }>('/auth/password', { oldPassword, newPassword }).then((res) => res.data),
  clearData: () =>
    api.delete<{ message: string }>('/auth/data').then((res) => res.data),
};
