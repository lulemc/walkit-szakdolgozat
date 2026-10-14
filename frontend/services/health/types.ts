export type HealthPlatform = "apple-health" | "health-connect" | "mock" | "unsupported";

export type HealthAvailability = "available" | "notInstalled" | "updateRequired" | "unsupported";

export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number; // in kcal
  date: Date; // local midnight
}

export interface HourlySteps {
  hour: number; // 0-23
  steps: number;
}

/** A provider's raw hourly sample; normalize.ts turns these into HourlySteps */
export interface RawHourlyBucket {
  start: Date;
  steps: number;
}

/** A provider's raw daily sample for one or more metrics; normalize.ts merges them per day */
export interface RawDailyBucket {
  start: Date;
  steps?: number;
  distance?: number; // meters
  calories?: number; // kcal
}

export enum HealthErrorCode {
  UNSUPPORTED_PLATFORM = "UNSUPPORTED_PLATFORM",
  NOT_INSTALLED = "NOT_INSTALLED",
  UPDATE_REQUIRED = "UPDATE_REQUIRED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NOT_INITIALIZED = "NOT_INITIALIZED",
  FETCH_FAILED = "FETCH_FAILED",
  INVALID_RANGE = "INVALID_RANGE",
}

export class HealthServiceError extends Error {
  constructor(
    public code: HealthErrorCode,
    message: string,
    public platform: HealthPlatform,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "HealthServiceError";
  }
}

/** One health data source. The app talks to these only through healthService. */
export interface HealthProvider {
  readonly platform: HealthPlatform;
  readonly displayName: string;
  getAvailability(): Promise<HealthAvailability>;
  /** true when read access was granted (iOS never reveals denied read access) */
  requestPermissions(): Promise<boolean>;
  getHourlySteps(now: Date): Promise<RawHourlyBucket[]>;
  getDailyStats(days: number, now: Date): Promise<RawDailyBucket[]>;
  openSettings(): Promise<void>;
  openInstallPage(): Promise<void>;
}
