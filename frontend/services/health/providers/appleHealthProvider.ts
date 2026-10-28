import { Linking, Platform } from "react-native";
// @ts-ignore - react-native-health's typings don't cover this import style
import AppleHealthKit, { HealthKitPermissions } from "react-native-health";
import { parseHealthDate, startOfDay } from "../normalize";
import {
  HealthAvailability,
  HealthErrorCode,
  HealthProvider,
  HealthServiceError,
  RawDailyBucket,
  RawHourlyBucket,
} from "../types";

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

export class AppleHealthProvider implements HealthProvider {
  readonly platform = "apple-health" as const;
  readonly displayName = "Apple Health";
  private isInitialized = false;

  /** HealthKit only exists in iOS builds that include the native module (not Expo Go) */
  async getAvailability(): Promise<HealthAvailability> {
    return Platform.OS === "ios" && typeof AppleHealthKit?.initHealthKit === "function"
      ? "available"
      : "unsupported";
  }

  async requestPermissions(): Promise<boolean> {
    if ((await this.getAvailability()) !== "available") {
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        // A refusal shows as the "access denied" state on the Statistics screen
        this.isInitialized = !error;
        resolve(!error);
      });
    });
  }

  async getHourlySteps(now: Date): Promise<RawHourlyBucket[]> {
    this.ensureInitialized();

    const samples = await this.querySamples(
      AppleHealthKit.getDailyStepCountSamples,
      startOfDay(now),
      now,
      MINUTES_PER_HOUR,
    );

    return samples.map((sample) => ({ start: parseHealthDate(sample.startDate), steps: sample.value }));
  }

  async getDailyStats(days: number, now: Date): Promise<RawDailyBucket[]> {
    this.ensureInitialized();

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

    return [
      ...steps.map((s) => ({ start: parseHealthDate(s.startDate), steps: s.value })),
      ...distance.map((s) => ({ start: parseHealthDate(s.startDate), distance: s.value })),
      ...calories.map((s) => ({ start: parseHealthDate(s.startDate), calories: s.value })),
    ];
  }

  async openSettings(): Promise<void> {
    await Linking.openSettings();
  }

  // Apple Health is part of iOS, so there is nothing to install
  async openInstallPage(): Promise<void> {}

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
              new HealthServiceError(
                HealthErrorCode.FETCH_FAILED,
                "Failed to read Apple Health data",
                this.platform,
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
      throw new HealthServiceError(
        HealthErrorCode.NOT_INITIALIZED,
        "Apple Health not initialized. Request permissions first.",
        this.platform,
      );
    }
  }
}

export const appleHealthProvider: HealthProvider = new AppleHealthProvider();
