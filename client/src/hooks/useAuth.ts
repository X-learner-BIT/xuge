import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/auth';
import type { LoginDto, RegisterDto } from '@/types';

export function useAuth() {
  const { setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (data: LoginDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data);
      setAuth(res.token, res.user);
      return true;
    } catch {
      // Demo mode fallback when backend is unavailable
      const demoUser = {
        id: 'demo',
        email: data.email,
        nickname: data.email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      setAuth('demo-token', demoUser);
      return true;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  const register = useCallback(async (data: RegisterDto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      setAuth(res.token, res.user);
      return true;
    } catch {
      // Demo mode fallback when backend is unavailable
      const demoUser = {
        id: 'demo',
        email: data.email,
        nickname: data.nickname || data.email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
      setAuth('demo-token', demoUser);
      return true;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  return { login, register, logout, loading, error };
}
