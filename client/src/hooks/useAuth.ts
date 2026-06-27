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
    } catch (err: any) {
      const msg = err.response?.data?.message || '登录失败，请检查网络';
      setError(msg);
      return false;
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
    } catch (err: any) {
      const msg = err.response?.data?.message || '注册失败，请检查网络';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  return { login, register, logout, loading, error };
}
