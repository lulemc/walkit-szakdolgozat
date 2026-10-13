import { Platform } from "react-native";
// @ts-ignore - react-native-health's typings don't cover this import style
import AppleHealthKit, { HealthKitPermissions } from "react-native-health";

export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number; // in kcal
  date: Date;
}

export interface HourlySteps {
  hour: number; // 0-23
  steps: number;
}

export enum HealthKitErrorCode {
  NOT_AVAILABLE = "HEALTHKIT_NOT_AVAILABLE",
  NOT_INITIALIZED = "HEALTHKIT_NOT_INITIALIZED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  FETCH_FAILED = "FETCH_FAILED",
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
}

export class HealthKitError extends Error {
  constructor(
    public code: HealthKitErrorCode,
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "HealthKitError";
  }
}

interface HealthSample {
  startDate: string;
  value: number;
}

type SampleQuery = (
  options: Record<string, unknown>,
  callback: (error: unknown, results: HealthSample[]) => void,
) => void;

const permissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.StepCount,
      AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
    write: [],
  },
} as HealthKitPermissions;

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * 60;

// HealthKit returns offsets like "+0200"; make them "+02:00" so every JS engine parses them
export const parseHealthDate = (value: string): Date =>
  new Date(value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));

const startOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export class HealthKitService {
  private isInitialized = false;

  /** HealthKit only exists in iOS builds that include the native module (not Expo Go or web) */
  async isAvailable(): Promise<boolean> {
    return Platform.OS === "ios" && typeof AppleHealthKit?.initHealthKit === "function";
  }

  /**
   * Request permissions to access health data
   * @returns true if HealthKit initialised. iOS never reveals denied read access.
   */
  async requestPermissions(): Promise<boolean> {
    if (!(await this.isAvailable())) {
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error("[HealthKit] Permission error:", error);
        }
        this.isInitialized = !error;
        resolve(!error);
      });
    });
  }

  /**
   * Today's steps in 24 hourly buckets; hours without data are 0
   */
  async getHourlySteps(now: Date = new Date()): Promise<HourlySteps[]> {
    this.ensureInitialized();

    const samples = await this.querySamples(
      AppleHealthKit.getDailyStepCountSamples,
      startOfDay(now),
      now,
      MINUTES_PER_HOUR,
    );

    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, steps: 0 }));
    for (const sample of samples) {
      const date = parseHealthDate(sample.startDate);
      if (dayKey(date) === dayKey(now)) {
        hourly[date.getHours()].steps += Math.round(sample.value);
      }
    }

    return hourly;
  }

  /**
   * Daily totals for the last `days` days including today, oldest first
   */
  async getDailyStats(days: number, now: Date = new Date()): Promise<HealthData[]> {
    this.ensureInitialized();

    if (days <= 0) {
      throw new HealthKitError(
        HealthKitErrorCode.INVALID_DATE_RANGE,
        "Number of days must be positive",
      );
    }

    const start = startOfDay(now);
    start.setDate(start.getDate() - (days - 1));

    const [steps, distance, calories] = await Promise.all([
      this.querySamples(AppleHealthKit.getDailyStepCountSamples, start, now, MINUTES_PER_DAY),
      this.querySamples(
        AppleHealthKit.getDailyDistanceWalkingRunningSamples,
        start,
        now,
        MINUTES_PER_DAY,
      ),
      this.querySamples(AppleHealthKit.getActiveEnergyBurned, start, now, MINUTES_PER_DAY),
    ]);

    const result: HealthData[] = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { steps: 0, distance: 0, calories: 0, date };
    });
    const byDay = new Map(result.map((day) => [dayKey(day.date), day]));

    const addSamples = (samples: HealthSample[], key: "steps" | "distance" | "calories") => {
      for (const sample of samples) {
        const day = byDay.get(dayKey(parseHealthDate(sample.startDate)));
        if (day) day[key] += Math.round(sample.value);
      }
    };
    addSamples(steps, "steps");
    addSamples(distance, "distance");
    addSamples(calories, "calories");

    return result;
  }

  private querySamples(
    query: SampleQuery,
    startDate: Date,
    endDate: Date,
    period: number,
  ): Promise<HealthSample[]> {
    return new Promise((resolve, reject) => {
      query(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          period,
          ascending: true,
          includeManuallyAdded: true,
        },
        (error, results) => {
          if (error) {
            reject(
              new HealthKitError(
                HealthKitErrorCode.FETCH_FAILED,
                "Failed to read Apple Health data",
                error instanceof Error ? error : undefined,
              ),
            );
          } else {
            resolve(results ?? []);
          }
        },
      );
    });
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new HealthKitError(
        HealthKitErrorCode.NOT_INITIALIZED,
        "HealthKit not initialized. Call requestPermissions() first.",
      );
    }
  }
}

export const healthKitService = new HealthKitService();
