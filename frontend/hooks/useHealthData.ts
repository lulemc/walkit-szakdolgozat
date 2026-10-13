import { AppState } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { healthService } from "@/services/health/healthService";
import {
  HealthData,
  HealthErrorCode,
  HealthServiceError,
  HourlySteps,
} from "@/services/health/types";
import {
  compareDays,
  currentStreak,
  HealthSummary,
  HealthTrends,
  summarize,
} from "@/utils/healthStats";

export type HealthStatus =
  | "loading"
  | "ready"
  | "unavailable"
  | "notInstalled"
  | "denied"
  | "error";

export interface UseHealthDataReturn {
  status: HealthStatus;
  error: Error | null;
  providerName: string;
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
  openSettings: () => Promise<void>;
  openInstallPage: () => Promise<void>;
}

interface HealthSnapshot {
  hourly: HourlySteps[];
  month: HealthData[];
}

const MONTH_DAYS = 30;
const WEEK_DAYS = 7;

// Errors that mean "the user has to do something" rather than "something broke"
const STATUS_BY_CODE: Partial<Record<HealthErrorCode, HealthStatus>> = {
  [HealthErrorCode.UNSUPPORTED_PLATFORM]: "unavailable",
  [HealthErrorCode.NOT_INSTALLED]: "notInstalled",
  [HealthErrorCode.UPDATE_REQUIRED]: "notInstalled",
  [HealthErrorCode.PERMISSION_DENIED]: "denied",
};

const loadSnapshot = async (): Promise<HealthSnapshot> => {
  await healthService.connect();

  const [hourly, month] = await Promise.all([
    healthService.getHourlySteps(),
    healthService.getDailyStats(MONTH_DAYS),
  ]);

  return { hourly, month };
};

export const useHealthData = (): UseHealthDataReturn => {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasData = useRef(false);
  const statusRef = useRef(status);
  const pendingRefresh = useRef<Promise<void> | null>(null);
  const leftForExternalAction = useRef(false);

  const applySnapshot = useCallback((next: HealthSnapshot) => {
    hasData.current = true;
    setSnapshot(next);
    setError(null);
    setStatus("ready");
    setLastUpdated(new Date());
  }, []);

  const applyError = useCallback((err: unknown) => {
    const accessStatus = err instanceof HealthServiceError ? STATUS_BY_CODE[err.code] : undefined;
    if (accessStatus) {
      setStatus(accessStatus);
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
    [applySnapshot, applyError],
  );

  // One load at a time: overlapping loads would open overlapping permission dialogs
  const refresh = useCallback(() => {
    if (pendingRefresh.current) return pendingRefresh.current;

    setRefreshing(true);
    const pending = load().finally(() => {
      pendingRefresh.current = null;
      setRefreshing(false);
    });
    pendingRefresh.current = pending;
    return pending;
  }, [load]);

  const openSettings = useCallback(() => {
    leftForExternalAction.current = true;
    return healthService.openSettings();
  }, []);
  const openInstallPage = useCallback(() => {
    leftForExternalAction.current = true;
    return healthService.openInstallPage();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Coming back from Settings or the Play Store: pick up the access the user just granted.
  // Only after leaving on purpose, otherwise the permission dialog would reopen on every app switch.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !leftForExternalAction.current) return;
      leftForExternalAction.current = false;

      if (statusRef.current === "denied" || statusRef.current === "notInstalled") {
        refresh();
      }
    });
    return () => subscription.remove();
  }, [refresh]);

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

  return {
    status,
    error,
    providerName: healthService.displayName,
    refreshing,
    lastUpdated,
    refresh,
    openSettings,
    openInstallPage,
    ...derived,
  };
};
