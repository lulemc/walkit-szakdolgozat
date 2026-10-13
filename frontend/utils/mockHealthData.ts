import type { HealthData, HourlySteps } from "@/services/healthKitService";

export interface HealthSnapshot {
  hourly: HourlySteps[];
  month: HealthData[];
}

const METERS_PER_STEP = 0.75;
const KCAL_PER_STEP = 0.04;

// Relative activity per hour: quiet at night, peaks at commute, lunch and evening
const HOURLY_WEIGHTS = [
  0, 0, 0, 0, 0, 0.2, 0.6, 1.4, 1.2, 0.6, 0.5, 0.7, 1.3, 0.9, 0.5, 0.5, 0.7, 1.5, 1.3, 0.9, 0.6,
  0.3, 0.1, 0,
];

// Small deterministic PRNG so the mock data is stable for a given day
const seededRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const startOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const toHealthData = (steps: number, date: Date): HealthData => ({
  steps,
  distance: Math.round(steps * METERS_PER_STEP),
  calories: Math.round(steps * KCAL_PER_STEP),
  date,
});

export const generateMockHealth = (now: Date = new Date(), days = 30): HealthSnapshot => {
  const today = startOfDay(now);
  const random = seededRandom(
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate(),
  );

  const month: HealthData[] = [];
  for (let offset = days - 1; offset >= 1; offset--) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const base = isWeekend ? 11000 : 8000;
    const isLazyDay = random() < 0.15;
    const factor = isLazyDay ? 0.35 + random() * 0.2 : 0.75 + random() * 0.5;

    month.push(toHealthData(Math.round(base * factor), date));
  }

  // Spread today's total over the hours that have already passed
  const todayTarget = 9000 + random() * 4000;
  const totalWeight = HOURLY_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
  const hourly: HourlySteps[] = HOURLY_WEIGHTS.map((weight, hour) => ({
    hour,
    steps:
      hour <= now.getHours()
        ? Math.round(((todayTarget * weight) / totalWeight) * (0.8 + random() * 0.4))
        : 0,
  }));

  month.push(toHealthData(hourly.reduce((sum, h) => sum + h.steps, 0), today));

  return { hourly, month };
};
