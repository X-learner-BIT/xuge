import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  restore: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => {
    localStorage.setItem('xuge_token', token);
    localStorage.setItem('xuge_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('xuge_token');
    localStorage.removeItem('xuge_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  restore: () => {
    const token = localStorage.getItem('xuge_token');
    const userStr = localStorage.getItem('xuge_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('xuge_token');
        localStorage.removeItem('xuge_user');
      }
    }
  },
}));
