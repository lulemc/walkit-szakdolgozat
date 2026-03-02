import { useState, useEffect, useCallback } from 'react';
import { healthKitService, HealthData } from '@/services/healthKitService';

interface UseHealthDataReturn {
  todayStats: HealthData | null;
  weekStats: HealthData[];
  monthStats: HealthData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasPermission: boolean;
}

export const useHealthData = (): UseHealthDataReturn => {
  const [todayStats, setTodayStats] = useState<HealthData | null>(null);
  const [weekStats, setWeekStats] = useState<HealthData[]>([]);
  const [monthStats, setMonthStats] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useHealthData] Fetching health data...');

      // Fetch all data in parallel
      const [today, week, month] = await Promise.all([
        healthKitService.getTodayStats(),
        healthKitService.getWeekStats(),
        healthKitService.getMonthStats(),
      ]);

      console.log('[useHealthData] Data fetched successfully:', {
        today,
        weekDays: week.length,
        monthDays: month.length,
      });

      setTodayStats(today);
      setWeekStats(week);
      setMonthStats(month);
      setHasPermission(true);
    } catch (err) {
      console.error('[useHealthData] Error fetching data:', err);
      setError(err as Error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    todayStats,
    weekStats,
    monthStats,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
};