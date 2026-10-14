# Statistics Screen UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Meet all acceptance criteria of ticket #65 (Statistics screen UI) using Apple Health data with Day / Week / Month views.

**Architecture:**
- **Pure logic, unit-tested:** stats maths (`utils/healthStats.ts`), chart sizing (`components/Statistics/chartLayout.ts`), mock data (`utils/mockHealthData.ts`).
- **Data:** `healthKitService` gains batched hourly and daily queries. `useHealthData` exposes a `status` state machine plus derived summaries.
- **UI:** small themed components, composed by `StatisticsScreen` inside a pull-to-refresh `ScreenContainer`.

**Tech Stack:** Expo SDK 57, React Native 0.86, React Native Paper 5 (Ionicons icon set), react-native-gifted-charts 1.4, react-native-health, Jest (jest-expo) with React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-13-statistics-screen-design.md`

## Global Constraints

- **Daily step goal:** `DAILY_STEP_GOAL = 10000`. **Active day:** `ACTIVE_DAY_STEPS = 5000` steps or more.
- **Mock mode:** on unless `EXPO_PUBLIC_USE_MOCK_HEALTH === "false"`.
- **Colours:** only from `useTheme()` or `@/theme/colors`. No new hard-coded hex values.
- **Text:** `CustomText` (Paper `Text` variants). **Icons:** Ionicons names via Paper `Icon`.
- **Sizing:** no fixed chart widths. Charts get `width` from `ChartCard`'s `onLayout`.
- **Units:** distance in metres, calories in kcal.
- **Commits:** none unless the user asks. Each task ends with a verification step instead of a commit.
- **Commands:** run from `frontend/`.

---

### Task 1: Stats utilities

**Files:**
- Create: `frontend/utils/healthStats.ts`
- Modify: `frontend/utils/healthFormatters.ts` (add `formatCompactNumber`; `formatLastUpdated` returns lowercase `"just now"`)
- Test: `frontend/utils/__test__/healthStats.test.ts`, `frontend/utils/__test__/healthFormatters.test.ts`

**Interfaces:**
- Consumes: `HealthData` from `@/services/healthKitService` (`{ steps: number; distance: number; calories: number; date: Date }`)
- Produces:
  - `DAILY_STEP_GOAL`, `ACTIVE_DAY_STEPS`
  - `interface HealthSummary { totalSteps; totalDistance; totalCalories; averageSteps; averageDistance; averageCalories; activeDays; dayCount: number; bestDay: HealthData }`
  - `interface HealthTrends { steps: number | null; distance: number | null; calories: number | null }`
  - `summarize(days): HealthSummary | null`
  - `percentChange(current, previous): number | null`
  - `compareDays(today, yesterday): HealthTrends`
  - `currentStreak(days, threshold?): number`
  - `hasAnyActivity(days): boolean`
  - `formatCompactNumber(value): string`

- [ ] **Step 1: Write the failing tests**

`frontend/utils/__test__/healthStats.test.ts`:
```ts
import {
  compareDays,
  currentStreak,
  hasAnyActivity,
  percentChange,
  summarize,
} from "../healthStats";
import type { HealthData } from "@/services/healthKitService";

const day = (steps: number, distance = steps * 0.75, calories = steps * 0.04): HealthData => ({
  steps,
  distance,
  calories,
  date: new Date(2026, 9, 1),
});

describe("summarize", () => {
  it("returns null when there are no days", () => {
    expect(summarize([])).toBeNull();
  });

  it("calculates totals, averages, active days and the best day", () => {
    const days = [day(4000, 3000, 160), day(8000, 6000, 320), day(6000, 4500, 240)];

    const summary = summarize(days)!;

    expect(summary.totalSteps).toBe(18000);
    expect(summary.totalDistance).toBe(13500);
    expect(summary.totalCalories).toBe(720);
    expect(summary.averageSteps).toBe(6000);
    expect(summary.averageDistance).toBe(4500);
    expect(summary.averageCalories).toBe(240);
    expect(summary.activeDays).toBe(2);
    expect(summary.dayCount).toBe(3);
    expect(summary.bestDay).toBe(days[1]);
  });
});

describe("percentChange", () => {
  it("returns a rounded percentage increase", () => {
    expect(percentChange(150, 100)).toBe(50);
  });

  it("returns a negative percentage for a decrease", () => {
    expect(percentChange(75, 100)).toBe(-25);
  });

  it("returns null when there is no baseline", () => {
    expect(percentChange(500, 0)).toBeNull();
  });
});

describe("compareDays", () => {
  it("returns null trends when a day is missing", () => {
    expect(compareDays(day(1000), null)).toEqual({ steps: null, distance: null, calories: null });
  });

  it("compares each metric against yesterday", () => {
    expect(compareDays(day(12000, 9000, 500), day(8000, 6000, 0))).toEqual({
      steps: 50,
      distance: 50,
      calories: null,
    });
  });
});

describe("currentStreak", () => {
  it("counts consecutive active days ending today", () => {
    expect(currentStreak([day(6000), day(7000), day(5000)])).toBe(3);
  });

  it("stops at the first inactive day", () => {
    expect(currentStreak([day(6000), day(1000), day(6000), day(6000)])).toBe(2);
  });

  it("does not let an unfinished today break the streak", () => {
    expect(currentStreak([day(6000), day(6000), day(200)])).toBe(2);
  });

  it("returns 0 when yesterday was inactive too", () => {
    expect(currentStreak([day(6000), day(200), day(200)])).toBe(0);
  });

  it("returns 0 for no days", () => {
    expect(currentStreak([])).toBe(0);
  });
});

describe("hasAnyActivity", () => {
  it("is false when every metric is zero", () => {
    expect(hasAnyActivity([day(0, 0, 0), day(0, 0, 0)])).toBe(false);
  });

  it("is true when any metric is recorded", () => {
    expect(hasAnyActivity([day(0, 0, 0), day(0, 0, 12)])).toBe(true);
  });
});
```

`frontend/utils/__test__/healthFormatters.test.ts`:
```ts
import { formatCompactNumber, formatLastUpdated } from "../healthFormatters";

describe("formatCompactNumber", () => {
  it("keeps small numbers as whole numbers", () => {
    expect(formatCompactNumber(950)).toBe("950");
  });

  it("shows thousands with a k suffix", () => {
    expect(formatCompactNumber(10000)).toBe("10k");
    expect(formatCompactNumber(12400)).toBe("12.4k");
  });
});

describe("formatLastUpdated", () => {
  it("says just now for recent updates", () => {
    expect(formatLastUpdated(new Date())).toBe("just now");
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx jest utils/__test__/healthStats.test.ts utils/__test__/healthFormatters.test.ts`
Expected: FAIL. `Cannot find module '../healthStats'`, and `formatCompactNumber is not a function`.

- [ ] **Step 3: Implement**

`frontend/utils/healthStats.ts`:
```ts
import type { HealthData } from "@/services/healthKitService";

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
```

In `frontend/utils/healthFormatters.ts`, change `if (diffMins < 1) return 'Just now';` to `if (diffMins < 1) return 'just now';`. Then append:
```ts
/**
 * Compact number for chart axes: 950 → "950", 12400 → "12.4k"
 */
export const formatCompactNumber = (value: number): string => {
  if (value < 1000) return `${Math.round(value)}`;
  const thousands = value / 1000;
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
};
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx jest utils/__test__/healthStats.test.ts utils/__test__/healthFormatters.test.ts`
Expected: PASS (17 tests).

---

### Task 2: Chart layout helpers

**Files:**
- Create: `frontend/components/Statistics/chartLayout.ts`
- Test: `frontend/components/Statistics/__test__/chartLayout.test.ts`

**Interfaces:**
- Produces:
  - Constants: `Y_AXIS_WIDTH = 36`, `CHART_SECTIONS = 4`
  - `fitBars(containerWidth, count, barRatio = 0.6): BarLayout` where `BarLayout = { chartWidth; barWidth; spacing; initialSpacing }`
  - `fitLine(containerWidth, count, inset = 8): LineLayout` where `LineLayout = { chartWidth; spacing; initialSpacing }`
  - `barCenter(layout: BarLayout, index): number`
  - `pointX(layout: LineLayout, index): number`
  - `niceMax(values: number[], minimum = 0): number`

- [ ] **Step 1: Write the failing test**

`frontend/components/Statistics/__test__/chartLayout.test.ts`:
```ts
import {
  barCenter,
  CHART_SECTIONS,
  fitBars,
  fitLine,
  niceMax,
  pointX,
} from "../chartLayout";

// Card content widths: iPhone SE, iPhone 15, iPad
const WIDTHS = [256, 326, 960];

describe("fitBars", () => {
  it.each(WIDTHS)("fits 24 and 7 bars into a %ipx container", (width) => {
    for (const count of [24, 7]) {
      const layout = fitBars(width, count);
      const used =
        layout.initialSpacing * 2 + count * layout.barWidth + (count - 1) * layout.spacing;

      expect(used).toBeLessThanOrEqual(layout.chartWidth + 0.001);
      expect(layout.barWidth).toBeGreaterThan(2);
      expect(layout.spacing).toBeGreaterThan(0);
    }
  });

  it("places bar centres inside the chart", () => {
    const layout = fitBars(326, 24);
    expect(barCenter(layout, 0)).toBeGreaterThan(0);
    expect(barCenter(layout, 23)).toBeLessThan(layout.chartWidth);
  });
});

describe("fitLine", () => {
  it.each(WIDTHS)("spreads 30 points across a %ipx container", (width) => {
    const layout = fitLine(width, 30);

    expect(pointX(layout, 0)).toBe(layout.initialSpacing);
    expect(pointX(layout, 29) + layout.initialSpacing).toBeCloseTo(layout.chartWidth);
  });
});

describe("niceMax", () => {
  it("rounds up to a value that splits into readable sections", () => {
    expect(niceMax([12000])).toBe(12000);
    expect(niceMax([13284])).toBe(16000);
    expect(niceMax([1800])).toBe(2000);
  });

  it("respects the minimum so the goal line stays visible", () => {
    expect(niceMax([800], 11000)).toBe(12000);
  });

  it("never returns 0 for empty or all-zero data", () => {
    expect(niceMax([])).toBeGreaterThan(0);
    expect(niceMax([0, 0])).toBeGreaterThan(0);
  });

  it("is always at least the largest value and divisible into sections", () => {
    for (const value of [37, 640, 2999, 8123, 15555, 48000]) {
      const max = niceMax([value]);
      expect(max).toBeGreaterThanOrEqual(value);
      expect(Number.isInteger(max / CHART_SECTIONS)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest components/Statistics/__test__/chartLayout.test.ts`
Expected: FAIL. `Cannot find module '../chartLayout'`.

- [ ] **Step 3: Implement**

`frontend/components/Statistics/chartLayout.ts`:
```ts
/** Width reserved for y-axis labels; pass it to the charts as yAxisLabelWidth */
export const Y_AXIS_WIDTH = 36;
export const CHART_SECTIONS = 4;

// gifted-charts draws a little past the last bar/point
const CHART_END_PADDING = 8;

// Section sizes that give round axis labels (1k, 2.5k, 4k ...)
const NICE_STEPS = [
  25, 50, 100, 250, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000,
  25000, 50000,
];

export interface BarLayout {
  chartWidth: number;
  barWidth: number;
  spacing: number;
  initialSpacing: number;
}

export interface LineLayout {
  chartWidth: number;
  spacing: number;
  initialSpacing: number;
}

const plotWidth = (containerWidth: number) =>
  Math.max(containerWidth - Y_AXIS_WIDTH - CHART_END_PADDING, 0);

/** Fits `count` bars into the container: bars take `barRatio` of each slot, gaps the rest */
export const fitBars = (containerWidth: number, count: number, barRatio = 0.6): BarLayout => {
  const chartWidth = plotWidth(containerWidth);
  const slot = count > 0 ? chartWidth / count : 0;
  const barWidth = Math.max(slot * barRatio, 2);
  const spacing = Math.max(slot - barWidth, 1);

  // Half a gap at each end, so initial + bars + gaps + end equals chartWidth
  return { chartWidth, barWidth, spacing, initialSpacing: spacing / 2 };
};

/** Spreads `count` points across the container with an inset at both ends */
export const fitLine = (containerWidth: number, count: number, inset = 8): LineLayout => {
  const chartWidth = plotWidth(containerWidth);
  const spacing = count > 1 ? (chartWidth - inset * 2) / (count - 1) : 0;

  return { chartWidth, spacing: Math.max(spacing, 0), initialSpacing: inset };
};

export const barCenter = (layout: BarLayout, index: number) =>
  layout.initialSpacing + index * (layout.barWidth + layout.spacing) + layout.barWidth / 2;

export const pointX = (layout: LineLayout, index: number) =>
  layout.initialSpacing + index * layout.spacing;

/** Rounds the chart's top value up so it splits into CHART_SECTIONS round labels */
export const niceMax = (values: number[], minimum = 0): number => {
  const max = Math.max(minimum, 1, ...values);
  const rawStep = max / CHART_SECTIONS;
  const step =
    NICE_STEPS.find((candidate) => candidate >= rawStep) ?? Math.ceil(rawStep / 50000) * 50000;

  return step * CHART_SECTIONS;
};
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest components/Statistics/__test__/chartLayout.test.ts`
Expected: PASS.

---

### Task 3: Deterministic mock health data

**Files:**
- Create: `frontend/utils/mockHealthData.ts`
- Test: `frontend/utils/__test__/mockHealthData.test.ts`

**Interfaces:**
- Consumes: `HealthData` and `HourlySteps` types from `@/services/healthKitService` (`HourlySteps` is added in Task 4; it's a type-only import, so it's safe to write first)
- Produces:
  - `interface HealthSnapshot { hourly: HourlySteps[]; month: HealthData[] }`
  - `generateMockHealth(now?: Date, days = 30): HealthSnapshot`

- [ ] **Step 1: Write the failing test**

`frontend/utils/__test__/mockHealthData.test.ts`:
```ts
import { generateMockHealth } from "../mockHealthData";

const NOW = new Date(2026, 9, 13, 15, 30);

describe("generateMockHealth", () => {
  it("returns 30 days, oldest first, ending today", () => {
    const { month } = generateMockHealth(NOW);

    expect(month).toHaveLength(30);
    expect(month[29].date).toEqual(new Date(2026, 9, 13));
    expect(month[0].date).toEqual(new Date(2026, 8, 14));
    for (let i = 1; i < month.length; i++) {
      expect(month[i].date.getTime()).toBeGreaterThan(month[i - 1].date.getTime());
    }
  });

  it("returns 24 hourly buckets with no steps after the current hour", () => {
    const { hourly } = generateMockHealth(NOW);

    expect(hourly).toHaveLength(24);
    expect(hourly.map((h) => h.hour)).toEqual(Array.from({ length: 24 }, (_, i) => i));
    expect(hourly.slice(16).every((h) => h.steps === 0)).toBe(true);
    expect(hourly.slice(7, 16).some((h) => h.steps > 0)).toBe(true);
  });

  it("makes today's total equal the sum of the hourly buckets", () => {
    const { hourly, month } = generateMockHealth(NOW);
    const hourlyTotal = hourly.reduce((sum, h) => sum + h.steps, 0);

    expect(month[29].steps).toBe(hourlyTotal);
  });

  it("derives distance and calories from steps", () => {
    const { month } = generateMockHealth(NOW);

    for (const day of month) {
      expect(day.distance).toBe(Math.round(day.steps * 0.75));
      expect(day.calories).toBe(Math.round(day.steps * 0.04));
    }
  });

  it("is stable for the same moment", () => {
    expect(generateMockHealth(NOW)).toEqual(generateMockHealth(NOW));
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest utils/__test__/mockHealthData.test.ts`
Expected: FAIL. `Cannot find module '../mockHealthData'`.

- [ ] **Step 3: Implement**

`frontend/utils/mockHealthData.ts`:
```ts
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest utils/__test__/mockHealthData.test.ts`
Expected: PASS (5 tests).

---

### Task 4: HealthKit hourly and daily queries

**Files:**
- Modify (rewrite): `frontend/services/healthKitService.ts`
- Test: `frontend/services/__test__/healthKitService.test.ts`

**Interfaces:**
- Produces:
  - `interface HealthData` (unchanged) and `interface HourlySteps { hour: number; steps: number }`
  - `HealthKitError` and `HealthKitErrorCode` (unchanged)
  - `parseHealthDate(value: string): Date`
  - `class HealthKitService` with:
    - `isAvailable(): Promise<boolean>`
    - `requestPermissions(): Promise<boolean>`
    - `getHourlySteps(now?: Date): Promise<HourlySteps[]>`
    - `getDailyStats(days: number, now?: Date): Promise<HealthData[]>`
  - Singleton `healthKitService`
- Removed: `getTodayStats`, `getWeekStats`, `getMonthStats`, `getStatsForDays`. Their only caller is `useHealthData`, which Task 5 rewrites.

- [ ] **Step 1: Write the failing test**

`frontend/services/__test__/healthKitService.test.ts`:
```ts
/* eslint-disable import/first */
jest.mock("react-native-health", () => ({
  initHealthKit: jest.fn(),
  getDailyStepCountSamples: jest.fn(),
  getDailyDistanceWalkingRunningSamples: jest.fn(),
  getActiveEnergyBurned: jest.fn(),
  Constants: {
    Permissions: {
      StepCount: "StepCount",
      DistanceWalkingRunning: "DistanceWalkingRunning",
      ActiveEnergyBurned: "ActiveEnergyBurned",
    },
  },
}));

import AppleHealthKit from "react-native-health";
import {
  HealthKitError,
  HealthKitErrorCode,
  HealthKitService,
  parseHealthDate,
} from "../healthKitService";

const mockedKit = AppleHealthKit as unknown as Record<string, jest.Mock>;

// Format a local date the way HealthKit does: 2026-10-13T08:00:00.000+0200
const toHealthKitString = (date: Date) => {
  const pad = (n: number) => `${Math.abs(n)}`.padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:00.000` +
    `${sign}${pad(Math.trunc(offset / 60))}${pad(offset % 60)}`
  );
};

const sample = (date: Date, value: number) => ({ startDate: toHealthKitString(date), value });

const respondWith = (method: string, results: unknown[]) =>
  mockedKit[method].mockImplementation((_options: unknown, callback: Function) =>
    callback(null, results),
  );

const NOW = new Date(2026, 9, 13, 15, 30);

describe("HealthKitService", () => {
  let service: HealthKitService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockedKit.initHealthKit.mockImplementation((_p: unknown, callback: Function) => callback(""));
    service = new HealthKitService();
    await service.requestPermissions();
  });

  it("parses HealthKit dates with compact offsets", () => {
    const date = new Date(2026, 9, 13, 8);
    expect(parseHealthDate(toHealthKitString(date)).getTime()).toBe(date.getTime());
  });

  it("is available on iOS when the native module exists", async () => {
    await expect(service.isAvailable()).resolves.toBe(true);
  });

  it("reports denied permissions", async () => {
    mockedKit.initHealthKit.mockImplementation((_p: unknown, callback: Function) =>
      callback("Authorization denied"),
    );
    await expect(new HealthKitService().requestPermissions()).resolves.toBe(false);
  });

  it("throws before permissions are requested", async () => {
    await expect(new HealthKitService().getHourlySteps(NOW)).rejects.toMatchObject({
      code: HealthKitErrorCode.NOT_INITIALIZED,
    });
  });

  it("buckets today's step samples into 24 hours", async () => {
    respondWith("getDailyStepCountSamples", [
      sample(new Date(2026, 9, 13, 8), 1200),
      sample(new Date(2026, 9, 13, 12), 900.6),
      sample(new Date(2026, 9, 12, 23), 400), // yesterday, ignored
    ]);

    const hourly = await service.getHourlySteps(NOW);

    expect(hourly).toHaveLength(24);
    expect(hourly[8]).toEqual({ hour: 8, steps: 1200 });
    expect(hourly[12]).toEqual({ hour: 12, steps: 901 });
    expect(hourly[23].steps).toBe(0);
    expect(mockedKit.getDailyStepCountSamples).toHaveBeenCalledWith(
      expect.objectContaining({ period: 60 }),
      expect.any(Function),
    );
  });

  it("returns zero-filled daily totals, oldest first", async () => {
    respondWith("getDailyStepCountSamples", [
      sample(new Date(2026, 9, 13), 8000),
      sample(new Date(2026, 9, 11), 5000),
    ]);
    respondWith("getDailyDistanceWalkingRunningSamples", [sample(new Date(2026, 9, 13), 6100.4)]);
    respondWith("getActiveEnergyBurned", [sample(new Date(2026, 9, 13), 320.2)]);

    const days = await service.getDailyStats(3, NOW);

    expect(days.map((d) => d.date)).toEqual([
      new Date(2026, 9, 11),
      new Date(2026, 9, 12),
      new Date(2026, 9, 13),
    ]);
    expect(days[0]).toMatchObject({ steps: 5000, distance: 0, calories: 0 });
    expect(days[1]).toMatchObject({ steps: 0, distance: 0, calories: 0 });
    expect(days[2]).toMatchObject({ steps: 8000, distance: 6100, calories: 320 });
    expect(mockedKit.getDailyStepCountSamples).toHaveBeenCalledWith(
      expect.objectContaining({ period: 1440 }),
      expect.any(Function),
    );
  });

  it("rejects with FETCH_FAILED when a query fails", async () => {
    mockedKit.getDailyStepCountSamples.mockImplementation((_o: unknown, callback: Function) =>
      callback(new Error("boom"), []),
    );

    const result = service.getHourlySteps(NOW);

    await expect(result).rejects.toBeInstanceOf(HealthKitError);
    await expect(result).rejects.toMatchObject({ code: HealthKitErrorCode.FETCH_FAILED });
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest services/__test__/healthKitService.test.ts`
Expected: FAIL. Neither `HealthKitService` nor `parseHealthDate` is exported.

- [ ] **Step 3: Implement**

Replace `frontend/services/healthKitService.ts` with:
```ts
import { Platform } from "react-native";
// @ts-ignore - react-native-health's typings don't cover this import style
import AppleHealthKit, { HealthKitPermissions } from "react-native-health";

export interface HealthData {
  steps: number;
  distance: number; // in meters
  calories: number; // in kcal
  date: Date;
}

export interface HourlySteps {
  hour: number; // 0-23
  steps: number;
}

export enum HealthKitErrorCode {
  NOT_AVAILABLE = "HEALTHKIT_NOT_AVAILABLE",
  NOT_INITIALIZED = "HEALTHKIT_NOT_INITIALIZED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  FETCH_FAILED = "FETCH_FAILED",
  INVALID_DATE_RANGE = "INVALID_DATE_RANGE",
}

export class HealthKitError extends Error {
  constructor(
    public code: HealthKitErrorCode,
    message: string,
    public originalError?: Error,
  ) {
    super(message);
    this.name = "HealthKitError";
  }
}

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

// HealthKit returns offsets like "+0200"; make them "+02:00" so every JS engine parses them
export const parseHealthDate = (value: string): Date =>
  new Date(value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2"));

const startOfDay = (date: Date) => {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export class HealthKitService {
  private isInitialized = false;

  /** HealthKit only exists in iOS builds that include the native module (not Expo Go or web) */
  async isAvailable(): Promise<boolean> {
    return Platform.OS === "ios" && typeof AppleHealthKit?.initHealthKit === "function";
  }

  /**
   * Request permissions to access health data
   * @returns true if HealthKit initialised. iOS never reveals denied read access.
   */
  async requestPermissions(): Promise<boolean> {
    if (!(await this.isAvailable())) {
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error("[HealthKit] Permission error:", error);
        }
        this.isInitialized = !error;
        resolve(!error);
      });
    });
  }

  /**
   * Today's steps in 24 hourly buckets; hours without data are 0
   */
  async getHourlySteps(now: Date = new Date()): Promise<HourlySteps[]> {
    this.ensureInitialized();

    const samples = await this.querySamples(
      AppleHealthKit.getDailyStepCountSamples,
      startOfDay(now),
      now,
      MINUTES_PER_HOUR,
    );

    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, steps: 0 }));
    for (const sample of samples) {
      const date = parseHealthDate(sample.startDate);
      if (dayKey(date) === dayKey(now)) {
        hourly[date.getHours()].steps += Math.round(sample.value);
      }
    }

    return hourly;
  }

  /**
   * Daily totals for the last `days` days including today, oldest first
   */
  async getDailyStats(days: number, now: Date = new Date()): Promise<HealthData[]> {
    this.ensureInitialized();

    if (days <= 0) {
      throw new HealthKitError(
        HealthKitErrorCode.INVALID_DATE_RANGE,
        "Number of days must be positive",
      );
    }

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

    const result: HealthData[] = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return { steps: 0, distance: 0, calories: 0, date };
    });
    const byDay = new Map(result.map((day) => [dayKey(day.date), day]));

    const addSamples = (samples: HealthSample[], key: "steps" | "distance" | "calories") => {
      for (const sample of samples) {
        const day = byDay.get(dayKey(parseHealthDate(sample.startDate)));
        if (day) day[key] += Math.round(sample.value);
      }
    };
    addSamples(steps, "steps");
    addSamples(distance, "distance");
    addSamples(calories, "calories");

    return result;
  }

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
              new HealthKitError(
                HealthKitErrorCode.FETCH_FAILED,
                "Failed to read Apple Health data",
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
      throw new HealthKitError(
        HealthKitErrorCode.NOT_INITIALIZED,
        "HealthKit not initialized. Call requestPermissions() first.",
      );
    }
  }
}

export const healthKitService = new HealthKitService();
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest services/__test__/healthKitService.test.ts`
Expected: PASS (7 tests). `useHealthData.ts` won't typecheck until Task 5; that's expected.

---

### Task 5: `useHealthData` status machine

**Files:**
- Modify (rewrite): `frontend/hooks/useHealthData.ts`
- Test: `frontend/hooks/__test__/useHealthData.test.ts`

**Interfaces:**
- Consumes:
  - `healthKitService` (Task 4)
  - `generateMockHealth` and `HealthSnapshot` (Task 3)
  - `summarize`, `compareDays`, `currentStreak`, `HealthSummary`, `HealthTrends` (Task 1)
- Produces:
  - `type HealthStatus = "loading" | "ready" | "unavailable" | "denied" | "error"`
  - `interface UseHealthDataReturn { status; error: Error | null; today: HealthData | null; yesterday: HealthData | null; hourly: HourlySteps[]; week: HealthData[]; month: HealthData[]; weekSummary: HealthSummary | null; monthSummary: HealthSummary | null; trends: HealthTrends; streak: number; refreshing: boolean; lastUpdated: Date | null; refresh: () => Promise<void> }`
  - `useHealthData(): UseHealthDataReturn`

- [ ] **Step 1: Write the failing test**

`frontend/hooks/__test__/useHealthData.test.ts`:
```ts
/* eslint-disable import/first */
jest.mock("@/services/healthKitService", () => ({
  healthKitService: {
    isAvailable: jest.fn(),
    requestPermissions: jest.fn(),
    getHourlySteps: jest.fn(),
    getDailyStats: jest.fn(),
  },
}));

import { act, renderHook, waitFor } from "@testing-library/react-native";
import { healthKitService } from "@/services/healthKitService";
import { useHealthData } from "../useHealthData";

const kit = healthKitService as jest.Mocked<typeof healthKitService>;

const days = (stepsList: number[]) =>
  stepsList.map((steps, index) => ({
    steps,
    distance: steps * 0.75,
    calories: steps * 0.04,
    date: new Date(2026, 9, index + 1),
  }));

const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour === 9 ? 500 : 0 }));

describe("useHealthData", () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCK_HEALTH;

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCK_HEALTH = originalEnv;
    jest.clearAllMocks();
  });

  describe("mock mode (default)", () => {
    beforeEach(() => {
      delete process.env.EXPO_PUBLIC_USE_MOCK_HEALTH;
    });

    it("becomes ready with generated data and never touches HealthKit", async () => {
      const { result } = renderHook(() => useHealthData());

      await waitFor(() => expect(result.current.status).toBe("ready"));

      expect(result.current.month).toHaveLength(30);
      expect(result.current.week).toHaveLength(7);
      expect(result.current.hourly).toHaveLength(24);
      expect(result.current.lastUpdated).toBeInstanceOf(Date);
      expect(kit.isAvailable).not.toHaveBeenCalled();
    });
  });

  describe("Apple Health mode", () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_USE_MOCK_HEALTH = "false";
      kit.isAvailable.mockResolvedValue(true);
      kit.requestPermissions.mockResolvedValue(true);
      kit.getHourlySteps.mockResolvedValue(hourly);
      kit.getDailyStats.mockResolvedValue(days([...Array(28).fill(6000), 8000, 12000]));
    });

    it("is unavailable when HealthKit is missing", async () => {
      kit.isAvailable.mockResolvedValue(false);
      const { result } = renderHook(() => useHealthData());

      await waitFor(() => expect(result.current.status).toBe("unavailable"));
    });

    it("is denied when HealthKit initialisation fails", async () => {
      kit.requestPermissions.mockResolvedValue(false);
      const { result } = renderHook(() => useHealthData());

      await waitFor(() => expect(result.current.status).toBe("denied"));
    });

    it("derives today, week, summaries, trends and streak", async () => {
      const { result } = renderHook(() => useHealthData());

      await waitFor(() => expect(result.current.status).toBe("ready"));

      expect(kit.getDailyStats).toHaveBeenCalledWith(30);
      expect(result.current.today?.steps).toBe(12000);
      expect(result.current.yesterday?.steps).toBe(8000);
      expect(result.current.week).toHaveLength(7);
      expect(result.current.weekSummary?.totalSteps).toBe(5 * 6000 + 8000 + 12000);
      expect(result.current.trends.steps).toBe(50);
      expect(result.current.streak).toBe(30);
    });

    it("shows the error state when the first load fails", async () => {
      kit.getDailyStats.mockRejectedValue(new Error("boom"));
      const { result } = renderHook(() => useHealthData());

      await waitFor(() => expect(result.current.status).toBe("error"));
      expect(result.current.error?.message).toBe("boom");
    });

    it("keeps the last data when a refresh fails", async () => {
      const { result } = renderHook(() => useHealthData());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      kit.getDailyStats.mockRejectedValue(new Error("offline"));
      await act(() => result.current.refresh());

      expect(result.current.status).toBe("ready");
      expect(result.current.error?.message).toBe("offline");
      expect(result.current.today?.steps).toBe(12000);
      expect(result.current.refreshing).toBe(false);
    });

    it("requests permission only once across refreshes", async () => {
      const { result } = renderHook(() => useHealthData());
      await waitFor(() => expect(result.current.status).toBe("ready"));

      await act(() => result.current.refresh());

      expect(kit.requestPermissions).toHaveBeenCalledTimes(1);
      expect(kit.getDailyStats).toHaveBeenCalledTimes(2);
    });
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest hooks/__test__/useHealthData.test.ts`
Expected: FAIL. The old hook has no `status` and calls the removed service methods.

- [ ] **Step 3: Implement**

Replace `frontend/hooks/useHealthData.ts` with:
```ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { healthKitService, HealthData, HourlySteps } from "@/services/healthKitService";
import { generateMockHealth, HealthSnapshot } from "@/utils/mockHealthData";
import {
  compareDays,
  currentStreak,
  HealthSummary,
  HealthTrends,
  summarize,
} from "@/utils/healthStats";

export type HealthStatus = "loading" | "ready" | "unavailable" | "denied" | "error";

export interface UseHealthDataReturn {
  status: HealthStatus;
  error: Error | null;
  today: HealthData | null;
  yesterday: HealthData | null;
  hourly: HourlySteps[];
  week: HealthData[];
  month: HealthData[];
  weekSummary: HealthSummary | null;
  monthSummary: HealthSummary | null;
  trends: HealthTrends;
  streak: number;
  refreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

const MONTH_DAYS = 30;
const WEEK_DAYS = 7;

// Mock data is the default so the screen works in Expo Go;
// set EXPO_PUBLIC_USE_MOCK_HEALTH=false to read Apple Health in a dev build
const isMockMode = () => process.env.EXPO_PUBLIC_USE_MOCK_HEALTH !== "false";

class HealthAccessError extends Error {
  constructor(public status: "unavailable" | "denied") {
    super(`Health data ${status}`);
  }
}

export const useHealthData = (): UseHealthDataReturn => {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasPermission = useRef(false);
  const hasData = useRef(false);

  const loadSnapshot = useCallback(async (): Promise<HealthSnapshot> => {
    if (isMockMode()) {
      return generateMockHealth();
    }

    if (!(await healthKitService.isAvailable())) {
      throw new HealthAccessError("unavailable");
    }

    if (!hasPermission.current) {
      if (!(await healthKitService.requestPermissions())) {
        throw new HealthAccessError("denied");
      }
      hasPermission.current = true;
    }

    const [hourly, month] = await Promise.all([
      healthKitService.getHourlySteps(),
      healthKitService.getDailyStats(MONTH_DAYS),
    ]);

    return { hourly, month };
  }, []);

  const applySnapshot = useCallback((next: HealthSnapshot) => {
    hasData.current = true;
    setSnapshot(next);
    setError(null);
    setStatus("ready");
    setLastUpdated(new Date());
  }, []);

  const applyError = useCallback((err: unknown) => {
    if (err instanceof HealthAccessError) {
      setStatus(err.status);
      return;
    }

    console.error("[useHealthData] Error:", err);
    setError(err as Error);
    // Keep showing the last good data when a refresh fails
    if (!hasData.current) {
      setStatus("error");
    }
  }, []);

  // State is only updated in the promise callbacks, after the data has loaded
  const load = useCallback(
    () => loadSnapshot().then(applySnapshot, applyError),
    [loadSnapshot, applySnapshot, applyError],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const derived = useMemo(() => {
    const month = snapshot?.month ?? [];
    const week = month.slice(-WEEK_DAYS);
    const today = month[month.length - 1] ?? null;
    const yesterday = month[month.length - 2] ?? null;

    return {
      hourly: snapshot?.hourly ?? [],
      month,
      week,
      today,
      yesterday,
      weekSummary: summarize(week),
      monthSummary: summarize(month),
      trends: compareDays(today, yesterday),
      streak: currentStreak(month),
    };
  }, [snapshot]);

  return { status, error, refreshing, lastUpdated, refresh, ...derived };
};
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest hooks/__test__/useHealthData.test.ts`
Expected: PASS (7 tests).

If the Apple Health mode tests see mock data, Babel has inlined `process.env.EXPO_PUBLIC_USE_MOCK_HEALTH` at transform time. In that case, read the variable through `const env = process.env;` and `env.EXPO_PUBLIC_USE_MOCK_HEALTH` inside `isMockMode`, then re-run.

---

### Task 6: Pull-to-refresh container and card components

**Files:**
- Modify: `frontend/components/ScreenContainer.tsx` (add `refreshControl`, wire up `contentContainerStyle`)
- Create:
  - `frontend/components/Statistics/TrendChip.tsx`
  - `frontend/components/Statistics/MetricCard.tsx`
  - `frontend/components/Statistics/TodayCard.tsx`
  - `frontend/components/Statistics/InsightsRow.tsx`
  - `frontend/components/Statistics/ChartCard.tsx`
- Modify (rewrite): `frontend/components/Statistics/StatisticsHeader.tsx`
- Create test helper: `frontend/components/Statistics/__test__/renderWithTheme.tsx`
- Test: `frontend/components/Statistics/__test__/StatisticsCards.test.tsx`

**Interfaces:**
- Consumes:
  - `HealthSummary` (Task 1)
  - `formatSteps`, `formatCompactNumber`, `calculateProgress`, `formatLastUpdated` from `@/utils/healthFormatters`
- Produces:
  - `ScreenContainer` props: `refreshControl?: React.ReactElement<RefreshControlProps>`, `contentContainerStyle?: StyleProp<ViewStyle>`
  - `TrendChip({ value: number | null; label?: string })`
  - `MetricCard({ icon: string; label: string; value: string; trend: number | null })`
  - `TodayCard({ steps: number; goal: number; trend: number | null })`
  - `InsightsRow({ summary: HealthSummary; streak: number; bestDayLabel: (date: Date) => string })`
  - `ChartCard({ title: string; subtitle?: string; isEmpty: boolean; emptyMessage: string; footer?: ReactNode; children: (width: number) => ReactNode })`. Its chart area has `testID="chart-area"`.
  - `StatisticsHeader({ lastUpdated: Date | null })`
  - `renderWithTheme(ui)`: render inside SafeAreaProvider and PaperProvider (light theme, Ionicons)

- [ ] **Step 1: Write the test helper and failing tests**

`frontend/components/Statistics/__test__/renderWithTheme.tsx`:
```tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "@/theme/paperTheme";

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export const renderWithTheme = (ui: React.ReactElement) =>
  render(
    <SafeAreaProvider initialMetrics={metrics}>
      <PaperProvider theme={lightTheme} settings={{ icon: (props) => <Ionicons {...(props as any)} /> }}>
        {ui}
      </PaperProvider>
    </SafeAreaProvider>,
  );
```

`frontend/components/Statistics/__test__/StatisticsCards.test.tsx`:
```tsx
import React from "react";
import { Text } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithTheme } from "./renderWithTheme";
import { TrendChip } from "../TrendChip";
import { TodayCard } from "../TodayCard";
import { InsightsRow } from "../InsightsRow";
import { ChartCard } from "../ChartCard";
import { StatisticsHeader } from "../StatisticsHeader";
import type { HealthSummary } from "@/utils/healthStats";

describe("TrendChip", () => {
  it("shows a positive trend with a plus sign", () => {
    const { getByText } = renderWithTheme(<TrendChip value={12} />);
    expect(getByText("+12% vs yesterday")).toBeTruthy();
  });

  it("shows a negative trend", () => {
    const { getByText } = renderWithTheme(<TrendChip value={-8} />);
    expect(getByText("-8% vs yesterday")).toBeTruthy();
  });

  it("renders nothing without a baseline", () => {
    const { queryByText } = renderWithTheme(<TrendChip value={null} />);
    expect(queryByText(/vs yesterday/)).toBeNull();
  });
});

describe("TodayCard", () => {
  it("shows steps and progress toward the goal", () => {
    const { getByText } = renderWithTheme(<TodayCard steps={4500} goal={10000} trend={null} />);
    expect(getByText("4,500")).toBeTruthy();
    expect(getByText("45% of your daily goal")).toBeTruthy();
  });

  it("celebrates when the goal is reached", () => {
    const { getByText } = renderWithTheme(<TodayCard steps={12847} goal={10000} trend={56} />);
    expect(getByText("Daily goal reached 🎉")).toBeTruthy();
    expect(getByText("+56% vs yesterday")).toBeTruthy();
  });
});

describe("InsightsRow", () => {
  const summary: HealthSummary = {
    totalSteps: 63000,
    totalDistance: 47250,
    totalCalories: 2520,
    averageSteps: 9000,
    averageDistance: 6750,
    averageCalories: 360,
    activeDays: 6,
    dayCount: 7,
    bestDay: { steps: 13284, distance: 9963, calories: 531, date: new Date(2026, 9, 11) },
  };

  it("shows average, best day, active days and streak", () => {
    const { getByText } = renderWithTheme(
      <InsightsRow summary={summary} streak={1} bestDayLabel={() => "Sun"} />,
    );
    expect(getByText("9,000 steps")).toBeTruthy();
    expect(getByText("Sun · 13.3k")).toBeTruthy();
    expect(getByText("6 of 7")).toBeTruthy();
    expect(getByText("1 day")).toBeTruthy();
  });
});

describe("ChartCard", () => {
  it("shows the empty message instead of the chart", () => {
    const { getByText, queryByText } = renderWithTheme(
      <ChartCard title="Today by hour" isEmpty emptyMessage="Nothing yet">
        {() => <Text>chart</Text>}
      </ChartCard>,
    );
    expect(getByText("Nothing yet")).toBeTruthy();
    expect(queryByText("chart")).toBeNull();
  });

  it("renders the chart with the measured width", () => {
    const renderChart = jest.fn(() => <Text>chart</Text>);
    const { getByTestId, getByText } = renderWithTheme(
      <ChartCard title="Last 7 days" isEmpty={false} emptyMessage="Nothing yet">
        {renderChart}
      </ChartCard>,
    );

    fireEvent(getByTestId("chart-area"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 312, height: 200 } },
    });

    expect(getByText("chart")).toBeTruthy();
    expect(renderChart).toHaveBeenLastCalledWith(312);
  });
});

describe("StatisticsHeader", () => {
  it("shows when the data was last updated", () => {
    const { getByText } = renderWithTheme(<StatisticsHeader lastUpdated={new Date()} />);
    expect(getByText("Statistics")).toBeTruthy();
    expect(getByText("Updated just now · pull down to refresh")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx jest components/Statistics/__test__/StatisticsCards.test.tsx`
Expected: FAIL. `Cannot find module '../TrendChip'`.

- [ ] **Step 3: Implement**

`frontend/components/ScreenContainer.tsx`: the full file becomes:
```tsx
import React, { ReactNode } from "react";
import {
  View,
  ScrollView,
  ViewStyle,
  StyleProp,
  RefreshControlProps,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  scrollable = false,
  contentContainerStyle,
  refreshControl,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (scrollable) {
    return (
      <ScrollView
        style={[
          {
            backgroundColor: theme.colors.background,
            padding: 24,
            marginTop: insets.top,
          },
          style,
        ]}
        contentContainerStyle={contentContainerStyle}
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.background,
          flex: 1,
          padding: 24,
          justifyContent: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
```

`frontend/components/Statistics/TrendChip.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { colors } from "@/theme/colors";

interface TrendChipProps {
  value: number | null;
  label?: string;
}

export const TrendChip: React.FC<TrendChipProps> = ({ value, label = "vs yesterday" }) => {
  const theme = useTheme();

  if (value === null) return null;

  const icon = value > 0 ? "trending-up" : value < 0 ? "trending-down" : "remove";
  const iconColor =
    value > 0 ? colors.darkGreen : value < 0 ? colors.error : theme.colors.onSurfaceVariant;
  const text = `${value > 0 ? "+" : ""}${value}% ${label}`;

  return (
    <View
      style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
      accessibilityLabel={text}
    >
      <Icon source={icon} size={14} color={iconColor} />
      <CustomText variant="labelSmall">{text}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
```

`frontend/components/Statistics/MetricCard.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { TrendChip } from "./TrendChip";

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  trend: number | null;
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, trend }) => {
  const theme = useTheme();

  return (
    <Card mode="elevated" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.labelRow}>
          <Icon source={icon} size={18} color={theme.colors.primary} />
          <CustomText variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            {label}
          </CustomText>
        </View>
        <CustomText variant="titleLarge" style={styles.value}>
          {value}
        </CustomText>
        <TrendChip value={trend} />
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  content: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  value: {
    fontWeight: "700",
  },
});
```

`frontend/components/Statistics/TodayCard.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon, ProgressBar, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { TrendChip } from "./TrendChip";
import { colors } from "@/theme/colors";
import { calculateProgress, formatSteps } from "@/utils/healthFormatters";

interface TodayCardProps {
  steps: number;
  goal: number;
  trend: number | null;
}

export const TodayCard: React.FC<TodayCardProps> = ({ steps, goal, trend }) => {
  const theme = useTheme();
  const percent = calculateProgress(steps, goal);
  const goalReached = steps >= goal;

  return (
    <Card mode="elevated" style={{ backgroundColor: theme.colors.surface }}>
      <Card.Content style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            <Icon source="footsteps" size={20} color={theme.colors.primary} />
            <CustomText variant="titleMedium">Today</CustomText>
          </View>
          <TrendChip value={trend} />
        </View>

        <View>
          <CustomText
            variant="displaySmall"
            style={styles.steps}
            accessibilityLabel={`${formatSteps(steps)} steps today`}
          >
            {formatSteps(steps)}
          </CustomText>
          <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            steps · goal {formatSteps(goal)}
          </CustomText>
        </View>

        <ProgressBar
          progress={percent / 100}
          color={goalReached ? colors.darkGreen : theme.colors.primary}
          style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}
        />
        <CustomText variant="labelLarge">
          {goalReached ? "Daily goal reached 🎉" : `${Math.round(percent)}% of your daily goal`}
        </CustomText>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  steps: {
    fontWeight: "700",
  },
  progress: {
    height: 10,
    borderRadius: 5,
  },
});
```

`frontend/components/Statistics/InsightsRow.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import type { HealthSummary } from "@/utils/healthStats";
import { formatCompactNumber, formatSteps } from "@/utils/healthFormatters";

interface InsightsRowProps {
  summary: HealthSummary;
  streak: number;
  bestDayLabel: (date: Date) => string;
}

export const InsightsRow: React.FC<InsightsRowProps> = ({ summary, streak, bestDayLabel }) => {
  const theme = useTheme();

  const items = [
    { icon: "stats-chart", label: "Daily average", value: `${formatSteps(summary.averageSteps)} steps` },
    {
      icon: "trophy",
      label: "Best day",
      value: `${bestDayLabel(summary.bestDay.date)} · ${formatCompactNumber(summary.bestDay.steps)}`,
    },
    { icon: "checkmark-circle", label: "Active days", value: `${summary.activeDays} of ${summary.dayCount}` },
    { icon: "flame", label: "Current streak", value: `${streak} ${streak === 1 ? "day" : "days"}` },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.item, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Icon source={item.icon} size={16} color={theme.colors.primary} />
          <CustomText variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.label}
          </CustomText>
          <CustomText variant="titleSmall">{item.value}</CustomText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  item: {
    flexGrow: 1,
    flexBasis: "45%",
    padding: 12,
    borderRadius: 12,
    gap: 2,
  },
});
```

`frontend/components/Statistics/ChartCard.tsx`:
```tsx
import React, { ReactNode, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Card, Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  isEmpty: boolean;
  emptyMessage: string;
  footer?: ReactNode;
  children: (width: number) => ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  isEmpty,
  emptyMessage,
  footer,
  children,
}) => {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(Math.round(event.nativeEvent.layout.width));
  };

  return (
    <Card mode="elevated" style={{ backgroundColor: theme.colors.surface }}>
      <Card.Content>
        <CustomText variant="titleMedium">{title}</CustomText>
        {subtitle ? (
          <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {subtitle}
          </CustomText>
        ) : null}

        <View style={styles.body} onLayout={handleLayout} testID="chart-area">
          {isEmpty ? (
            <View style={styles.empty}>
              <Icon source="bar-chart-outline" size={32} color={theme.colors.onSurfaceVariant} />
              <CustomText
                variant="bodyMedium"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
              >
                {emptyMessage}
              </CustomText>
            </View>
          ) : (
            width > 0 && children(width)
          )}
        </View>

        {!isEmpty && footer}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  body: {
    marginTop: 16,
    minHeight: 200,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: {
    textAlign: "center",
  },
});
```

Replace `frontend/components/Statistics/StatisticsHeader.tsx` with:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { formatLastUpdated } from "@/utils/healthFormatters";
import { CustomText } from "../CustomText";

interface StatisticsHeaderProps {
  lastUpdated: Date | null;
}

export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({ lastUpdated }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <CustomText variant="headlineMedium" style={styles.title}>
        Statistics
      </CustomText>
      <CustomText variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {lastUpdated
          ? `Updated ${formatLastUpdated(lastUpdated)} · pull down to refresh`
          : "Your activity from Apple Health"}
      </CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontWeight: "700",
  },
});
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx jest components/Statistics/__test__/StatisticsCards.test.tsx`
Expected: PASS (10 tests).

---

### Task 7: Responsive charts

**Files:**
- Create: `frontend/components/Statistics/AxisLabels.tsx`
- Modify (rewrite):
  - `frontend/components/Statistics/DailyChart.tsx`
  - `frontend/components/Statistics/WeeklyChart.tsx`
  - `frontend/components/Statistics/MonthlyChart.tsx`
- Test: `frontend/components/Statistics/__test__/Charts.test.tsx`

**Interfaces:**
- Consumes:
  - `fitBars`, `fitLine`, `barCenter`, `pointX`, `niceMax`, `Y_AXIS_WIDTH`, `CHART_SECTIONS` (Task 2)
  - `HourlySteps`, `HealthData` (Task 4)
  - `formatCompactNumber`, `getDayAbbreviation` (Task 1 and the existing formatters)
  - `renderWithTheme` (Task 6)
- Produces:
  - `AxisLabels({ labels: { x: number; text: string }[] })`
  - `DailyChart({ data: HourlySteps[]; width: number })`
  - `WeeklyChart({ data: HealthData[]; goal: number; width: number })`
  - `MonthlyChart({ data: HealthData[]; goal: number; width: number })`

Why `AxisLabels` exists: gifted-charts makes each bar label exactly one bar slot wide, which is too narrow for "12h" on 24 bars. The Day and Month charts hide the built-in labels and draw their own, positioned from the same layout maths. The Week chart's 7 slots are wide enough, so it keeps the built-in labels.

- [ ] **Step 1: Write the failing test**

`frontend/components/Statistics/__test__/Charts.test.tsx`:
```tsx
/* eslint-disable import/first */
jest.mock("react-native-gifted-charts", () => ({
  BarChart: jest.fn(() => null),
  LineChart: jest.fn(() => null),
}));

import React from "react";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { renderWithTheme } from "./renderWithTheme";
import { DailyChart } from "../DailyChart";
import { WeeklyChart } from "../WeeklyChart";
import { MonthlyChart } from "../MonthlyChart";
import { Y_AXIS_WIDTH } from "../chartLayout";

// Axis labels are hidden from screen readers, so queries must include hidden elements
const hidden = { includeHiddenElements: true };

const lastProps = (chart: unknown) => {
  const calls = (chart as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
};

const days = (count: number, steps: (i: number) => number) =>
  Array.from({ length: count }, (_, i) => ({
    steps: steps(i),
    distance: 0,
    calories: 0,
    date: new Date(2026, 8, 14 + i),
  }));

const fitsWidth = (props: any, containerWidth: number) => {
  const count = props.data.length;
  const used =
    props.initialSpacing +
    props.endSpacing +
    count * (props.barWidth ?? 0) +
    (count - 1) * props.spacing;
  return used <= containerWidth - Y_AXIS_WIDTH + 0.001;
};

describe.each([256, 326, 960])("charts at %ipx", (width) => {
  beforeEach(() => jest.clearAllMocks());

  it("DailyChart renders 24 bars that fit, with hour labels", () => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour * 100 }));
    const { getByText } = renderWithTheme(<DailyChart data={hourly} width={width} />);

    const props = lastProps(BarChart);
    expect(props.data).toHaveLength(24);
    expect(fitsWidth(props, width)).toBe(true);
    expect(props.disableScroll).toBe(true);
    expect(props.maxValue).toBeGreaterThanOrEqual(2300);
    expect(getByText("0h", hidden)).toBeTruthy();
    expect(getByText("18h", hidden)).toBeTruthy();
  });

  it("WeeklyChart renders 7 bars with a goal line", () => {
    renderWithTheme(<WeeklyChart data={days(7, () => 6000)} goal={10000} width={width} />);

    const props = lastProps(BarChart);
    expect(props.data).toHaveLength(7);
    expect(fitsWidth(props, width)).toBe(true);
    expect(props.showReferenceLine1).toBe(true);
    expect(props.referenceLine1Position).toBe(10000);
    expect(props.maxValue).toBeGreaterThan(10000);
  });

  it("MonthlyChart renders 30 points that fit, with date labels", () => {
    const { getByText } = renderWithTheme(
      <MonthlyChart data={days(30, (i) => 5000 + i * 100)} goal={10000} width={width} />,
    );

    const props = lastProps(LineChart);
    expect(props.data).toHaveLength(30);
    expect(props.initialSpacing + 29 * props.spacing + props.endSpacing).toBeLessThanOrEqual(
      width - Y_AXIS_WIDTH + 0.001,
    );
    expect(getByText("14/9", hidden)).toBeTruthy();
    expect(getByText("13/10", hidden)).toBeTruthy();
  });
});

it("charts handle all-zero data without a zero max value", () => {
  renderWithTheme(<WeeklyChart data={days(7, () => 0)} goal={10000} width={326} />);
  expect(lastProps(BarChart).maxValue).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest components/Statistics/__test__/Charts.test.tsx`
Expected: FAIL. The current charts have no `width` prop and use fixed `width={300}`, so `fitsWidth` fails and the labels are missing.

- [ ] **Step 3: Implement**

`frontend/components/Statistics/AxisLabels.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { Y_AXIS_WIDTH } from "./chartLayout";

const LABEL_WIDTH = 36;

interface AxisLabelsProps {
  // x is measured from the start of the plot area (after the y-axis labels)
  labels: { x: number; text: string }[];
}

export const AxisLabels: React.FC<AxisLabelsProps> = ({ labels }) => {
  const theme = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {labels.map(({ x, text }) => (
        <CustomText
          key={text}
          variant="labelSmall"
          style={[
            styles.label,
            { left: x - LABEL_WIDTH / 2, color: theme.colors.onSurfaceVariant },
          ]}
        >
          {text}
        </CustomText>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    height: 16,
    marginLeft: Y_AXIS_WIDTH,
    marginTop: 4,
  },
  label: {
    position: "absolute",
    width: LABEL_WIDTH,
    textAlign: "center",
    fontSize: 10,
  },
});
```

`frontend/components/Statistics/DailyChart.tsx`:
```tsx
import React from "react";
import { View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "react-native-paper";
import type { HourlySteps } from "@/services/healthKitService";
import { colors } from "@/theme/colors";
import { formatCompactNumber } from "@/utils/healthFormatters";
import { AxisLabels } from "./AxisLabels";
import { barCenter, CHART_SECTIONS, fitBars, niceMax, Y_AXIS_WIDTH } from "./chartLayout";

interface DailyChartProps {
  data: HourlySteps[];
  width: number;
}

const CHART_HEIGHT = 180;
const LABELLED_HOURS = [0, 6, 12, 18];

export const DailyChart: React.FC<DailyChartProps> = ({ data, width }) => {
  const theme = useTheme();
  const layout = fitBars(width, data.length);
  const currentHour = new Date().getHours();
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 10 };

  const chartData = data.map(({ hour, steps }) => ({
    value: steps,
    // Highlight the hour in progress
    frontColor: hour === currentHour ? colors.secondary : theme.colors.primary,
  }));

  return (
    <View>
      <BarChart
        data={chartData}
        width={layout.chartWidth}
        height={CHART_HEIGHT}
        barWidth={layout.barWidth}
        spacing={layout.spacing}
        initialSpacing={layout.initialSpacing}
        endSpacing={layout.initialSpacing}
        disableScroll
        roundedTop
        maxValue={niceMax(data.map((d) => d.steps))}
        noOfSections={CHART_SECTIONS}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        yAxisThickness={0}
        yAxisTextStyle={axisText}
        xAxisColor={theme.colors.outlineVariant}
        xAxisLabelsHeight={0}
        rulesType="dashed"
        rulesColor={theme.colors.outlineVariant}
        formatYLabel={(label) => formatCompactNumber(Number(label))}
        isAnimated
      />
      <AxisLabels
        labels={LABELLED_HOURS.map((hour) => ({ x: barCenter(layout, hour), text: `${hour}h` }))}
      />
    </View>
  );
};
```

`frontend/components/Statistics/WeeklyChart.tsx`:
```tsx
import React from "react";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "react-native-paper";
import type { HealthData } from "@/services/healthKitService";
import { colors } from "@/theme/colors";
import { formatCompactNumber, getDayAbbreviation } from "@/utils/healthFormatters";
import { CHART_SECTIONS, fitBars, niceMax, Y_AXIS_WIDTH } from "./chartLayout";

interface WeeklyChartProps {
  data: HealthData[];
  goal: number;
  width: number;
}

const CHART_HEIGHT = 200;

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ data, goal, width }) => {
  const theme = useTheme();
  const layout = fitBars(width, data.length, 0.55);
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 10 };

  const chartData = data.map((day, index) => {
    const isToday = index === data.length - 1;
    return {
      value: day.steps,
      label: getDayAbbreviation(day.date),
      frontColor: isToday ? colors.secondary : theme.colors.primary,
      labelTextStyle: {
        ...axisText,
        color: isToday ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
        fontWeight: isToday ? ("700" as const) : ("400" as const),
      },
    };
  });

  return (
    <BarChart
      data={chartData}
      width={layout.chartWidth}
      height={CHART_HEIGHT}
      barWidth={layout.barWidth}
      spacing={layout.spacing}
      initialSpacing={layout.initialSpacing}
      endSpacing={layout.initialSpacing}
      disableScroll
      roundedTop
      maxValue={niceMax(
        data.map((d) => d.steps),
        goal * 1.1,
      )}
      noOfSections={CHART_SECTIONS}
      yAxisLabelWidth={Y_AXIS_WIDTH}
      yAxisThickness={0}
      yAxisTextStyle={axisText}
      xAxisColor={theme.colors.outlineVariant}
      rulesType="dashed"
      rulesColor={theme.colors.outlineVariant}
      formatYLabel={(label) => formatCompactNumber(Number(label))}
      showReferenceLine1
      referenceLine1Position={goal}
      referenceLine1Config={{
        color: theme.colors.onSurfaceVariant,
        type: "dashed",
        dashWidth: 4,
        dashGap: 4,
        thickness: 1,
        labelText: "Goal",
        labelTextStyle: axisText,
      }}
      isAnimated
    />
  );
};
```

`frontend/components/Statistics/MonthlyChart.tsx`:
```tsx
import React from "react";
import { View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useTheme } from "react-native-paper";
import type { HealthData } from "@/services/healthKitService";
import { formatCompactNumber } from "@/utils/healthFormatters";
import { AxisLabels } from "./AxisLabels";
import { CHART_SECTIONS, fitLine, niceMax, pointX, Y_AXIS_WIDTH } from "./chartLayout";

interface MonthlyChartProps {
  data: HealthData[];
  goal: number;
  width: number;
}

const CHART_HEIGHT = 180;
const LABEL_EVERY_DAYS = 7;

const formatDayMonth = (date: Date) => `${date.getDate()}/${date.getMonth() + 1}`;

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ data, goal, width }) => {
  const theme = useTheme();
  const layout = fitLine(width, data.length);
  const axisText = { color: theme.colors.onSurfaceVariant, fontSize: 10 };

  // Label every 7th day plus the last one, skipping it if it would crowd the previous label
  const lastIndex = data.length - 1;
  const labelIndexes = data
    .map((_, index) => index)
    .filter((index) => index % LABEL_EVERY_DAYS === 0 && lastIndex - index >= 3);
  if (lastIndex >= 0) labelIndexes.push(lastIndex);

  return (
    <View>
      <LineChart
        data={data.map((day) => ({ value: day.steps }))}
        width={layout.chartWidth}
        height={CHART_HEIGHT}
        spacing={layout.spacing}
        initialSpacing={layout.initialSpacing}
        endSpacing={layout.initialSpacing}
        disableScroll
        areaChart
        curved
        color={theme.colors.primary}
        thickness={3}
        startFillColor={theme.colors.primary}
        endFillColor={theme.colors.primary}
        startOpacity={0.35}
        endOpacity={0.02}
        hideDataPoints
        maxValue={niceMax(
          data.map((d) => d.steps),
          goal * 1.1,
        )}
        noOfSections={CHART_SECTIONS}
        yAxisLabelWidth={Y_AXIS_WIDTH}
        yAxisThickness={0}
        yAxisTextStyle={axisText}
        xAxisColor={theme.colors.outlineVariant}
        xAxisLabelsHeight={0}
        rulesType="dashed"
        rulesColor={theme.colors.outlineVariant}
        formatYLabel={(label) => formatCompactNumber(Number(label))}
        showReferenceLine1
        referenceLine1Position={goal}
        referenceLine1Config={{
          color: theme.colors.onSurfaceVariant,
          type: "dashed",
          dashWidth: 4,
          dashGap: 4,
          thickness: 1,
          labelText: "Goal",
          labelTextStyle: axisText,
        }}
        isAnimated
      />
      <AxisLabels
        labels={labelIndexes.map((index) => ({
          x: pointX(layout, index),
          text: formatDayMonth(data[index].date),
        }))}
      />
    </View>
  );
};
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest components/Statistics/__test__/Charts.test.tsx`
Expected: PASS (10 tests).

---

### Task 8: Loading, empty and error states

**Files:**
- Modify (rewrite):
  - `frontend/components/Statistics/LoadingState.tsx`
  - `frontend/components/Statistics/EmptyState.tsx`
  - `frontend/components/Statistics/ErrorState.tsx`
- Test: `frontend/components/Statistics/__test__/States.test.tsx`

**Interfaces:**
- Consumes: `ScreenContainer` (Task 6), `PrimaryButton` (`@/components/Button`), `renderWithTheme` (Task 6)
- Produces:
  - `LoadingState()` with `testID="statistics-loading"`
  - `EmptyState({ onRefresh: () => void; refreshing: boolean })`
  - `type ErrorVariant = "denied" | "unavailable" | "error"`
  - `ErrorState({ variant: ErrorVariant; error?: Error | null; onRetry: () => void; retrying?: boolean })`

- [ ] **Step 1: Write the failing test**

`frontend/components/Statistics/__test__/States.test.tsx`:
```tsx
import React from "react";
import { Linking } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { renderWithTheme } from "./renderWithTheme";
import { LoadingState } from "../LoadingState";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";

describe("LoadingState", () => {
  it("renders an accessible skeleton", () => {
    const { getByTestId, getByLabelText } = renderWithTheme(<LoadingState />);
    expect(getByTestId("statistics-loading")).toBeTruthy();
    expect(getByLabelText("Loading statistics")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("explains the missing data and refreshes", () => {
    const onRefresh = jest.fn();
    const { getByText } = renderWithTheme(<EmptyState onRefresh={onRefresh} refreshing={false} />);

    expect(getByText("No activity yet")).toBeTruthy();
    expect(getByText(/Data Access & Devices/)).toBeTruthy();

    fireEvent.press(getByText("Refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState", () => {
  it("opens Settings when access is denied", () => {
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    const onRetry = jest.fn();
    const { getByText } = renderWithTheme(<ErrorState variant="denied" onRetry={onRetry} />);

    expect(getByText("Health access needed")).toBeTruthy();
    fireEvent.press(getByText("Open Settings"));

    expect(openSettings).toHaveBeenCalled();
    expect(onRetry).not.toHaveBeenCalled();
  });

  it("explains that Apple Health is iOS only, without an action", () => {
    const { getByText, queryByText } = renderWithTheme(
      <ErrorState variant="unavailable" onRetry={jest.fn()} />,
    );

    expect(getByText("Apple Health isn't available")).toBeTruthy();
    expect(queryByText("Try again")).toBeNull();
  });

  it("retries after an error", () => {
    const onRetry = jest.fn();
    const { getByText } = renderWithTheme(
      <ErrorState variant="error" error={new Error("boom")} onRetry={onRetry} />,
    );

    fireEvent.press(getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest components/Statistics/__test__/States.test.tsx`
Expected: FAIL. No `testID`, the new copy is missing, and `ErrorState` has no `variant` prop.

- [ ] **Step 3: Implement**

Replace `frontend/components/Statistics/LoadingState.tsx`:
```tsx
import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { ScreenContainer } from "../ScreenContainer";

const PULSE_MS = 700;

export const LoadingState: React.FC = () => {
  const theme = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timing = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: PULSE_MS,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      });
    const pulse = Animated.loop(Animated.sequence([timing(0.45), timing(1)]));

    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  const block = [styles.block, { backgroundColor: theme.colors.surfaceVariant }];

  return (
    <ScreenContainer scrollable style={styles.screen}>
      <Animated.View
        style={{ opacity }}
        testID="statistics-loading"
        accessibilityLabel="Loading statistics"
        accessibilityRole="progressbar"
      >
        <View style={[block, styles.title]} />
        <View style={[block, styles.subtitle]} />
        <View style={[block, styles.hero]} />
        <View style={styles.row}>
          <View style={[block, styles.metric]} />
          <View style={[block, styles.metric]} />
        </View>
        <View style={[block, styles.tabs]} />
        <View style={[block, styles.chart]} />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  block: {
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    width: "45%",
    height: 28,
    marginBottom: 8,
  },
  subtitle: {
    width: "65%",
    height: 16,
  },
  hero: {
    height: 170,
    borderRadius: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  metric: {
    flex: 1,
    height: 110,
    borderRadius: 16,
  },
  tabs: {
    height: 40,
    borderRadius: 20,
  },
  chart: {
    height: 260,
    borderRadius: 16,
  },
});
```

Replace `frontend/components/Statistics/EmptyState.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

interface EmptyStateProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh, refreshing }) => {
  const theme = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Icon source="footsteps-outline" size={56} color={theme.colors.primary} />
        <CustomText variant="headlineSmall" style={styles.center}>
          No activity yet
        </CustomText>
        <CustomText
          variant="bodyLarge"
          style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
        >
          {"We couldn't find any steps, distance or calories in Apple Health for the last 30 days."}
        </CustomText>

        <View style={[styles.tip, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Icon source="bulb-outline" size={18} color={theme.colors.onSurfaceVariant} />
          <CustomText variant="bodySmall" style={styles.tipText}>
            Make sure your iPhone is recording activity, and that WalkIt can read it in Settings →
            Health → Data Access & Devices.
          </CustomText>
        </View>

        <PrimaryButton icon="refresh" onPress={onRefresh} loading={refreshing} disabled={refreshing}>
          Refresh
        </PrimaryButton>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: 16,
  },
  center: {
    textAlign: "center",
  },
  tip: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
  },
});
```

Replace `frontend/components/Statistics/ErrorState.tsx`:
```tsx
import React from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

export type ErrorVariant = "denied" | "unavailable" | "error";

interface ErrorStateProps {
  variant: ErrorVariant;
  error?: Error | null;
  onRetry: () => void;
  retrying?: boolean;
}

const COPY: Record<ErrorVariant, { icon: string; title: string; message: string; action?: string }> = {
  denied: {
    icon: "lock-closed-outline",
    title: "Health access needed",
    message:
      "Allow WalkIt to read your steps, walking distance and active energy so we can show your statistics.",
    action: "Open Settings",
  },
  unavailable: {
    icon: "phone-portrait-outline",
    title: "Apple Health isn't available",
    message:
      "Statistics come from Apple Health, which only works in the WalkIt iOS app. It isn't available in Expo Go, on Android or on the web.",
  },
  error: {
    icon: "alert-circle-outline",
    title: "Couldn't load your statistics",
    message: "Something went wrong while reading Apple Health. Please try again.",
    action: "Try again",
  },
};

export const ErrorState: React.FC<ErrorStateProps> = ({ variant, error, onRetry, retrying }) => {
  const theme = useTheme();
  const copy = COPY[variant];
  const handleAction = variant === "denied" ? () => Linking.openSettings() : onRetry;

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <Icon source={copy.icon} size={56} color={theme.colors.primary} />
        <CustomText variant="headlineSmall" style={styles.center}>
          {copy.title}
        </CustomText>
        <CustomText
          variant="bodyLarge"
          style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
        >
          {copy.message}
        </CustomText>

        {copy.action ? (
          <PrimaryButton onPress={handleAction} loading={retrying} disabled={retrying}>
            {copy.action}
          </PrimaryButton>
        ) : null}

        {__DEV__ && error ? (
          <CustomText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Debug: {error.message}
          </CustomText>
        ) : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: "center",
    gap: 16,
  },
  center: {
    textAlign: "center",
  },
});
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest components/Statistics/__test__/States.test.tsx`
Expected: PASS (5 tests).

---

### Task 9: Compose `StatisticsScreen`

**Files:**
- Modify (rewrite): `frontend/screens/StatisticsScreen.tsx`
- Test: `frontend/screens/__test__/StatisticsScreen.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–8, plus `UseHealthDataReturn` (Task 5)
- Produces: `export default function StatisticsScreen()`. `app/(app)/statistics.tsx` is unchanged.

- [ ] **Step 1: Write the failing test**

`frontend/screens/__test__/StatisticsScreen.test.tsx`:
```tsx
/* eslint-disable import/first */
jest.mock("@/hooks/useHealthData");
jest.mock("react-native-gifted-charts", () => ({
  BarChart: () => null,
  LineChart: () => null,
}));

import React from "react";
import { RefreshControl } from "react-native";
import { fireEvent } from "@testing-library/react-native";
import { useHealthData, UseHealthDataReturn } from "@/hooks/useHealthData";
import { renderWithTheme } from "@/components/Statistics/__test__/renderWithTheme";
import { summarize } from "@/utils/healthStats";
import StatisticsScreen from "../StatisticsScreen";

const mockedUseHealthData = useHealthData as jest.MockedFunction<typeof useHealthData>;

const makeDays = (steps: (i: number) => number) =>
  Array.from({ length: 30 }, (_, i) => ({
    steps: steps(i),
    distance: steps(i) * 0.75,
    calories: steps(i) * 0.04,
    date: new Date(2026, 8, 14 + i),
  }));

const healthState = (overrides: Partial<UseHealthDataReturn> = {}): UseHealthDataReturn => {
  const month = makeDays((i) => (i === 29 ? 12847 : i === 28 ? 8234 : 7000));
  const week = month.slice(-7);
  return {
    status: "ready",
    error: null,
    today: month[29],
    yesterday: month[28],
    hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour === 9 ? 1500 : 0 })),
    week,
    month,
    weekSummary: summarize(week),
    monthSummary: summarize(month),
    trends: { steps: 56, distance: 56, calories: 56 },
    streak: 30,
    refreshing: false,
    lastUpdated: new Date(),
    refresh: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

describe("StatisticsScreen", () => {
  it("shows the skeleton while loading", () => {
    mockedUseHealthData.mockReturnValue(healthState({ status: "loading", today: null }));
    const { getByTestId } = renderWithTheme(<StatisticsScreen />);
    expect(getByTestId("statistics-loading")).toBeTruthy();
  });

  it("shows the unavailable state", () => {
    mockedUseHealthData.mockReturnValue(healthState({ status: "unavailable" }));
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText("Apple Health isn't available")).toBeTruthy();
  });

  it("retries from the error state", () => {
    const state = healthState({ status: "error", error: new Error("boom") });
    mockedUseHealthData.mockReturnValue(state);
    const { getByText } = renderWithTheme(<StatisticsScreen />);

    fireEvent.press(getByText("Try again"));
    expect(state.refresh).toHaveBeenCalled();
  });

  it("shows the empty state when 30 days have no activity", () => {
    const month = makeDays(() => 0).map((d) => ({ ...d, distance: 0, calories: 0 }));
    mockedUseHealthData.mockReturnValue(
      healthState({ month, week: month.slice(-7), today: month[29] }),
    );
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText("No activity yet")).toBeTruthy();
  });

  it("highlights today's stats with goal progress and trends", () => {
    mockedUseHealthData.mockReturnValue(healthState());
    const { getByText, getAllByText } = renderWithTheme(<StatisticsScreen />);

    expect(getByText("12,847")).toBeTruthy();
    expect(getByText("Daily goal reached 🎉")).toBeTruthy();
    expect(getAllByText("+56% vs yesterday")).toHaveLength(3);
    expect(getByText("9.6km")).toBeTruthy();
    expect(getByText("514 kcal")).toBeTruthy();
  });

  it("switches between Day, Week and Month views", () => {
    mockedUseHealthData.mockReturnValue(healthState());
    const { getByText, queryByText } = renderWithTheme(<StatisticsScreen />);

    expect(getByText("Today by hour")).toBeTruthy();

    fireEvent.press(getByText("Week"));
    expect(getByText("Last 7 days")).toBeTruthy();
    expect(getByText("Daily average")).toBeTruthy();
    expect(queryByText("Today by hour")).toBeNull();

    fireEvent.press(getByText("Month"));
    expect(getByText("Last 30 days")).toBeTruthy();
  });

  it("shows an empty message in the Day view before any steps today", () => {
    mockedUseHealthData.mockReturnValue(
      healthState({ hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, steps: 0 })) }),
    );
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText(/No steps recorded yet today/)).toBeTruthy();
  });

  it("refreshes on pull-to-refresh", () => {
    const state = healthState();
    mockedUseHealthData.mockReturnValue(state);
    const { UNSAFE_getByType } = renderWithTheme(<StatisticsScreen />);

    UNSAFE_getByType(RefreshControl).props.onRefresh();
    expect(state.refresh).toHaveBeenCalled();
  });

  it("keeps showing data with a notice when a refresh failed", () => {
    mockedUseHealthData.mockReturnValue(healthState({ error: new Error("offline") }));
    const { getByText } = renderWithTheme(<StatisticsScreen />);
    expect(getByText("Couldn't refresh. Showing your last data.")).toBeTruthy();
    expect(getByText("12,847")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npx jest screens/__test__/StatisticsScreen.test.tsx`
Expected: FAIL. The current screen uses removed hook fields, and the new texts and components are missing.

- [ ] **Step 3: Implement**

Replace `frontend/screens/StatisticsScreen.tsx`:
```tsx
import React, { useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { SegmentedButtons, useTheme } from "react-native-paper";
import { CustomText, ScreenContainer } from "@/components";
import { useHealthData } from "@/hooks/useHealthData";
import { StatisticsHeader } from "@/components/Statistics/StatisticsHeader";
import { LoadingState } from "@/components/Statistics/LoadingState";
import { ErrorState } from "@/components/Statistics/ErrorState";
import { EmptyState } from "@/components/Statistics/EmptyState";
import { TodayCard } from "@/components/Statistics/TodayCard";
import { MetricCard } from "@/components/Statistics/MetricCard";
import { ChartCard } from "@/components/Statistics/ChartCard";
import { InsightsRow } from "@/components/Statistics/InsightsRow";
import { DailyChart } from "@/components/Statistics/DailyChart";
import { WeeklyChart } from "@/components/Statistics/WeeklyChart";
import { MonthlyChart } from "@/components/Statistics/MonthlyChart";
import { DAILY_STEP_GOAL, hasAnyActivity, HealthSummary } from "@/utils/healthStats";
import {
  formatCalories,
  formatDate,
  formatDistance,
  formatSteps,
  getDayAbbreviation,
} from "@/utils/healthFormatters";

type StatsView = "day" | "week" | "month";

const VIEW_BUTTONS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const summaryLine = (summary: HealthSummary | null) =>
  summary
    ? `${formatSteps(summary.totalSteps)} steps · ${formatDistance(summary.totalDistance)}`
    : undefined;

export default function StatisticsScreen() {
  const theme = useTheme();
  const [view, setView] = useState<StatsView>("day");
  const {
    status,
    error,
    today,
    hourly,
    week,
    month,
    weekSummary,
    monthSummary,
    trends,
    streak,
    refreshing,
    lastUpdated,
    refresh,
  } = useHealthData();

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status !== "ready") {
    return <ErrorState variant={status} error={error} onRetry={refresh} retrying={refreshing} />;
  }

  if (!today || !hasAnyActivity(month)) {
    return <EmptyState onRefresh={refresh} refreshing={refreshing} />;
  }

  return (
    <ScreenContainer
      scrollable
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <StatisticsHeader lastUpdated={lastUpdated} />

      {error ? (
        <CustomText custom="error" variant="bodySmall" style={styles.notice}>
          {"Couldn't refresh. Showing your last data."}
        </CustomText>
      ) : null}

      <TodayCard steps={today.steps} goal={DAILY_STEP_GOAL} trend={trends.steps} />

      <View style={styles.metrics}>
        <MetricCard
          icon="walk"
          label="Distance"
          value={formatDistance(today.distance)}
          trend={trends.distance}
        />
        <MetricCard
          icon="flame"
          label="Calories"
          value={formatCalories(today.calories)}
          trend={trends.calories}
        />
      </View>

      <SegmentedButtons
        value={view}
        onValueChange={(value) => setView(value as StatsView)}
        buttons={VIEW_BUTTONS}
      />

      {view === "day" && (
        <ChartCard
          title="Today by hour"
          subtitle={`${formatSteps(today.steps)} steps so far`}
          isEmpty={!hourly.some((hour) => hour.steps > 0)}
          emptyMessage="No steps recorded yet today. Your hourly activity will show up here once you start moving."
        >
          {(width) => <DailyChart data={hourly} width={width} />}
        </ChartCard>
      )}

      {view === "week" && (
        <ChartCard
          title="Last 7 days"
          subtitle={summaryLine(weekSummary)}
          isEmpty={!hasAnyActivity(week)}
          emptyMessage="No activity in the last 7 days. Your daily steps will appear here."
          footer={
            weekSummary ? (
              <InsightsRow summary={weekSummary} streak={streak} bestDayLabel={getDayAbbreviation} />
            ) : null
          }
        >
          {(width) => <WeeklyChart data={week} goal={DAILY_STEP_GOAL} width={width} />}
        </ChartCard>
      )}

      {view === "month" && (
        <ChartCard
          title="Last 30 days"
          subtitle={summaryLine(monthSummary)}
          isEmpty={!hasAnyActivity(month)}
          emptyMessage="No activity in the last 30 days. Your daily steps will appear here."
          footer={
            monthSummary ? (
              <InsightsRow summary={monthSummary} streak={streak} bestDayLabel={formatDate} />
            ) : null
          }
        >
          {(width) => <MonthlyChart data={month} goal={DAILY_STEP_GOAL} width={width} />}
        </ChartCard>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
  },
  content: {
    gap: 16,
    paddingBottom: 32,
  },
  notice: {
    textAlign: "center",
  },
  metrics: {
    flexDirection: "row",
    gap: 12,
  },
});
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx jest screens/__test__/StatisticsScreen.test.tsx`
Expected: PASS (9 tests).

---

### Task 10: Full verification

**Files:** none new. Remove stale usages if found.

- [ ] **Step 1: Check for leftover references to removed APIs**

Run: `grep -rnE "getTodayStats|getWeekStats|getMonthStats|getStatsForDays|weekStats|monthStats|todayStats|hasPermission" app components hooks screens services utils | grep -v __test__`
Expected: no output.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -v "^app-example" | grep "error TS"`
Expected: no output.

- [ ] **Step 3: Full test suite**

Run: `npx jest --ci`
Expected: all suites pass.

- [ ] **Step 4: Lint**

Run: `npx eslint app components hooks screens services utils`
Expected: 0 errors.

- [ ] **Step 5: iOS bundle**

Run: `npx expo export --platform ios --output-dir /tmp/walkit-export`
Expected: `Exported: /tmp/walkit-export`.

- [ ] **Step 6: Manual check (user, in Expo Go)**

Run `npm run start:go` and open the Statistics tab. Check that:
- The skeleton pulses briefly.
- The today card shows goal progress and trend chips.
- Day / Week / Month switch views.
- Pulling down refreshes.
- Dark mode (iOS Settings → Display) shows dark cards.
- An iPhone SE simulator or a small phone shows no overflowing charts.
