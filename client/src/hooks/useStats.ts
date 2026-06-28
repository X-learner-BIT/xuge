import { useState, useCallback, useEffect } from 'react';
import { statsApi, type StatsData } from '@/services/stats';

export function useStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await statsApi.getStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取统计失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, fetchStats };
}
