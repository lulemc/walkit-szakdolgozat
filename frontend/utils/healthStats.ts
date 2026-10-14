import type { HealthData } from "@/services/health/types";

export const DAILY_STEP_GOAL = 10000;
export const ACTIVE_DAY_STEPS = 5000;

export interface HealthSummary {
  totalSteps: number;
  totalDistance: number; // meters
  totalCalories: number;
  averageSteps: number;
  averageDistance: number;
  averageCalories: number;
  activeDays: number;
  dayCount: number;
  bestDay: HealthData;
}

export interface HealthTrends {
  steps: number | null;
  distance: number | null;
  calories: number | null;
}

const sumOf = (days: HealthData[], key: "steps" | "distance" | "calories") =>
  days.reduce((total, day) => total + day[key], 0);

export const summarize = (days: HealthData[]): HealthSummary | null => {
  if (days.length === 0) return null;

  const totalSteps = sumOf(days, "steps");
  const totalDistance = sumOf(days, "distance");
  const totalCalories = sumOf(days, "calories");

  return {
    totalSteps,
    totalDistance,
    totalCalories,
    averageSteps: Math.round(totalSteps / days.length),
    averageDistance: Math.round(totalDistance / days.length),
    averageCalories: Math.round(totalCalories / days.length),
    activeDays: days.filter((day) => day.steps >= ACTIVE_DAY_STEPS).length,
    dayCount: days.length,
    bestDay: days.reduce((best, day) => (day.steps > best.steps ? day : best)),
  };
};

/** Whole-number percent change, or null when there is no baseline to compare against */
export const percentChange = (current: number, previous: number): number | null =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

export const compareDays = (
  today: HealthData | null,
  yesterday: HealthData | null,
): HealthTrends => {
  if (!today || !yesterday) {
    return { steps: null, distance: null, calories: null };
  }

  return {
    steps: percentChange(today.steps, yesterday.steps),
    distance: percentChange(today.distance, yesterday.distance),
    calories: percentChange(today.calories, yesterday.calories),
  };
};

/**
 * Consecutive active days ending with the newest day. Today is still in
 * progress, so it can extend the streak but never breaks it.
 */
export const currentStreak = (days: HealthData[], threshold = ACTIVE_DAY_STEPS): number => {
  let index = days.length - 1;
  if (index >= 0 && days[index].steps < threshold) index--;

  let streak = 0;
  for (; index >= 0 && days[index].steps >= threshold; index--) streak++;

  return streak;
};

export const hasAnyActivity = (days: HealthData[]): boolean =>
  days.some((day) => day.steps > 0 || day.distance > 0 || day.calories > 0);
