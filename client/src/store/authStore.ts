import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isDark: boolean;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  restore: () => void;
  toggleDarkMode: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isDark: false,
  setAuth: (token, user) => {
    localStorage.setItem('xuge_token', token);
    localStorage.setItem('xuge_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  updateUser: (user) => {
    localStorage.setItem('xuge_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('xuge_token');
    localStorage.removeItem('xuge_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
  restore: () => {
    const token = localStorage.getItem('xuge_token');
    const userStr = localStorage.getItem('xuge_user');
    const isDark = localStorage.getItem('xuge_dark') === 'true';
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isAuthenticated: true, isDark });
      } catch {
        localStorage.removeItem('xuge_token');
        localStorage.removeItem('xuge_user');
      }
    } else {
      set({ isDark });
    }
  },
  toggleDarkMode: () => {
    const isDark = !get().isDark;
    localStorage.setItem('xuge_dark', String(isDark));
    document.body.classList.toggle('dark', isDark);
    set({ isDark });
  },
}));
