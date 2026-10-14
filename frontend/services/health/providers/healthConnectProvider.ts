import { Linking } from "react-native";
import type { AggregationGroupResult, Permission } from "react-native-health-connect";
import { parseHealthDate, startOfDay } from "../normalize";
import {
  HealthAvailability,
  HealthErrorCode,
  HealthProvider,
  HealthServiceError,
  RawDailyBucket,
  RawHourlyBucket,
} from "../types";

type HealthConnectModule = typeof import("react-native-health-connect");
type DistanceGroup = AggregationGroupResult<"Distance">;
type CaloriesGroup = AggregationGroupResult<"ActiveCaloriesBurned">;

export const HEALTH_CONNECT_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata";

const PERMISSIONS: Permission[] = [
  { accessType: "read", recordType: "Steps" },
  { accessType: "read", recordType: "Distance" },
  { accessType: "read", recordType: "ActiveCaloriesBurned" },
];

// Loaded on first use: under the New Architecture the library throws on import
// when its native module is missing (Expo Go, iOS, web)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadHealthConnect = (): HealthConnectModule => require("react-native-health-connect");

const between = (start: Date, end: Date) => ({
  operator: "between" as const,
  startTime: start.toISOString(),
  endTime: end.toISOString(),
});

export class HealthConnectProvider implements HealthProvider {
  readonly platform = "health-connect" as const;
  readonly displayName = "Health Connect";
  private isInitialized = false;

  async getAvailability(): Promise<HealthAvailability> {
    try {
      const healthConnect = loadHealthConnect();
      const status = await healthConnect.getSdkStatus();
      const { SdkAvailabilityStatus } = healthConnect;

      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return "available";
      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        return "updateRequired";
      }
      return "notInstalled";
    } catch {
      // The native module isn't part of this build
      return "unsupported";
    }
  }

  async requestPermissions(): Promise<boolean> {
    const healthConnect = await this.ready();
    const granted = await this.run(() => healthConnect.requestPermission(PERMISSIONS));

    return granted.some(
      (permission) =>
        "recordType" in permission &&
        permission.accessType === "read" &&
        permission.recordType === "Steps",
    );
  }

  async getHourlySteps(now: Date): Promise<RawHourlyBucket[]> {
    const healthConnect = await this.ready();
    await this.requireStepsAccess(healthConnect);

    const groups = await this.run(() =>
      healthConnect.aggregateGroupByDuration({
        recordType: "Steps",
        timeRangeFilter: between(startOfDay(now), now),
        timeRangeSlicer: { duration: "HOURS", length: 1 },
      }),
    );

    return groups.map((group) => ({
      start: parseHealthDate(group.startTime),
      steps: group.result.COUNT_TOTAL,
    }));
  }

  async getDailyStats(days: number, now: Date): Promise<RawDailyBucket[]> {
    const healthConnect = await this.ready();

    const start = startOfDay(now);
    start.setDate(start.getDate() - (days - 1));
    const timeRangeFilter = between(start, now);
    const timeRangeSlicer = { period: "DAYS" as const, length: 1 };

    const granted = await this.grantedReadTypes(healthConnect);
    if (!granted.has("Steps")) throw this.permissionDenied();

    // Metrics the user didn't allow are skipped; normalisation turns them into 0
    const [steps, distance, calories] = await Promise.all([
      this.run(() =>
        healthConnect.aggregateGroupByPeriod({ recordType: "Steps", timeRangeFilter, timeRangeSlicer }),
      ),
      granted.has("Distance")
        ? this.run(() =>
            healthConnect.aggregateGroupByPeriod({
              recordType: "Distance",
              timeRangeFilter,
              timeRangeSlicer,
            }),
          )
        : Promise.resolve<DistanceGroup[]>([]),
      granted.has("ActiveCaloriesBurned")
        ? this.run(() =>
            healthConnect.aggregateGroupByPeriod({
              recordType: "ActiveCaloriesBurned",
              timeRangeFilter,
              timeRangeSlicer,
            }),
          )
        : Promise.resolve<CaloriesGroup[]>([]),
    ]);

    // Daily groups start at local midnight and come back without an offset
    return [
      ...steps.map((g) => ({ start: parseHealthDate(g.startTime), steps: g.result.COUNT_TOTAL })),
      ...distance.map((g) => ({
        start: parseHealthDate(g.startTime),
        distance: g.result.DISTANCE.inMeters,
      })),
      ...calories.map((g) => ({
        start: parseHealthDate(g.startTime),
        calories: g.result.ACTIVE_CALORIES_TOTAL.inKilocalories,
      })),
    ];
  }

  async openSettings(): Promise<void> {
    loadHealthConnect().openHealthConnectSettings();
  }

  async openInstallPage(): Promise<void> {
    await Linking.openURL(HEALTH_CONNECT_PLAY_STORE_URL);
  }

  /** Loads and initialises Health Connect once; every data call goes through here */
  private async ready(): Promise<HealthConnectModule> {
    const healthConnect = loadHealthConnect();

    if (!this.isInitialized) {
      this.isInitialized = await this.run(() => healthConnect.initialize());
    }
    if (!this.isInitialized) {
      throw new HealthServiceError(
        HealthErrorCode.NOT_INITIALIZED,
        "Health Connect could not be initialized",
        this.platform,
      );
    }

    return healthConnect;
  }

  /** Record types the user currently allows us to read (access can change at any time) */
  private async grantedReadTypes(healthConnect: HealthConnectModule): Promise<Set<string>> {
    const permissions = await this.run(() => healthConnect.getGrantedPermissions());
    return new Set(
      permissions.flatMap((permission) =>
        "recordType" in permission && permission.accessType === "read"
          ? [permission.recordType]
          : [],
      ),
    );
  }

  private async requireStepsAccess(healthConnect: HealthConnectModule): Promise<void> {
    if (!(await this.grantedReadTypes(healthConnect)).has("Steps")) throw this.permissionDenied();
  }

  private permissionDenied(): HealthServiceError {
    return new HealthServiceError(
      HealthErrorCode.PERMISSION_DENIED,
      "Access to Health Connect was not granted",
      this.platform,
    );
  }

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Access was revoked between the permission check and the read
      if (typeof error === "object" && error !== null && "code" in error && error.code === "PERMISSION_ERROR") {
        throw new HealthServiceError(
          HealthErrorCode.PERMISSION_DENIED,
          "Access to Health Connect was not granted",
          this.platform,
          error instanceof Error ? error : undefined,
        );
      }
      throw new HealthServiceError(
        HealthErrorCode.FETCH_FAILED,
        "Failed to read Health Connect data",
        this.platform,
        error instanceof Error ? error : undefined,
      );
    }
  }
}

export const healthConnectProvider: HealthProvider = new HealthConnectProvider();
