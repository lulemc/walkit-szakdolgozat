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
  requestPermission: () => Promise<boolean>;
}

export const useHealthData = (): UseHealthDataReturn => {
  const [todayStats, setTodayStats] = useState<HealthData | null>(null);
  const [weekStats, setWeekStats] = useState<HealthData[]>([]);
  const [monthStats, setMonthStats] = useState<HealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Combined function that ensures permissions then fetches
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useHealthData] Checking availability...');
      
      // Step 1: Check availability
      const available = await healthKitService.isAvailable();
      if (!available) {
        throw new Error('Health data is not available on this device');
      }

      // Step 2: Request permissions (safe to call multiple times)
      console.log('[useHealthData] Requesting permissions...');
      const granted = await healthKitService.requestPermissions();
      
      if (!granted) {
        setHasPermission(false);
        throw new Error('Health data permission denied');
      }

      setHasPermission(true);
      
      // Step 3: Fetch data
      console.log('[useHealthData] Fetching health data...');
      const [today, week, month] = await Promise.all([
        healthKitService.getTodayStats(),
        healthKitService.getWeekStats(),
        healthKitService.getMonthStats(),
      ]);

      console.log('[useHealthData] Data fetched successfully');

      setTodayStats(today);
      setWeekStats(week);
      setMonthStats(month);
      
    } catch (err) {
      console.error('[useHealthData] Error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Request permission separately (for retry button)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await healthKitService.requestPermissions();
      setHasPermission(granted);
      
      if (granted) {
        // Auto-fetch after permission granted
        await fetchData();
      }
      
      return granted;
    } catch (error) {
      console.error('[useHealthData] Permission error:', error);
      return false;
    }
  }, [fetchData]);

  // Initialize on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    todayStats,
    weekStats,
    monthStats,
    loading,
    error,
    refetch: fetchData, // This now includes permission check
    hasPermission,
    requestPermission,
  };
};