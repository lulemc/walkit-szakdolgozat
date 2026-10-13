import { useState, useEffect, useCallback, useMemo } from 'react';
import { healthKitService, HealthData } from '@/services/healthKitService';

interface UseHealthDataReturn {
  todayStats: HealthData | null;
  yesterdayStats: HealthData | null;
  weekStats: HealthData[];
  monthStats: HealthData[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  weekSummary: WeeklySummary;
  monthSummary: MonthlySummary;
  trends: TrendData;
}

interface WeeklySummary {
  totalSteps: number;
  totalDistance: number; // meters
  totalCalories: number;
  averageSteps: number;
  averageDistance: number;
  averageCalories: number;
  activeDays: number;
  bestDay: HealthData;
  worstDay: HealthData;
}

interface MonthlySummary {
  totalSteps: number;
  totalDistance: number;
  totalCalories: number;
  averageSteps: number;
  averageDistance: number;
  averageCalories: number;
  activeDays: number;
  bestDay: HealthData;
  worstDay: HealthData;
  streak: number; // consecutive active days
}

interface TrendData {
  stepsVsYesterday: number; // percentage
  stepsVsLastWeek: number;
  distanceVsYesterday: number;
  distanceVsLastWeek: number;
  caloriesVsYesterday: number;
  caloriesVsLastWeek: number;
  trend: 'improving' | 'declining' | 'stable';
}

// ========================================
// MOCK MODE - Toggle for testing
// ========================================
const USE_MOCK_DATA = true; // Set to false when Xcode is ready

// Generate realistic mock data with patterns (called once, outside render)
const generateMockData = () => {
  const now = new Date();

  const todayStats: HealthData = {
    steps: 12847,
    distance: 9850,
    calories: 548,
    date: new Date(now),
  };

  const yesterdayStats: HealthData = {
    steps: 8234,
    distance: 6120,
    calories: 342,
    date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
  };

  const weekStats: HealthData[] = [
    {
      steps: 6842,
      distance: 5100,
      calories: 298,
      date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      steps: 9123,
      distance: 6850,
      calories: 387,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      steps: 11456,
      distance: 8620,
      calories: 476,
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      steps: 8967,
      distance: 6740,
      calories: 372,
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      steps: 13284,
      distance: 10150,
      calories: 562,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    yesterdayStats,
    todayStats,
  ];

  const monthStats: HealthData[] = [];
  for (let i = 29; i >= 0; i--) {
    const dayOfWeek = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).getDay();
    let baseSteps, baseDistance, baseCalories;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseSteps = 11000;
      baseDistance = 8500;
      baseCalories = 480;
    } else {
      baseSteps = 8000;
      baseDistance = 6000;
      baseCalories = 350;
    }

    const isLazyDay = Math.random() < 0.15;
    const variance = isLazyDay ? 0.6 : 0.25;

    monthStats.push({
      steps: Math.max(1000, Math.round(baseSteps * (1 + (Math.random() - 0.5) * variance))),
      distance: Math.max(800, Math.round(baseDistance * (1 + (Math.random() - 0.5) * variance))),
      calories: Math.max(100, Math.round(baseCalories * (1 + (Math.random() - 0.5) * variance))),
      date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
    });
  }

  return { todayStats, yesterdayStats, weekStats, monthStats };
};

// Stable mock data generated once at module load
const MOCK_DATA = generateMockData();

const calculateWeeklySummary = (weekStats: HealthData[]): WeeklySummary => {
  const totalSteps = weekStats.reduce((sum, day) => sum + day.steps, 0);
  const totalDistance = weekStats.reduce((sum, day) => sum + day.distance, 0);
  const totalCalories = weekStats.reduce((sum, day) => sum + day.calories, 0);
  const activeDays = weekStats.filter(day => day.steps > 5000).length;
  const bestDay = weekStats.reduce((best, day) => (day.steps > best.steps ? day : best));
  const worstDay = weekStats.reduce((worst, day) => (day.steps < worst.steps ? day : worst));

  return {
    totalSteps,
    totalDistance,
    totalCalories,
    averageSteps: Math.round(totalSteps / weekStats.length),
    averageDistance: Math.round(totalDistance / weekStats.length),
    averageCalories: Math.round(totalCalories / weekStats.length),
    activeDays,
    bestDay,
    worstDay,
  };
};

const calculateMonthlySummary = (monthStats: HealthData[]): MonthlySummary => {
  const totalSteps = monthStats.reduce((sum, day) => sum + day.steps, 0);
  const totalDistance = monthStats.reduce((sum, day) => sum + day.distance, 0);
  const totalCalories = monthStats.reduce((sum, day) => sum + day.calories, 0);
  const activeDays = monthStats.filter(day => day.steps > 5000).length;
  const bestDay = monthStats.reduce((best, day) => (day.steps > best.steps ? day : best));
  const worstDay = monthStats.reduce((worst, day) => (day.steps < worst.steps ? day : worst));

  let streak = 0;
  for (let i = monthStats.length - 1; i >= 0; i--) {
    if (monthStats[i].steps > 5000) {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalSteps,
    totalDistance,
    totalCalories,
    averageSteps: Math.round(totalSteps / monthStats.length),
    averageDistance: Math.round(totalDistance / monthStats.length),
    averageCalories: Math.round(totalCalories / monthStats.length),
    activeDays,
    bestDay,
    worstDay,
    streak,
  };
};

const calculateTrends = (
  today: HealthData,
  yesterday: HealthData,
  weekStats: HealthData[]
): TrendData => {
  const prevDays = weekStats.slice(0, -1);
  const prevCount = prevDays.length || 1;

  const lastWeekAvgSteps = prevDays.reduce((sum, day) => sum + day.steps, 0) / prevCount;
  const lastWeekAvgDistance = prevDays.reduce((sum, day) => sum + day.distance, 0) / prevCount;
  const lastWeekAvgCalories = prevDays.reduce((sum, day) => sum + day.calories, 0) / prevCount;

  const stepsVsYesterday = ((today.steps - yesterday.steps) / yesterday.steps) * 100;
  const stepsVsLastWeek = ((today.steps - lastWeekAvgSteps) / lastWeekAvgSteps) * 100;
  const distanceVsYesterday = ((today.distance - yesterday.distance) / yesterday.distance) * 100;
  const distanceVsLastWeek = ((today.distance - lastWeekAvgDistance) / lastWeekAvgDistance) * 100;
  const caloriesVsYesterday = ((today.calories - yesterday.calories) / yesterday.calories) * 100;
  const caloriesVsLastWeek = ((today.calories - lastWeekAvgCalories) / lastWeekAvgCalories) * 100;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  const avgTrend = (stepsVsLastWeek + distanceVsLastWeek + caloriesVsLastWeek) / 3;
  if (avgTrend > 10) trend = 'improving';
  else if (avgTrend < -10) trend = 'declining';

  return {
    stepsVsYesterday: Math.round(stepsVsYesterday),
    stepsVsLastWeek: Math.round(stepsVsLastWeek),
    distanceVsYesterday: Math.round(distanceVsYesterday),
    distanceVsLastWeek: Math.round(distanceVsLastWeek),
    caloriesVsYesterday: Math.round(caloriesVsYesterday),
    caloriesVsLastWeek: Math.round(caloriesVsLastWeek),
    trend,
  };
};

export const useHealthData = (): UseHealthDataReturn => {
  const [todayStats, setTodayStats] = useState<HealthData | null>(USE_MOCK_DATA ? MOCK_DATA.todayStats : null);
  const [yesterdayStats, setYesterdayStats] = useState<HealthData | null>(USE_MOCK_DATA ? MOCK_DATA.yesterdayStats : null);
  const [weekStats, setWeekStats] = useState<HealthData[]>(USE_MOCK_DATA ? MOCK_DATA.weekStats : []);
  const [monthStats, setMonthStats] = useState<HealthData[]>(USE_MOCK_DATA ? MOCK_DATA.monthStats : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState(USE_MOCK_DATA);

  const weekSummary = useMemo(
    () => (weekStats.length > 0 ? calculateWeeklySummary(weekStats) : ({} as WeeklySummary)),
    [weekStats]
  );

  const monthSummary = useMemo(
    () => (monthStats.length > 0 ? calculateMonthlySummary(monthStats) : ({} as MonthlySummary)),
    [monthStats]
  );

  const trends = useMemo(
    () =>
      todayStats && yesterdayStats && weekStats.length >= 2
        ? calculateTrends(todayStats, yesterdayStats, weekStats)
        : ({} as TrendData),
    [todayStats, yesterdayStats, weekStats]
  );

  const fetchData = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
      console.log('[useHealthData] Mock data refreshed');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const available = await healthKitService.isAvailable();
      if (!available) {
        throw new Error('Health data is not available on this device');
      }

      const granted = await healthKitService.requestPermissions();
      if (!granted) {
        setHasPermission(false);
        throw new Error('Health data permission denied');
      }

      setHasPermission(true);

      const [today, week, month] = await Promise.all([
        healthKitService.getTodayStats(),
        healthKitService.getWeekStats(),
        healthKitService.getMonthStats(),
      ]);

      setTodayStats(today);
      setWeekStats(week);
      setMonthStats(month);

      if (week.length >= 2) {
        setYesterdayStats(week[week.length - 2]);
      }
    } catch (err) {
      console.error('[useHealthData] Error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (USE_MOCK_DATA) {
      return true;
    }
    try {
      const granted = await healthKitService.requestPermissions();
      setHasPermission(granted);
      if (granted) {
        await fetchData();
      }
      return granted;
    } catch (err) {
      console.error('[useHealthData] Permission error:', err);
      return false;
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    todayStats,
    yesterdayStats,
    weekStats,
    monthStats,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
    requestPermission,
    weekSummary,
    monthSummary,
    trends,
  };
};
