export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number; // in kcal
  date: Date;
}

export interface DailyHealthStats extends HealthData {
  activeMinutes?: number;
  walkingDuration?: number;
  hourlyBreakdown?: HourlyStats[];
}

export interface HourlyStats {
  hour: number; // 0-23
  steps: number;
  calories: number;
}

export interface WeeklySummary {
  totalSteps: number;
  totalDistanceKm: number;
  totalCalories: number;
  averageSteps: number;
  averageDistanceKm: number;
  averageCalories: number;
  activeDays: number;
  bestDay: HealthData;
  period: {
    start: Date;
    end: Date;
  };
}

export interface MonthlySummary extends WeeklySummary {
  trend: 'improving' | 'declining' | 'stable';
  comparisonWithPrevious: {
    stepsDiff: number; // percentage
    distanceDiff: number;
    caloriesDiff: number;
  };
}

export enum HealthDataType {
  Steps = 'steps',
  Distance = 'distance',
  Calories = 'calories',
  ActiveMinutes = 'active_minutes',
}

export enum HealthPermissionStatus {
  NotDetermined = 'not_determined',
  Granted = 'granted',
  Denied = 'denied',
  Restricted = 'restricted',
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