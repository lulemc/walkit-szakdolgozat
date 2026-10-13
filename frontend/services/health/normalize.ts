import type { HealthData, HourlySteps, RawDailyBucket, RawHourlyBucket } from "./types";

const HOURS_PER_DAY = 24;

// Health APIs return offsets like "+0200"; make them "+02:00" so every JS engine parses them.
// Strings without an offset (Health Connect daily buckets) are parsed as local time.
export const parseHealthDate = (value: string): Date =>
  new Date(value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));

export const startOfDay = (date: Date): Date => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

// Whole, non-negative numbers; missing or invalid values count as 0
const clean = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;

/** Today's steps in 24 hourly buckets; buckets from other days are ignored */
export const normalizeHourly = (buckets: RawHourlyBucket[], now: Date): HourlySteps[] => {
  const hourly = Array.from({ length: HOURS_PER_DAY }, (_, hour) => ({ hour, steps: 0 }));
  const today = dayKey(now);

  for (const bucket of buckets) {
    if (dayKey(bucket.start) === today) {
      hourly[bucket.start.getHours()].steps += clean(bucket.steps);
    }
  }

  return hourly;
};

/** Daily totals for the last `days` days including today, oldest first */
export const normalizeDaily = (buckets: RawDailyBucket[], days: number, now: Date): HealthData[] => {
  const first = startOfDay(now);
  first.setDate(first.getDate() - (days - 1));

  const result: HealthData[] = Array.from({ length: days }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    return { steps: 0, distance: 0, calories: 0, date };
  });
  const byDay = new Map(result.map((day) => [dayKey(day.date), day]));

  for (const bucket of buckets) {
    const day = byDay.get(dayKey(bucket.start));
    if (!day) continue;
    day.steps += clean(bucket.steps);
    day.distance += clean(bucket.distance);
    day.calories += clean(bucket.calories);
  }

  return result;
};
