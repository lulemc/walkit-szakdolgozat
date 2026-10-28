import type { WalkActivity } from '@/types/walk';
import { startOfLocalWeek } from './walkMetrics';

export const DEFAULT_WEEKLY_GOAL_KM = 10;
export const MIN_WEEKLY_GOAL_KM = 1;
export const MAX_WEEKLY_GOAL_KM = 200;
/** How far back walks are loaded for the streak */
export const STREAK_LOOKBACK_WEEKS = 52;

/** Monday 00:00 local time, `weeks` weeks earlier (setDate keeps local midnight across DST) */
export const weeksBefore = (week: Date, weeks: number): Date => {
  const earlier = new Date(week);
  earlier.setDate(earlier.getDate() - 7 * weeks);
  return earlier;
};

/**
 * How many weeks in a row (Monday to Sunday, phone time) had at least one
 * walk. This week is still in progress, so not having walked yet doesn't
 * break the streak.
 */
export const weeklyStreak = (activity: WalkActivity[], now: Date): number => {
  const weeks = new Set(activity.map((walk) => startOfLocalWeek(new Date(walk.startedAt)).getTime()));
  let week = startOfLocalWeek(now);
  if (!weeks.has(week.getTime())) week = weeksBefore(week, 1);

  let streak = 0;
  for (; weeks.has(week.getTime()); week = weeksBefore(week, 1)) streak++;
  return streak;
};

/** Metres walked since Monday 00:00 local time */
export const distanceThisWeekM = (activity: WalkActivity[], now: Date): number => {
  const monday = startOfLocalWeek(now).getTime();
  return activity
    .filter((walk) => new Date(walk.startedAt).getTime() >= monday)
    .reduce((total, walk) => total + walk.distanceM, 0);
};

/** The typed goal in km (a decimal comma is fine), or null if it isn't 1-200 */
export const parseGoalKm = (text: string): number | null => {
  const trimmed = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const km = Number(trimmed);
  return km >= MIN_WEEKLY_GOAL_KM && km <= MAX_WEEKLY_GOAL_KM ? km : null;
};
