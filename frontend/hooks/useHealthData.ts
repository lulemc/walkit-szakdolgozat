import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { healthKitService, HealthData, HourlySteps } from "@/services/healthKitService";
import { generateMockHealth, HealthSnapshot } from "@/utils/mockHealthData";
import {
  compareDays,
  currentStreak,
  HealthSummary,
  HealthTrends,
  summarize,
} from "@/utils/healthStats";

export type HealthStatus = "loading" | "ready" | "unavailable" | "denied" | "error";

export interface UseHealthDataReturn {
  status: HealthStatus;
  error: Error | null;
  today: HealthData | null;
  yesterday: HealthData | null;
  hourly: HourlySteps[];
  week: HealthData[];
  month: HealthData[];
  weekSummary: HealthSummary | null;
  monthSummary: HealthSummary | null;
  trends: HealthTrends;
  streak: number;
  refreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const MONTH_DAYS = 30;
const WEEK_DAYS = 7;

// Mock data is the default so the screen works in Expo Go;
// set EXPO_PUBLIC_USE_MOCK_HEALTH=false to read Apple Health in a dev build
const isMockMode = () => process.env.EXPO_PUBLIC_USE_MOCK_HEALTH !== "false";

class HealthAccessError extends Error {
  constructor(public status: "unavailable" | "denied") {
    super(`Health data ${status}`);
  }
}

export const useHealthData = (): UseHealthDataReturn => {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasPermission = useRef(false);
  const hasData = useRef(false);

  const loadSnapshot = useCallback(async (): Promise<HealthSnapshot> => {
    if (isMockMode()) {
      return generateMockHealth();
    }

    if (!(await healthKitService.isAvailable())) {
      throw new HealthAccessError("unavailable");
    }

    if (!hasPermission.current) {
      if (!(await healthKitService.requestPermissions())) {
        throw new HealthAccessError("denied");
      }
      hasPermission.current = true;
    }

    const [hourly, month] = await Promise.all([
      healthKitService.getHourlySteps(),
      healthKitService.getDailyStats(MONTH_DAYS),
    ]);

    return { hourly, month };
  }, []);

  const applySnapshot = useCallback((next: HealthSnapshot) => {
    hasData.current = true;
    setSnapshot(next);
    setError(null);
    setStatus("ready");
    setLastUpdated(new Date());
  }, []);

  const applyError = useCallback((err: unknown) => {
    if (err instanceof HealthAccessError) {
      setStatus(err.status);
      return;
    }

    console.error("[useHealthData] Error:", err);
    setError(err as Error);
    // Keep showing the last good data when a refresh fails
    if (!hasData.current) {
      setStatus("error");
    }
  }, []);

  // State is only updated in the promise callbacks, after the data has loaded
  const load = useCallback(
    () => loadSnapshot().then(applySnapshot, applyError),
    [loadSnapshot, applySnapshot, applyError],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const derived = useMemo(() => {
    const month = snapshot?.month ?? [];
    const week = month.slice(-WEEK_DAYS);
    const today = month[month.length - 1] ?? null;
    const yesterday = month[month.length - 2] ?? null;

    return {
      hourly: snapshot?.hourly ?? [],
      month,
      week,
      today,
      yesterday,
      weekSummary: summarize(week),
      monthSummary: summarize(month),
      trends: compareDays(today, yesterday),
      streak: currentStreak(month),
    };
  }, [snapshot]);

  return { status, error, refreshing, lastUpdated, refresh, ...derived };
};
