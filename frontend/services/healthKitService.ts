import AppleHealthKit from 'react-native-health';
import { Platform } from 'react-native';


export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number; // in kcal
  date: Date;
}

export enum HealthKitErrorCode {
  NOT_AVAILABLE = 'HEALTHKIT_NOT_AVAILABLE',
  NOT_INITIALIZED = 'HEALTHKIT_NOT_INITIALIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FETCH_FAILED = 'FETCH_FAILED',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',
}

export class HealthKitError extends Error {
  constructor(
    public code: HealthKitErrorCode,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'HealthKitError';
  }
}

interface HealthKitPermissions {
  permissions: {
    read: string[];
    write: string[];
  };
}

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      'StepCount',
      'DistanceWalkingRunning',
      'ActiveEnergyBurned',
    ],
    write: [],
  },
};

class HealthKitService {
  private isInitialized = false;

  /**
   * Check if Apple Health is available on this device
   */
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('[HealthKit] Not available - not iOS platform');
      return false;
    }

    return new Promise((resolve) => {
      (AppleHealthKit as any).isAvailable((error: any, available: boolean) => {
        if (error) {
          console.error('[HealthKit] Error checking availability:', error);
          resolve(false);
        } else {
          console.log('[HealthKit] Available:', available);
          resolve(available);
        }
      });
    });
  }

  /**
   * Request permissions to access health data
   * @returns true if permissions were granted
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    return new Promise((resolve) => {
      (AppleHealthKit as any).initHealthKit(permissions, (error: any) => {
        if (error) {
          console.error('[HealthKit] Permission error:', error);
          this.isInitialized = false;
          resolve(false);
        } else {
          console.log('[HealthKit] Permissions granted');
          this.isInitialized = true;
          resolve(true);
        }
      });
    });
  }

  /**
   * Get today's health statistics
   */
  async getTodayStats(): Promise<HealthData> {
    this.ensureInitialized();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: now.toISOString(),
    };

    console.log('[HealthKit] Fetching today\'s stats:', options);

    const [steps, distance, calories] = await Promise.all([
      this.getSteps(options),
      this.getDistance(options),
      this.getCalories(options),
    ]);

    console.log('[HealthKit] Today\'s stats:', { steps, distance, calories });

    return {
      steps,
      distance,
      calories,
      date: new Date(),
    };
  }

  /**
   * Get step count for date range
   * @private
   */
  private getSteps(options: { startDate: string; endDate: string }): Promise<number> {
    return new Promise((resolve) => {
      (AppleHealthKit as any).getStepCount(
        options,
        (error: any, results: any) => {
          if (error) {
            console.error('[HealthKit] Error fetching steps:', error);
            resolve(0);
          } else {
            const steps = Math.round(results?.value || 0);
            console.log('[HealthKit] Steps:', steps);
            resolve(steps);
          }
        }
      );
    });
  }

  /**
   * Get walking/running distance for date range (in meters)
   * @private
   */
  private getDistance(options: { startDate: string; endDate: string }): Promise<number> {
    return new Promise((resolve) => {
      (AppleHealthKit as any).getDistanceWalkingRunning(
        options,
        (error: any, results: any) => {
          if (error) {
            console.error('[HealthKit] Error fetching distance:', error);
            resolve(0);
          } else {
            const distance = Math.round(results?.value || 0);
            console.log('[HealthKit] Distance:', distance, 'meters');
            resolve(distance);
          }
        }
      );
    });
  }

  /**
   * Get active energy burned for date range (in kcal)
   * @private
   */
  private getCalories(options: { startDate: string; endDate: string }): Promise<number> {
    return new Promise((resolve) => {
      (AppleHealthKit as any).getActiveEnergyBurned(
        options,
        (error: any, results: any) => {
          if (error) {
            console.error('[HealthKit] Error fetching calories:', error);
            resolve(0);
          } else {
            const calories = Math.round(results?.value || 0);
            console.log('[HealthKit] Calories:', calories, 'kcal');
            resolve(calories);
          }
        }
      );
    });
  }

  /**
   * Get health stats for the past N days
   * @param days Number of days to fetch (including today)
   */
  async getStatsForDays(days: number): Promise<HealthData[]> {
    this.ensureInitialized();

    if (days <= 0) {
      throw new HealthKitError(
        HealthKitErrorCode.INVALID_DATE_RANGE,
        'Number of days must be positive'
      );
    }

    console.log(`[HealthKit] Fetching stats for past ${days} days`);

    const stats: HealthData[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const options = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      };

      const [steps, distance, calories] = await Promise.all([
        this.getSteps(options),
        this.getDistance(options),
        this.getCalories(options),
      ]);

      stats.push({
        steps,
        distance,
        calories,
        date: startOfDay,
      });
    }

    // Return in chronological order (oldest first)
    return stats.reverse();
  }

  /**
   * Get weekly stats (last 7 days)
   */
  async getWeekStats(): Promise<HealthData[]> {
    console.log('[HealthKit] Fetching weekly stats');
    return this.getStatsForDays(7);
  }

  /**
   * Get monthly stats (last 30 days)
   */
  async getMonthStats(): Promise<HealthData[]> {
    console.log('[HealthKit] Fetching monthly stats');
    return this.getStatsForDays(30);
  }

  /**
   * Ensure service is initialized before use
   * @private
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new HealthKitError(
        HealthKitErrorCode.NOT_INITIALIZED,
        'HealthKit not initialized. Call requestPermissions() first.'
      );
    }
  }
}

export const healthKitService = new HealthKitService();