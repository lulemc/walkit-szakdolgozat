import { nativeProvider } from "./providers";
import { mockProvider } from "./providers/mockProvider";
import { normalizeDaily, normalizeHourly } from "./normalize";
import {
  HealthAvailability,
  HealthData,
  HealthErrorCode,
  HealthPlatform,
  HealthProvider,
  HealthServiceError,
  HourlySteps,
} from "./types";

// Mock data is the default so the app works in Expo Go;
// set EXPO_PUBLIC_USE_MOCK_HEALTH=false to read the device's health platform
const isMockMode = () => process.env.EXPO_PUBLIC_USE_MOCK_HEALTH !== "false";

const UNAVAILABLE: Record<Exclude<HealthAvailability, "available">, HealthErrorCode> = {
  unsupported: HealthErrorCode.UNSUPPORTED_PLATFORM,
  notInstalled: HealthErrorCode.NOT_INSTALLED,
  updateRequired: HealthErrorCode.UPDATE_REQUIRED,
};

/**
 * The single entry point for health data. Picks the platform's provider,
 * normalises its data and reports every failure as a HealthServiceError.
 */
export class HealthService {
  private grantedProvider: HealthProvider | null = null;

  private get provider(): HealthProvider {
    return isMockMode() ? mockProvider : nativeProvider;
  }

  get platform(): HealthPlatform {
    return this.provider.platform;
  }

  get displayName(): string {
    return this.provider.displayName;
  }

  getAvailability(): Promise<HealthAvailability> {
    return this.guard(() => this.provider.getAvailability());
  }

  /** Asks once per session; returns true without asking again after a grant */
  async requestPermissions(): Promise<boolean> {
    const provider = this.provider;
    if (this.grantedProvider === provider) return true;

    const granted = await this.guard(() => provider.requestPermissions());
    if (granted) this.grantedProvider = provider;
    return granted;
  }

  /** Makes sure the platform is available and readable, or throws a typed error */
  async connect(): Promise<void> {
    const availability = await this.getAvailability();
    if (availability !== "available") {
      throw new HealthServiceError(
        UNAVAILABLE[availability],
        `${this.displayName} is not available (${availability})`,
        this.platform,
      );
    }

    if (!(await this.requestPermissions())) {
      throw new HealthServiceError(
        HealthErrorCode.PERMISSION_DENIED,
        `Access to ${this.displayName} was not granted`,
        this.platform,
      );
    }
  }

  async getHourlySteps(now: Date = new Date()): Promise<HourlySteps[]> {
    const buckets = await this.guard(() => this.provider.getHourlySteps(now));
    return normalizeHourly(buckets, now);
  }

  async getDailyStats(days: number, now: Date = new Date()): Promise<HealthData[]> {
    if (!Number.isInteger(days) || days <= 0) {
      throw new HealthServiceError(
        HealthErrorCode.INVALID_RANGE,
        "Number of days must be a positive whole number",
        this.platform,
      );
    }

    const buckets = await this.guard(() => this.provider.getDailyStats(days, now));
    return normalizeDaily(buckets, days, now);
  }

  openSettings(): Promise<void> {
    return this.guard(() => this.provider.openSettings());
  }

  openInstallPage(): Promise<void> {
    return this.guard(() => this.provider.openInstallPage());
  }

  /** Lets HealthServiceErrors through and wraps anything else as FETCH_FAILED */
  private async guard<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HealthServiceError) throw error;
      throw new HealthServiceError(
        HealthErrorCode.FETCH_FAILED,
        `Failed to read ${this.displayName} data`,
        this.platform,
        error instanceof Error ? error : undefined,
      );
    }
  }
}

export const healthService = new HealthService();
