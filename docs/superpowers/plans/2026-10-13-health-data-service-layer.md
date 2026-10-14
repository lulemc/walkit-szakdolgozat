# Health Data Service Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ticket #64 (and #63, using Health Connect): one platform-agnostic `healthService` for Apple Health (iOS) and Health Connect (Android), with consistent data, unified permissions and standardised errors.

**Architecture:**
- `services/health/` holds the shared types, a `normalize` module and a `healthService` facade.
- The facade delegates to a `HealthProvider`: Apple Health, Health Connect, mock, or unsupported.
- Metro platform files (`providers/index.ios.ts` / `index.android.ts` / `index.ts`) choose the native provider at build time.
- The facade adds what every platform shares: mock switching, a session permission cache, normalisation and error wrapping.
- `useHealthData` and the Statistics UI move to the facade.

**Tech Stack:**
- Expo SDK 57, React Native 0.86 (New Architecture), TypeScript.
- `react-native-health` 1.19 for iOS, `react-native-health-connect` 4.1.3 for Android.
- Jest (jest-expo) with React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-13-health-data-service-layer-design.md`

## Global Constraints

- **Android API:** Health Connect via `react-native-health-connect@^4.1.3`, not Google Fit.
- **Metrics:**
  - steps (count), distance (metres), active energy (kcal).
  - Hourly: 24 buckets for today. Daily: `days` buckets, local midnight, oldest first, zero-filled, whole numbers ≥ 0.
- **Permissions (read only):**
  - iOS: `StepCount`, `DistanceWalkingRunning`, `ActiveEnergyBurned`.
  - Android: `Steps`, `Distance`, `ActiveCaloriesBurned`, plus manifest `android.permission.health.READ_STEPS`, `READ_DISTANCE`, `READ_ACTIVE_CALORIES_BURNED`.
- **Android build:** `minSdkVersion` 26 via `expo-build-properties`.
- **Mock mode:** active unless `EXPO_PUBLIC_USE_MOCK_HEALTH === "false"`.
- **Error codes:** `UNSUPPORTED_PLATFORM`, `NOT_INSTALLED`, `UPDATE_REQUIRED`, `PERMISSION_DENIED`, `NOT_INITIALIZED`, `FETCH_FAILED`, `INVALID_RANGE`.
- **Display names:**
  - "Apple Health"
  - "Health Connect"
  - "Demo data"
  - "Health data" (unsupported platform)
- **Lazy loading:** load `react-native-health-connect` lazily (first use). Under the New Architecture it throws on import when the native module is missing (Expo Go, iOS, web).
- **Lockfile:** `package-lock.json` must only contain `registry.npmjs.org` tarball URLs. CI cannot reach internal mirrors.
- **Code rules:** colours, typography and component rules from the #65 plan still apply to UI changes.
- **Commits:** one local commit per task on `feature/64-Create-Health-Data-Service-Layer` (approved by the user); never push.
- **Commands:** run from `frontend/` unless stated otherwise.

---

### Task 1: Shared types and normalisation

**Files:**
- Create: `frontend/services/health/types.ts`, `frontend/services/health/normalize.ts`
- Modify (type imports only; change `@/services/healthKitService` to `@/services/health/types`):
  - `frontend/utils/healthStats.ts:1`
  - `frontend/utils/mockHealthData.ts:1`
  - `frontend/utils/__test__/healthStats.test.ts:8`
  - `frontend/components/Statistics/DailyChart.tsx:5`
  - `frontend/components/Statistics/WeeklyChart.tsx:4`
  - `frontend/components/Statistics/MonthlyChart.tsx:5`
- Test: `frontend/services/health/__test__/normalize.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `type HealthPlatform = "apple-health" | "health-connect" | "mock" | "unsupported"`
  - `type HealthAvailability = "available" | "notInstalled" | "updateRequired" | "unsupported"`
  - `interface HealthData { steps; distance; calories: number; date: Date }`
  - `interface HourlySteps { hour: number; steps: number }`
  - `interface RawHourlyBucket { start: Date; steps: number }`
  - `interface RawDailyBucket { start: Date; steps?: number; distance?: number; calories?: number }`
  - `enum HealthErrorCode` (the 7 codes, string values equal to their names)
  - `class HealthServiceError extends Error { code; platform; originalError? }`
  - `interface HealthProvider { platform; displayName; getAvailability(); requestPermissions(); getHourlySteps(now); getDailyStats(days, now); openSettings(); openInstallPage() }`
- Produces (`normalize.ts`):
  - `parseHealthDate(value: string): Date`
  - `startOfDay(date: Date): Date`
  - `normalizeHourly(buckets: RawHourlyBucket[], now: Date): HourlySteps[]`
  - `normalizeDaily(buckets: RawDailyBucket[], days: number, now: Date): HealthData[]`

- [ ] **Step 1: Write the failing test**

`frontend/services/health/__test__/normalize.test.ts`:
```ts
import { normalizeDaily, normalizeHourly, parseHealthDate, startOfDay } from "../normalize";

const NOW = new Date(2026, 9, 13, 15, 30);

describe("parseHealthDate", () => {
  it("parses compact offsets like +0200", () => {
    const date = new Date(2026, 9, 13, 8);
    const offset = -date.getTimezoneOffset();
    const pad = (n: number) => `${Math.abs(n)}`.padStart(2, "0");
    const sign = offset >= 0 ? "+" : "-";
    const text = `2026-10-13T08:00:00.000${sign}${pad(Math.trunc(offset / 60))}${pad(offset % 60)}`;

    expect(parseHealthDate(text).getTime()).toBe(date.getTime());
  });

  it("parses UTC instants", () => {
    const date = new Date(2026, 9, 13, 8);
    expect(parseHealthDate(date.toISOString()).getTime()).toBe(date.getTime());
  });

  it("treats date-times without an offset as local time", () => {
    expect(parseHealthDate("2026-10-13T00:00")).toEqual(new Date(2026, 9, 13));
  });
});

describe("startOfDay", () => {
  it("returns local midnight without changing the input", () => {
    const input = new Date(NOW);
    expect(startOfDay(input)).toEqual(new Date(2026, 9, 13));
    expect(input).toEqual(NOW);
  });
});

describe("normalizeHourly", () => {
  it("returns 24 zero-filled hours", () => {
    const hourly = normalizeHourly([], NOW);
    expect(hourly).toHaveLength(24);
    expect(hourly.every((h, i) => h.hour === i && h.steps === 0)).toBe(true);
  });

  it("sums buckets into their local hour, rounding and clamping", () => {
    const hourly = normalizeHourly(
      [
        { start: new Date(2026, 9, 13, 8), steps: 1200.4 },
        { start: new Date(2026, 9, 13, 8, 30), steps: 99.6 },
        { start: new Date(2026, 9, 13, 9), steps: -5 },
        { start: new Date(2026, 9, 13, 10), steps: Number.NaN },
      ],
      NOW,
    );

    expect(hourly[8].steps).toBe(1300);
    expect(hourly[9].steps).toBe(0);
    expect(hourly[10].steps).toBe(0);
  });

  it("ignores buckets from other days", () => {
    const hourly = normalizeHourly([{ start: new Date(2026, 9, 12, 23), steps: 400 }], NOW);
    expect(hourly[23].steps).toBe(0);
  });
});

describe("normalizeDaily", () => {
  it("returns `days` zero-filled days, oldest first, ending today", () => {
    const days = normalizeDaily([], 3, NOW);
    expect(days.map((d) => d.date)).toEqual([
      new Date(2026, 9, 11),
      new Date(2026, 9, 12),
      new Date(2026, 9, 13),
    ]);
    expect(days.every((d) => d.steps === 0 && d.distance === 0 && d.calories === 0)).toBe(true);
  });

  it("merges per-metric buckets into the same day", () => {
    const days = normalizeDaily(
      [
        { start: new Date(2026, 9, 13), steps: 8000 },
        { start: new Date(2026, 9, 13), distance: 6100.4 },
        { start: new Date(2026, 9, 13, 6), calories: 320.2 },
        { start: new Date(2026, 9, 11), steps: 5000 },
      ],
      3,
      NOW,
    );

    expect(days[0]).toMatchObject({ steps: 5000, distance: 0, calories: 0 });
    expect(days[1]).toMatchObject({ steps: 0, distance: 0, calories: 0 });
    expect(days[2]).toMatchObject({ steps: 8000, distance: 6100, calories: 320 });
  });

  it("ignores buckets outside the range", () => {
    const days = normalizeDaily([{ start: new Date(2026, 9, 10), steps: 999 }], 3, NOW);
    expect(days.reduce((sum, d) => sum + d.steps, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest services/health/__test__/normalize.test.ts`
Expected: FAIL, `Cannot find module '../normalize'`.

- [ ] **Step 3: Implement**

`frontend/services/health/types.ts`:
```ts
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
```

`frontend/services/health/normalize.ts`:
```ts
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
```

In the six files listed under **Modify**, replace the import path `@/services/healthKitService` with `@/services/health/types`. These are type-only imports, and the shapes are identical.

- [ ] **Step 4: Run and confirm it passes**

Run: `npx jest services/health/__test__/normalize.test.ts utils components/Statistics`
Expected: PASS. The normalize tests and all existing utils/Statistics component tests are green.

---

### Task 2: Apple Health provider

**Files:**
- Create: `frontend/services/health/providers/appleHealthProvider.ts`
- Test: `frontend/services/health/__test__/appleHealthProvider.test.ts`

**Interfaces:**
- Consumes:
  - `HealthProvider`, `HealthErrorCode`, `HealthServiceError`, raw bucket types (Task 1)
  - `parseHealthDate`, `startOfDay` (Task 1)
- Produces:
  - `class AppleHealthProvider implements HealthProvider`
  - `const appleHealthProvider: HealthProvider`

- [ ] **Step 1: Write the failing test**

`frontend/services/health/__test__/appleHealthProvider.test.ts`:
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

import { Linking } from "react-native";
import AppleHealthKit from "react-native-health";
import { AppleHealthProvider } from "../providers/appleHealthProvider";
import { HealthErrorCode, HealthServiceError } from "../types";

const kit = AppleHealthKit as unknown as Record<string, jest.Mock>;
const NOW = new Date(2026, 9, 13, 15, 30);

const respondWith = (method: string, results: unknown[]) =>
  kit[method].mockImplementation((_options: unknown, callback: Function) =>
    callback(null, results),
  );

describe("AppleHealthProvider", () => {
  let provider: AppleHealthProvider;

  beforeEach(async () => {
    jest.clearAllMocks();
    kit.initHealthKit.mockImplementation((_p: unknown, callback: Function) => callback(""));
    provider = new AppleHealthProvider();
    await provider.requestPermissions();
  });

  it("describes itself", () => {
    expect(provider.platform).toBe("apple-health");
    expect(provider.displayName).toBe("Apple Health");
  });

  it("is available on iOS when the native module exists", async () => {
    await expect(provider.getAvailability()).resolves.toBe("available");
  });

  it("reports failed initialisation as not granted", async () => {
    kit.initHealthKit.mockImplementation((_p: unknown, callback: Function) =>
      callback("Authorization denied"),
    );
    await expect(new AppleHealthProvider().requestPermissions()).resolves.toBe(false);
  });

  it("throws NOT_INITIALIZED before permissions are requested", async () => {
    await expect(new AppleHealthProvider().getHourlySteps(NOW)).rejects.toMatchObject({
      code: HealthErrorCode.NOT_INITIALIZED,
      platform: "apple-health",
    });
  });

  it("queries today's steps in 60-minute buckets", async () => {
    const eight = new Date(2026, 9, 13, 8);
    respondWith("getDailyStepCountSamples", [{ startDate: eight.toISOString(), value: 1200 }]);

    const buckets = await provider.getHourlySteps(NOW);

    expect(buckets).toEqual([{ start: eight, steps: 1200 }]);
    expect(kit.getDailyStepCountSamples).toHaveBeenCalledWith(
      expect.objectContaining({
        period: 60,
        startDate: new Date(2026, 9, 13).toISOString(),
        endDate: NOW.toISOString(),
      }),
      expect.any(Function),
    );
  });

  it("queries three metrics per day and tags each bucket with its metric", async () => {
    const day = new Date(2026, 9, 13);
    respondWith("getDailyStepCountSamples", [{ startDate: day.toISOString(), value: 8000 }]);
    respondWith("getDailyDistanceWalkingRunningSamples", [{ startDate: day.toISOString(), value: 6100 }]);
    respondWith("getActiveEnergyBurned", [{ startDate: day.toISOString(), value: 320 }]);

    const buckets = await provider.getDailyStats(3, NOW);

    expect(buckets).toEqual([
      { start: day, steps: 8000 },
      { start: day, distance: 6100 },
      { start: day, calories: 320 },
    ]);
    expect(kit.getActiveEnergyBurned).toHaveBeenCalledWith(
      expect.objectContaining({ period: 1440, startDate: new Date(2026, 9, 11).toISOString() }),
      expect.any(Function),
    );
  });

  it("rejects with FETCH_FAILED when a query fails", async () => {
    kit.getDailyStepCountSamples.mockImplementation((_o: unknown, callback: Function) =>
      callback(new Error("boom"), []),
    );

    const result = provider.getHourlySteps(NOW);

    await expect(result).rejects.toBeInstanceOf(HealthServiceError);
    await expect(result).rejects.toMatchObject({ code: HealthErrorCode.FETCH_FAILED });
  });

  it("opens the app's iOS Settings page", async () => {
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    await provider.openSettings();
    expect(openSettings).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest services/health/__test__/appleHealthProvider.test.ts`
Expected: FAIL, `Cannot find module '../providers/appleHealthProvider'`.

- [ ] **Step 3: Implement**

`frontend/services/health/providers/appleHealthProvider.ts`:
```ts
import { Linking, Platform } from "react-native";
// @ts-ignore - react-native-health's typings don't cover this import style
import AppleHealthKit, { HealthKitPermissions } from "react-native-health";
import { parseHealthDate, startOfDay } from "../normalize";
import {
  HealthAvailability,
  HealthErrorCode,
  HealthProvider,
  HealthServiceError,
  RawDailyBucket,
  RawHourlyBucket,
} from "../types";

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

export class AppleHealthProvider implements HealthProvider {
  readonly platform = "apple-health" as const;
  readonly displayName = "Apple Health";
  private isInitialized = false;

  /** HealthKit only exists in iOS builds that include the native module (not Expo Go) */
  async getAvailability(): Promise<HealthAvailability> {
    return Platform.OS === "ios" && typeof AppleHealthKit?.initHealthKit === "function"
      ? "available"
      : "unsupported";
  }

  async requestPermissions(): Promise<boolean> {
    if ((await this.getAvailability()) !== "available") {
      return false;
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error("[AppleHealth] Permission error:", error);
        }
        this.isInitialized = !error;
        resolve(!error);
      });
    });
  }

  async getHourlySteps(now: Date): Promise<RawHourlyBucket[]> {
    this.ensureInitialized();

    const samples = await this.querySamples(
      AppleHealthKit.getDailyStepCountSamples,
      startOfDay(now),
      now,
      MINUTES_PER_HOUR,
    );

    return samples.map((sample) => ({ start: parseHealthDate(sample.startDate), steps: sample.value }));
  }

  async getDailyStats(days: number, now: Date): Promise<RawDailyBucket[]> {
    this.ensureInitialized();

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

    return [
      ...steps.map((s) => ({ start: parseHealthDate(s.startDate), steps: s.value })),
      ...distance.map((s) => ({ start: parseHealthDate(s.startDate), distance: s.value })),
      ...calories.map((s) => ({ start: parseHealthDate(s.startDate), calories: s.value })),
    ];
  }

  async openSettings(): Promise<void> {
    await Linking.openSettings();
  }

  // Apple Health is part of iOS, so there is nothing to install
  async openInstallPage(): Promise<void> {}

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
              new HealthServiceError(
                HealthErrorCode.FETCH_FAILED,
                "Failed to read Apple Health data",
                this.platform,
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
      throw new HealthServiceError(
        HealthErrorCode.NOT_INITIALIZED,
        "Apple Health not initialized. Request permissions first.",
        this.platform,
      );
    }
  }
}

export const appleHealthProvider: HealthProvider = new AppleHealthProvider();
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx jest services/health/__test__/appleHealthProvider.test.ts`
Expected: PASS (8 tests).

---

### Task 3: Keep lockfiles CI-installable

**Files:**
- Create: `scripts/normalize-lockfile-registry.js` (repository root)
- Modify: `.github/workflows/ci.yaml`. Add a check step before `npm ci` in both jobs.

**Interfaces:**
- Produces: `node scripts/normalize-lockfile-registry.js [--check] <lockfile>...`. It rewrites tarball URLs on any non-public host to `https://registry.npmjs.org/`. With `--check` it changes nothing, lists the offending entries, and exits with code 1 if there are any.

- [ ] **Step 1: Write a failing check against a fixture**

Run from the repository root:
```bash
mkdir -p /tmp/lockfix && cat > /tmp/lockfix/package-lock.json <<'EOF'
{
  "name": "fixture",
  "lockfileVersion": 3,
  "packages": {
    "": { "name": "fixture" },
    "node_modules/a": { "version": "1.0.0", "resolved": "https://npm.apple.com/a/-/a-1.0.0.tgz" },
    "node_modules/@s/b": { "version": "2.0.0", "resolved": "https://artifacts.apple.com/artifactory/api/npm/npm-apple/@s/b/-/b-2.0.0.tgz" },
    "node_modules/c": { "version": "3.0.0", "resolved": "https://registry.npmjs.org/c/-/c-3.0.0.tgz" },
    "node_modules/d": { "version": "4.0.0", "resolved": "git+ssh://git@github.com/x/d.git#abc" }
  }
}
EOF
node scripts/normalize-lockfile-registry.js --check /tmp/lockfix/package-lock.json; echo "exit=$?"
```
Expected: `Cannot find module` and `exit=1`, because the script doesn't exist yet.

- [ ] **Step 2: Implement the script**

`scripts/normalize-lockfile-registry.js`:
```js
#!/usr/bin/env node
/**
 * npm records the registry it installed from in package-lock.json. Installing
 * through an internal mirror writes mirror URLs that GitHub's CI runners can't
 * reach, so `npm ci` fails there. This rewrites registry tarball URLs to the
 * public npm registry; integrity hashes are unchanged, so npm still verifies
 * every package.
 *
 * Usage: node scripts/normalize-lockfile-registry.js [--check] <package-lock.json>...
 */
const fs = require("fs");

const PUBLIC_REGISTRY = "https://registry.npmjs.org/";
const PUBLIC_HOST = "registry.npmjs.org";
// npm tarball layout: <registry prefix>/<name or @scope/name>/-/<file>.tgz
const TARBALL_URL = /^https?:\/\/.+?\/((?:@[^/]+\/)?[^/@]+\/-\/[^/]+\.tgz)$/;

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const files = args.filter((arg) => arg !== "--check");

if (files.length === 0) {
  console.error("Usage: normalize-lockfile-registry.js [--check] <package-lock.json>...");
  process.exit(2);
}

let offending = 0;

for (const file of files) {
  const lock = JSON.parse(fs.readFileSync(file, "utf8"));
  let rewritten = 0;

  for (const [path, meta] of Object.entries(lock.packages || {})) {
    const url = meta.resolved;
    if (!url || !/^https?:\/\//.test(url) || new URL(url).host === PUBLIC_HOST) continue;

    const match = url.match(TARBALL_URL);
    if (!match) continue; // not a registry tarball (e.g. a direct URL dependency)

    if (checkOnly) {
      offending++;
      console.error(`${file}: ${path} resolves from ${new URL(url).host}`);
    } else {
      meta.resolved = PUBLIC_REGISTRY + match[1];
      rewritten++;
    }
  }

  if (!checkOnly) {
    fs.writeFileSync(file, JSON.stringify(lock, null, 2) + "\n");
    console.log(`${file}: rewrote ${rewritten} URL(s) to ${PUBLIC_REGISTRY}`);
  }
}

if (checkOnly) {
  if (offending > 0) {
    console.error(
      `\n${offending} package(s) resolve from a non-public registry. ` +
        "Run: node scripts/normalize-lockfile-registry.js <lockfile>",
    );
    process.exit(1);
  }
  console.log("All lockfile URLs use the public npm registry.");
}
```

- [ ] **Step 3: Verify both modes on the fixture**

Run from the repository root:
```bash
node scripts/normalize-lockfile-registry.js --check /tmp/lockfix/package-lock.json; echo "exit=$?"
node scripts/normalize-lockfile-registry.js /tmp/lockfix/package-lock.json
grep -o '"resolved": "[^"]*"' /tmp/lockfix/package-lock.json
node scripts/normalize-lockfile-registry.js --check /tmp/lockfix/package-lock.json; echo "exit=$?"
node scripts/normalize-lockfile-registry.js --check backend/package-lock.json frontend/package-lock.json; echo "exit=$?"
rm -rf /tmp/lockfix
```
Expected:
1. Two offending lines (`node_modules/a`, `node_modules/@s/b`) and `exit=1`.
2. `rewrote 2 URL(s)`.
3. The resolved URLs are now `https://registry.npmjs.org/a/-/a-1.0.0.tgz` and `https://registry.npmjs.org/@s/b/-/b-2.0.0.tgz`; `c` is unchanged and the `git+ssh` URL is untouched.
4. The fixture check now passes with `exit=0`.
5. The real lockfiles pass with `exit=0`.

- [ ] **Step 4: Add the CI guard**

In `.github/workflows/ci.yaml`, insert this step in **both** jobs, between "Setup Node.js" and "Install dependencies":
```yaml
      - name: Check lockfile uses the public npm registry
        run: node ../scripts/normalize-lockfile-registry.js --check package-lock.json
```
Verify the YAML still parses: `ruby -ryaml -e 'YAML.load_file(".github/workflows/ci.yaml"); puts "YAML valid"'` (repository root). Expected: `YAML valid`.

---

### Task 4: Health Connect install, configuration and provider

**Files:**
- Modify: `frontend/package.json` and `frontend/package-lock.json` (install), `frontend/app.json` (plugins and permissions)
- Create: `frontend/services/health/providers/healthConnectProvider.ts`
- Test: `frontend/services/health/__test__/healthConnectProvider.test.ts`

**Interfaces:**
- Consumes: Task 1 types and normalize helpers
- Produces:
  - `class HealthConnectProvider implements HealthProvider`
  - `const healthConnectProvider: HealthProvider`
  - `HEALTH_CONNECT_PLAY_STORE_URL`

- [ ] **Step 1: Install the library and keep the lockfile public**

```bash
npm install react-native-health-connect@^4.1.3
# The library's Expo plugin requires @expo/config-plugins, which it lists only as an optional
# peer (skipped under legacy-peer-deps). Declare it at the same range expo itself depends on.
npm install -D @expo/config-plugins@~57.0.10
node ../scripts/normalize-lockfile-registry.js package-lock.json
node ../scripts/normalize-lockfile-registry.js --check package-lock.json
```
Expected: the install succeeds, any mirror URLs are rewritten, and the check prints `All lockfile URLs use the public npm registry.`

- [ ] **Step 2: Configure `app.json`**

In `frontend/app.json` under `expo`:
- Append to `plugins`:
  ```json
  "react-native-health-connect",
  ["expo-build-properties", { "android": { "minSdkVersion": 26 } }]
  ```
- Add to `android`:
  ```json
  "permissions": [
    "android.permission.health.READ_STEPS",
    "android.permission.health.READ_DISTANCE",
    "android.permission.health.READ_ACTIVE_CALORIES_BURNED"
  ]
  ```

Verify the plugin output without generating native folders:
```bash
npx expo config --type introspect --json > /tmp/introspect.json
node -e 'const s=require("fs").readFileSync("/tmp/introspect.json","utf8"); for (const k of ["READ_STEPS","READ_DISTANCE","READ_ACTIVE_CALORIES_BURNED","androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE","ViewPermissionUsageActivity"]) console.log(k, s.includes(k))'
rm /tmp/introspect.json
```
Expected: all five print `true`.

- [ ] **Step 3: Write the failing provider test**

`frontend/services/health/__test__/healthConnectProvider.test.ts`:
```ts
/* eslint-disable import/first */
jest.mock("react-native-health-connect", () => ({
  SdkAvailabilityStatus: {
    SDK_UNAVAILABLE: 1,
    SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED: 2,
    SDK_AVAILABLE: 3,
  },
  getSdkStatus: jest.fn(),
  initialize: jest.fn(),
  requestPermission: jest.fn(),
  aggregateGroupByDuration: jest.fn(),
  aggregateGroupByPeriod: jest.fn(),
  openHealthConnectSettings: jest.fn(),
}));

import { Linking } from "react-native";
import * as HealthConnect from "react-native-health-connect";
import {
  HEALTH_CONNECT_PLAY_STORE_URL,
  HealthConnectProvider,
} from "../providers/healthConnectProvider";
import { HealthErrorCode, HealthServiceError } from "../types";

const hc = HealthConnect as unknown as Record<string, jest.Mock>;
const NOW = new Date(2026, 9, 13, 15, 30);

describe("HealthConnectProvider", () => {
  let provider: HealthConnectProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    hc.initialize.mockResolvedValue(true);
    provider = new HealthConnectProvider();
  });

  it("describes itself", () => {
    expect(provider.platform).toBe("health-connect");
    expect(provider.displayName).toBe("Health Connect");
  });

  it.each([
    [3, "available"],
    [2, "updateRequired"],
    [1, "notInstalled"],
  ])("maps SDK status %i to %s", async (status, availability) => {
    hc.getSdkStatus.mockResolvedValue(status);
    await expect(provider.getAvailability()).resolves.toBe(availability);
  });

  it("is unsupported when the native module is missing", async () => {
    hc.getSdkStatus.mockRejectedValue(new Error("The package doesn't seem to be linked"));
    await expect(provider.getAvailability()).resolves.toBe("unsupported");
  });

  it("requests read access to steps, distance and active calories", async () => {
    hc.requestPermission.mockResolvedValue([{ accessType: "read", recordType: "Steps" }]);

    await expect(provider.requestPermissions()).resolves.toBe(true);
    expect(hc.initialize).toHaveBeenCalledTimes(1);
    expect(hc.requestPermission).toHaveBeenCalledWith([
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "Distance" },
      { accessType: "read", recordType: "ActiveCaloriesBurned" },
    ]);
  });

  it("is not granted without read access to steps", async () => {
    hc.requestPermission.mockResolvedValue([{ accessType: "read", recordType: "Distance" }]);
    await expect(provider.requestPermissions()).resolves.toBe(false);
  });

  it("throws NOT_INITIALIZED when Health Connect can't initialise", async () => {
    hc.initialize.mockResolvedValue(false);
    await expect(provider.getHourlySteps(NOW)).rejects.toMatchObject({
      code: HealthErrorCode.NOT_INITIALIZED,
      platform: "health-connect",
    });
  });

  it("aggregates today's steps by hour", async () => {
    const eight = new Date(2026, 9, 13, 8);
    hc.aggregateGroupByDuration.mockResolvedValue([
      { startTime: eight.toISOString(), endTime: "", result: { COUNT_TOTAL: 1200, dataOrigins: [] } },
    ]);

    const buckets = await provider.getHourlySteps(NOW);

    expect(buckets).toEqual([{ start: eight, steps: 1200 }]);
    expect(hc.aggregateGroupByDuration).toHaveBeenCalledWith({
      recordType: "Steps",
      timeRangeFilter: {
        operator: "between",
        startTime: new Date(2026, 9, 13).toISOString(),
        endTime: NOW.toISOString(),
      },
      timeRangeSlicer: { duration: "HOURS", length: 1 },
    });
  });

  it("aggregates steps, distance and active calories by day", async () => {
    hc.aggregateGroupByPeriod.mockImplementation(({ recordType }: { recordType: string }) => {
      const group = (result: object) => [{ startTime: "2026-10-13T00:00", endTime: "", result }];
      if (recordType === "Steps") return Promise.resolve(group({ COUNT_TOTAL: 8000 }));
      if (recordType === "Distance") return Promise.resolve(group({ DISTANCE: { inMeters: 6100 } }));
      return Promise.resolve(group({ ACTIVE_CALORIES_TOTAL: { inKilocalories: 320 } }));
    });

    const buckets = await provider.getDailyStats(3, NOW);

    const day = new Date(2026, 9, 13);
    expect(buckets).toEqual([
      { start: day, steps: 8000 },
      { start: day, distance: 6100 },
      { start: day, calories: 320 },
    ]);
    expect(hc.aggregateGroupByPeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        recordType: "ActiveCaloriesBurned",
        timeRangeFilter: expect.objectContaining({ startTime: new Date(2026, 9, 11).toISOString() }),
        timeRangeSlicer: { period: "DAYS", length: 1 },
      }),
    );
  });

  it("wraps query failures as FETCH_FAILED", async () => {
    hc.aggregateGroupByDuration.mockRejectedValue(new Error("SecurityException"));

    const result = provider.getHourlySteps(NOW);

    await expect(result).rejects.toBeInstanceOf(HealthServiceError);
    await expect(result).rejects.toMatchObject({ code: HealthErrorCode.FETCH_FAILED });
  });

  it("opens Health Connect settings and its Play Store page", async () => {
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

    await provider.openSettings();
    await provider.openInstallPage();

    expect(hc.openHealthConnectSettings).toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(HEALTH_CONNECT_PLAY_STORE_URL);
  });
});
```

- [ ] **Step 4: Run it and confirm it fails**

Run: `npx jest services/health/__test__/healthConnectProvider.test.ts`
Expected: FAIL, `Cannot find module '../providers/healthConnectProvider'`.

- [ ] **Step 5: Implement**

`frontend/services/health/providers/healthConnectProvider.ts`:
```ts
import { Linking } from "react-native";
import type { Permission } from "react-native-health-connect";
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

    const [steps, distance, calories] = await this.run(() =>
      Promise.all([
        healthConnect.aggregateGroupByPeriod({ recordType: "Steps", timeRangeFilter, timeRangeSlicer }),
        healthConnect.aggregateGroupByPeriod({ recordType: "Distance", timeRangeFilter, timeRangeSlicer }),
        healthConnect.aggregateGroupByPeriod({
          recordType: "ActiveCaloriesBurned",
          timeRangeFilter,
          timeRangeSlicer,
        }),
      ]),
    );

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

  private async run<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
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
```

- [ ] **Step 6: Run and confirm it passes**

Run: `npx jest services/health/__test__/healthConnectProvider.test.ts`
Expected: PASS (12 tests).

---

### Task 5: Mock and unsupported providers, platform selection, facade

**Files:**
- Create:
  - `frontend/services/health/providers/mockProvider.ts`
  - `frontend/services/health/providers/unsupportedProvider.ts`
  - `frontend/services/health/providers/index.ios.ts`
  - `frontend/services/health/providers/index.android.ts`
  - `frontend/services/health/providers/index.ts`
  - `frontend/services/health/healthService.ts`
- Test: `frontend/services/health/__test__/healthService.test.ts`

**Interfaces:**
- Consumes:
  - Tasks 1, 2 and 4
  - `generateMockHealth(now, days)` from `@/utils/mockHealthData`
- Produces:
  - Providers:
    - `mockProvider: HealthProvider`
    - `unsupportedProvider: HealthProvider`
    - `nativeProvider: HealthProvider`, exported by `./providers` per platform
  - `class HealthService` and the `healthService` singleton, with:
    - `platform`, `displayName` (getters)
    - `getAvailability()`
    - `requestPermissions()`
    - `connect(): Promise<void>`. Throws `UNSUPPORTED_PLATFORM`, `NOT_INSTALLED`, `UPDATE_REQUIRED` or `PERMISSION_DENIED`.
    - `getHourlySteps(now?)` → `HourlySteps[]`
    - `getDailyStats(days, now?)` → `HealthData[]`
    - `openSettings()`, `openInstallPage()`

- [ ] **Step 1: Write the failing test**

`frontend/services/health/__test__/healthService.test.ts`:
```ts
/* eslint-disable import/first */
// The fake lives inside the factory: jest hoists jest.mock above every other statement
jest.mock("../providers", () => ({
  nativeProvider: {
    platform: "apple-health",
    displayName: "Apple Health",
    getAvailability: jest.fn(),
    requestPermissions: jest.fn(),
    getHourlySteps: jest.fn(),
    getDailyStats: jest.fn(),
    openSettings: jest.fn(),
    openInstallPage: jest.fn(),
  },
}));

import { nativeProvider } from "../providers";
import { HealthService } from "../healthService";
import { HealthErrorCode, HealthServiceError } from "../types";

const mockNative = nativeProvider as unknown as Record<string, jest.Mock>;

const NOW = new Date(2026, 9, 13, 15, 30);

describe("HealthService", () => {
  const originalEnv = process.env.EXPO_PUBLIC_USE_MOCK_HEALTH;
  let service: HealthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new HealthService();
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_USE_MOCK_HEALTH = originalEnv;
  });

  describe("mock mode (default)", () => {
    beforeEach(() => {
      delete process.env.EXPO_PUBLIC_USE_MOCK_HEALTH;
    });

    it("uses demo data and never touches the native provider", async () => {
      await service.connect();
      const hourly = await service.getHourlySteps(NOW);
      const days = await service.getDailyStats(30, NOW);

      expect(service.platform).toBe("mock");
      expect(service.displayName).toBe("Demo data");
      expect(hourly).toHaveLength(24);
      expect(days).toHaveLength(30);
      expect(days[29].steps).toBe(hourly.reduce((sum, h) => sum + h.steps, 0));
      expect(mockNative.getAvailability).not.toHaveBeenCalled();
    });
  });

  describe("native mode", () => {
    beforeEach(() => {
      process.env.EXPO_PUBLIC_USE_MOCK_HEALTH = "false";
      mockNative.getAvailability.mockResolvedValue("available");
      mockNative.requestPermissions.mockResolvedValue(true);
    });

    it("exposes the native provider's identity", () => {
      expect(service.platform).toBe("apple-health");
      expect(service.displayName).toBe("Apple Health");
    });

    it.each([
      ["unsupported", HealthErrorCode.UNSUPPORTED_PLATFORM],
      ["notInstalled", HealthErrorCode.NOT_INSTALLED],
      ["updateRequired", HealthErrorCode.UPDATE_REQUIRED],
    ])("connect() turns availability %s into %s", async (availability, code) => {
      mockNative.getAvailability.mockResolvedValue(availability);

      await expect(service.connect()).rejects.toMatchObject({ code, platform: "apple-health" });
      expect(mockNative.requestPermissions).not.toHaveBeenCalled();
    });

    it("connect() throws PERMISSION_DENIED when access isn't granted", async () => {
      mockNative.requestPermissions.mockResolvedValue(false);
      await expect(service.connect()).rejects.toMatchObject({
        code: HealthErrorCode.PERMISSION_DENIED,
      });
    });

    it("asks for permission only once per session once granted", async () => {
      await service.connect();
      await service.connect();

      expect(mockNative.requestPermissions).toHaveBeenCalledTimes(1);
    });

    it("asks again after a refusal", async () => {
      mockNative.requestPermissions.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

      await expect(service.connect()).rejects.toBeInstanceOf(HealthServiceError);
      await service.connect();

      expect(mockNative.requestPermissions).toHaveBeenCalledTimes(2);
    });

    it("normalises provider buckets", async () => {
      mockNative.getHourlySteps.mockResolvedValue([{ start: new Date(2026, 9, 13, 8), steps: 10.6 }]);
      mockNative.getDailyStats.mockResolvedValue([{ start: new Date(2026, 9, 13), steps: 5000 }]);

      const hourly = await service.getHourlySteps(NOW);
      const days = await service.getDailyStats(7, NOW);

      expect(hourly).toHaveLength(24);
      expect(hourly[8].steps).toBe(11);
      expect(days).toHaveLength(7);
      expect(days[6]).toMatchObject({ steps: 5000, distance: 0, calories: 0 });
      expect(mockNative.getDailyStats).toHaveBeenCalledWith(7, NOW);
    });

    it.each([0, -3, 2.5])("rejects %p days with INVALID_RANGE", async (days) => {
      await expect(service.getDailyStats(days, NOW)).rejects.toMatchObject({
        code: HealthErrorCode.INVALID_RANGE,
      });
      expect(mockNative.getDailyStats).not.toHaveBeenCalled();
    });

    it("keeps provider errors as they are", async () => {
      const original = new HealthServiceError(
        HealthErrorCode.NOT_INITIALIZED,
        "not ready",
        "apple-health",
      );
      mockNative.getHourlySteps.mockRejectedValue(original);

      await expect(service.getHourlySteps(NOW)).rejects.toBe(original);
    });

    it("wraps unknown errors as FETCH_FAILED and keeps the original", async () => {
      const boom = new Error("boom");
      mockNative.getHourlySteps.mockRejectedValue(boom);

      await expect(service.getHourlySteps(NOW)).rejects.toMatchObject({
        code: HealthErrorCode.FETCH_FAILED,
        platform: "apple-health",
        originalError: boom,
      });
    });

    it("delegates settings and install actions", async () => {
      await service.openSettings();
      await service.openInstallPage();

      expect(mockNative.openSettings).toHaveBeenCalled();
      expect(mockNative.openInstallPage).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest services/health/__test__/healthService.test.ts`
Expected: FAIL, `Cannot find module '../providers'`.

- [ ] **Step 3: Implement**

`frontend/services/health/providers/mockProvider.ts`:
```ts
import { generateMockHealth } from "@/utils/mockHealthData";
import { startOfDay } from "../normalize";
import type { HealthProvider } from "../types";

/** Deterministic demo data, so the Statistics screen works in Expo Go and on the web */
export const mockProvider: HealthProvider = {
  platform: "mock",
  displayName: "Demo data",

  getAvailability: async () => "available",

  requestPermissions: async () => true,

  getHourlySteps: async (now) => {
    const today = startOfDay(now);
    return generateMockHealth(now).hourly.map(({ hour, steps }) => ({
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour),
      steps,
    }));
  },

  getDailyStats: async (days, now) =>
    generateMockHealth(now, days).month.map(({ date, steps, distance, calories }) => ({
      start: date,
      steps,
      distance,
      calories,
    })),

  openSettings: async () => {},

  openInstallPage: async () => {},
};
```

`frontend/services/health/providers/unsupportedProvider.ts`:
```ts
import { HealthErrorCode, HealthProvider, HealthServiceError } from "../types";

const unsupported = () =>
  Promise.reject(
    new HealthServiceError(
      HealthErrorCode.UNSUPPORTED_PLATFORM,
      "Health data is not available on this platform",
      "unsupported",
    ),
  );

/** Used where no native health platform exists (web) */
export const unsupportedProvider: HealthProvider = {
  platform: "unsupported",
  displayName: "Health data",
  getAvailability: async () => "unsupported",
  requestPermissions: async () => false,
  getHourlySteps: unsupported,
  getDailyStats: unsupported,
  openSettings: async () => {},
  openInstallPage: async () => {},
};
```

`frontend/services/health/providers/index.ios.ts`:
```ts
export { appleHealthProvider as nativeProvider } from "./appleHealthProvider";
```

`frontend/services/health/providers/index.android.ts`:
```ts
export { healthConnectProvider as nativeProvider } from "./healthConnectProvider";
```

`frontend/services/health/providers/index.ts`:
```ts
// Metro picks index.ios.ts / index.android.ts on those platforms; everything else lands here
export { unsupportedProvider as nativeProvider } from "./unsupportedProvider";
```

`frontend/services/health/healthService.ts`:
```ts
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
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx jest services/health`
Expected: PASS. Every `services/health` suite is green (normalize, both providers, facade).

---

### Task 6: Move `useHealthData` to the facade

**Files:**
- Modify (rewrite): `frontend/hooks/useHealthData.ts`, `frontend/hooks/__test__/useHealthData.test.ts`
- Delete: `frontend/services/healthKitService.ts`, `frontend/services/__test__/healthKitService.test.ts`. The Task 2 provider and its test replace them.

**Interfaces:**
- Consumes: `healthService` (Task 5); `HealthServiceError`, `HealthErrorCode`, `HealthData`, `HourlySteps` (Task 1)
- Produces:
  - `type HealthStatus = "loading" | "ready" | "unavailable" | "notInstalled" | "denied" | "error"`
  - `UseHealthDataReturn` gains `providerName: string`, `openSettings: () => Promise<void>` and `openInstallPage: () => Promise<void>`. All other fields are unchanged from #65.

- [ ] **Step 1: Write the failing test**

Replace `frontend/hooks/__test__/useHealthData.test.ts`:
```ts
/* eslint-disable import/first */
jest.mock("@/services/health/healthService", () => ({
  healthService: {
    displayName: "Apple Health",
    connect: jest.fn(),
    getHourlySteps: jest.fn(),
    getDailyStats: jest.fn(),
    openSettings: jest.fn(),
    openInstallPage: jest.fn(),
  },
}));

import { act, renderHook, waitFor } from "@testing-library/react-native";
import { healthService } from "@/services/health/healthService";
import { HealthErrorCode, HealthServiceError } from "@/services/health/types";
import { useHealthData } from "../useHealthData";

const service = healthService as jest.Mocked<typeof healthService>;

const days = (stepsList: number[]) =>
  stepsList.map((steps, index) => ({
    steps,
    distance: steps * 0.75,
    calories: steps * 0.04,
    date: new Date(2026, 9, index + 1),
  }));

const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, steps: hour === 9 ? 500 : 0 }));

const failWith = (code: HealthErrorCode) =>
  new HealthServiceError(code, code, "apple-health");

describe("useHealthData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.connect.mockResolvedValue(undefined);
    service.getHourlySteps.mockResolvedValue(hourly);
    service.getDailyStats.mockResolvedValue(days([...Array(28).fill(6000), 8000, 12000]));
  });

  it("derives today, week, summaries, trends and streak", async () => {
    const { result } = renderHook(() => useHealthData());

    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(service.getDailyStats).toHaveBeenCalledWith(30);
    expect(result.current.today?.steps).toBe(12000);
    expect(result.current.yesterday?.steps).toBe(8000);
    expect(result.current.week).toHaveLength(7);
    expect(result.current.weekSummary?.totalSteps).toBe(5 * 6000 + 8000 + 12000);
    expect(result.current.trends.steps).toBe(50);
    expect(result.current.streak).toBe(30);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it.each([
    [HealthErrorCode.UNSUPPORTED_PLATFORM, "unavailable"],
    [HealthErrorCode.NOT_INSTALLED, "notInstalled"],
    [HealthErrorCode.UPDATE_REQUIRED, "notInstalled"],
    [HealthErrorCode.PERMISSION_DENIED, "denied"],
  ])("maps %s to the %s status", async (code, status) => {
    service.connect.mockRejectedValue(failWith(code));
    const { result } = renderHook(() => useHealthData());

    await waitFor(() => expect(result.current.status).toBe(status));
    expect(result.current.error).toBeNull();
  });

  it("shows the error state when the first load fails", async () => {
    service.getDailyStats.mockRejectedValue(failWith(HealthErrorCode.FETCH_FAILED));
    const { result } = renderHook(() => useHealthData());

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toBe(HealthErrorCode.FETCH_FAILED);
  });

  it("keeps the last data when a refresh fails", async () => {
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    service.getDailyStats.mockRejectedValue(new Error("offline"));
    await act(() => result.current.refresh());

    expect(result.current.status).toBe("ready");
    expect(result.current.error?.message).toBe("offline");
    expect(result.current.today?.steps).toBe(12000);
    expect(result.current.refreshing).toBe(false);
  });

  it("exposes the provider name and its actions", async () => {
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.providerName).toBe("Apple Health");

    await act(() => result.current.openSettings());
    await act(() => result.current.openInstallPage());

    expect(service.openSettings).toHaveBeenCalled();
    expect(service.openInstallPage).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx jest hooks/__test__/useHealthData.test.ts`
Expected: FAIL. The hook still imports `healthKitService` and has no `providerName`.

- [ ] **Step 3: Implement**

Replace `frontend/hooks/useHealthData.ts`:
```ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { healthService } from "@/services/health/healthService";
import {
  HealthData,
  HealthErrorCode,
  HealthServiceError,
  HourlySteps,
} from "@/services/health/types";
import {
  compareDays,
  currentStreak,
  HealthSummary,
  HealthTrends,
  summarize,
} from "@/utils/healthStats";

export type HealthStatus =
  | "loading"
  | "ready"
  | "unavailable"
  | "notInstalled"
  | "denied"
  | "error";

export interface UseHealthDataReturn {
  status: HealthStatus;
  error: Error | null;
  providerName: string;
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
  openSettings: () => Promise<void>;
  openInstallPage: () => Promise<void>;
}

interface HealthSnapshot {
  hourly: HourlySteps[];
  month: HealthData[];
}

const MONTH_DAYS = 30;
const WEEK_DAYS = 7;

// Errors that mean "the user has to do something" rather than "something broke"
const STATUS_BY_CODE: Partial<Record<HealthErrorCode, HealthStatus>> = {
  [HealthErrorCode.UNSUPPORTED_PLATFORM]: "unavailable",
  [HealthErrorCode.NOT_INSTALLED]: "notInstalled",
  [HealthErrorCode.UPDATE_REQUIRED]: "notInstalled",
  [HealthErrorCode.PERMISSION_DENIED]: "denied",
};

const loadSnapshot = async (): Promise<HealthSnapshot> => {
  await healthService.connect();

  const [hourly, month] = await Promise.all([
    healthService.getHourlySteps(),
    healthService.getDailyStats(MONTH_DAYS),
  ]);

  return { hourly, month };
};

export const useHealthData = (): UseHealthDataReturn => {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasData = useRef(false);

  const applySnapshot = useCallback((next: HealthSnapshot) => {
    hasData.current = true;
    setSnapshot(next);
    setError(null);
    setStatus("ready");
    setLastUpdated(new Date());
  }, []);

  const applyError = useCallback((err: unknown) => {
    const accessStatus = err instanceof HealthServiceError ? STATUS_BY_CODE[err.code] : undefined;
    if (accessStatus) {
      setStatus(accessStatus);
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
    [applySnapshot, applyError],
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openSettings = useCallback(() => healthService.openSettings(), []);
  const openInstallPage = useCallback(() => healthService.openInstallPage(), []);

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

  return {
    status,
    error,
    providerName: healthService.displayName,
    refreshing,
    lastUpdated,
    refresh,
    openSettings,
    openInstallPage,
    ...derived,
  };
};
```

Delete the replaced files:
```bash
git rm services/healthKitService.ts services/__test__/healthKitService.test.ts
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx jest hooks/__test__/useHealthData.test.ts services`
Expected: PASS. The hook suite and all `services` suites are green, and no test references `healthKitService`.

---

### Task 7: Provider-aware Statistics UI

**Files:**
- Modify:
  - `frontend/components/Statistics/ErrorState.tsx` (adds the `notInstalled` variant, provider copy and action callbacks)
  - `frontend/components/Statistics/EmptyState.tsx` (provider copy)
  - `frontend/components/Statistics/StatisticsHeader.tsx` (provider copy)
  - `frontend/screens/StatisticsScreen.tsx` (passes the provider name and actions)
- Modify tests:
  - `frontend/components/Statistics/__test__/States.test.tsx`
  - `frontend/components/Statistics/__test__/StatisticsCards.test.tsx` (header render)
  - `frontend/screens/__test__/StatisticsScreen.test.tsx`

**Interfaces:**
- Consumes: `UseHealthDataReturn` (Task 6)
- Produces:
  - `type ErrorVariant = "denied" | "unavailable" | "notInstalled" | "error"`
  - `ErrorState({ variant; providerName; error?; onRetry; onOpenSettings; onInstall; retrying? })`
  - `EmptyState({ providerName; onRefresh; refreshing })`
  - `StatisticsHeader({ lastUpdated; providerName })`

- [ ] **Step 1: Update the tests first**

Replace `frontend/components/Statistics/__test__/States.test.tsx`:
```tsx
import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithTheme } from "./renderWithTheme";
import { LoadingState } from "../LoadingState";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";

const actions = () => ({ onRetry: jest.fn(), onOpenSettings: jest.fn(), onInstall: jest.fn() });

describe("LoadingState", () => {
  it("renders an accessible skeleton", () => {
    const { getByTestId, getByLabelText } = renderWithTheme(<LoadingState />);
    expect(getByTestId("statistics-loading")).toBeTruthy();
    expect(getByLabelText("Loading statistics")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("names the provider and refreshes", () => {
    const onRefresh = jest.fn();
    const { getByText } = renderWithTheme(
      <EmptyState providerName="Health Connect" onRefresh={onRefresh} refreshing={false} />,
    );

    expect(getByText("No activity yet")).toBeTruthy();
    expect(getByText(/in Health Connect for the last 30 days/)).toBeTruthy();

    fireEvent.press(getByText("Refresh"));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("ErrorState", () => {
  it("opens the provider's settings when access is denied", () => {
    const handlers = actions();
    const { getByText } = renderWithTheme(
      <ErrorState variant="denied" providerName="Health Connect" {...handlers} />,
    );

    expect(getByText("Health access needed")).toBeTruthy();
    expect(getByText(/in Health Connect/)).toBeTruthy();
    fireEvent.press(getByText("Open Settings"));

    expect(handlers.onOpenSettings).toHaveBeenCalled();
    expect(handlers.onRetry).not.toHaveBeenCalled();
  });

  it("offers to install Health Connect", () => {
    const handlers = actions();
    const { getByText } = renderWithTheme(
      <ErrorState variant="notInstalled" providerName="Health Connect" {...handlers} />,
    );

    expect(getByText("Health Connect is required")).toBeTruthy();
    fireEvent.press(getByText("Get Health Connect"));
    expect(handlers.onInstall).toHaveBeenCalled();
  });

  it("explains an unavailable provider, without an action", () => {
    const { getByText, queryByText } = renderWithTheme(
      <ErrorState variant="unavailable" providerName="Apple Health" {...actions()} />,
    );

    expect(getByText("Apple Health isn't available")).toBeTruthy();
    expect(queryByText("Try again")).toBeNull();
  });

  it("retries after an error", () => {
    const handlers = actions();
    const { getByText } = renderWithTheme(
      <ErrorState
        variant="error"
        providerName="Apple Health"
        error={new Error("boom")}
        {...handlers}
      />,
    );

    expect(getByText(/while reading Apple Health/)).toBeTruthy();
    fireEvent.press(getByText("Try again"));
    expect(handlers.onRetry).toHaveBeenCalledTimes(1);
  });
});
```

In `frontend/components/Statistics/__test__/StatisticsCards.test.tsx`, change the header test render to:
```tsx
    const { getByText } = renderWithTheme(
      <StatisticsHeader lastUpdated={new Date()} providerName="Apple Health" />,
    );
```
and add a test after it:
```tsx
  it("names the provider before the first update", () => {
    const { getByText } = renderWithTheme(
      <StatisticsHeader lastUpdated={null} providerName="Health Connect" />,
    );
    expect(getByText("Your activity from Health Connect")).toBeTruthy();
  });
```

In `frontend/screens/__test__/StatisticsScreen.test.tsx`:
- In `healthState`, add these fields before `...overrides`:
  ```ts
      providerName: "Apple Health",
      openSettings: jest.fn().mockResolvedValue(undefined),
      openInstallPage: jest.fn().mockResolvedValue(undefined),
  ```
- Add this test after "shows the unavailable state":
  ```tsx
    it("offers to install Health Connect when it's missing", () => {
      const state = healthState({ status: "notInstalled", providerName: "Health Connect" });
      mockedUseHealthData.mockReturnValue(state);
      const { getByText } = renderWithTheme(<StatisticsScreen />);

      fireEvent.press(getByText("Get Health Connect"));
      expect(state.openInstallPage).toHaveBeenCalled();
    });
  ```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx jest components/Statistics screens`
Expected: FAIL. There's no `notInstalled` copy or `onInstall`/`onOpenSettings` props, and the copy still says "Apple Health".

- [ ] **Step 3: Implement**

Replace `frontend/components/Statistics/ErrorState.tsx`:
```tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { CustomText } from "../CustomText";
import { PrimaryButton } from "../Button";
import { ScreenContainer } from "../ScreenContainer";

export type ErrorVariant = "denied" | "unavailable" | "notInstalled" | "error";

interface ErrorStateProps {
  variant: ErrorVariant;
  providerName: string;
  error?: Error | null;
  onRetry: () => void;
  onOpenSettings: () => void;
  onInstall: () => void;
  retrying?: boolean;
}

interface Copy {
  icon: string;
  title: string;
  message: string;
  action?: string;
}

const getCopy = (variant: ErrorVariant, providerName: string): Copy => {
  switch (variant) {
    case "denied":
      return {
        icon: "lock-closed-outline",
        title: "Health access needed",
        message: `Allow WalkIt to read your steps, walking distance and active energy in ${providerName} so we can show your statistics.`,
        action: "Open Settings",
      };
    case "notInstalled":
      return {
        icon: "download-outline",
        title: "Health Connect is required",
        message:
          "WalkIt reads your activity through Health Connect. Install or update it from the Play Store, then come back and try again.",
        action: "Get Health Connect",
      };
    case "unavailable":
      return {
        icon: "phone-portrait-outline",
        title: `${providerName} isn't available`,
        message:
          "Health data isn't available on this device or in this version of the app. Use the WalkIt app on iPhone (Apple Health) or Android (Health Connect).",
      };
    case "error":
      return {
        icon: "alert-circle-outline",
        title: "Couldn't load your statistics",
        message: `Something went wrong while reading ${providerName}. Please try again.`,
        action: "Try again",
      };
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  variant,
  providerName,
  error,
  onRetry,
  onOpenSettings,
  onInstall,
  retrying,
}) => {
  const theme = useTheme();
  const copy = getCopy(variant, providerName);
  const handleAction =
    variant === "denied" ? onOpenSettings : variant === "notInstalled" ? onInstall : onRetry;

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

In `frontend/components/Statistics/EmptyState.tsx`:
- Change the props interface to:
  ```ts
  interface EmptyStateProps {
    providerName: string;
    onRefresh: () => void;
    refreshing: boolean;
  }
  ```
- Destructure `({ providerName, onRefresh, refreshing })`.
- Replace the message expression with:
  ```tsx
            {`We couldn't find any steps, distance or calories in ${providerName} for the last 30 days.`}
  ```
- Replace the tip text with:
  ```tsx
            {`Make sure your phone is recording activity and that WalkIt has permission to read it in ${providerName}.`}
  ```

In `frontend/components/Statistics/StatisticsHeader.tsx`:
- Add `providerName: string;` to the props.
- Destructure `({ lastUpdated, providerName })`.
- Replace `"Your activity from Apple Health"` with `` `Your activity from ${providerName}` ``.

In `frontend/screens/StatisticsScreen.tsx`:
- Add `providerName`, `openSettings` and `openInstallPage` to the `useHealthData()` destructuring.
- Make these replacements:
  ```tsx
  return (
    <ErrorState
      variant={status}
      providerName={providerName}
      error={error}
      onRetry={refresh}
      onOpenSettings={openSettings}
      onInstall={openInstallPage}
      retrying={refreshing}
    />
  );
  ```
  ```tsx
  return <EmptyState providerName={providerName} onRefresh={refresh} refreshing={refreshing} />;
  ```
  ```tsx
  <StatisticsHeader lastUpdated={lastUpdated} providerName={providerName} />
  ```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx jest components/Statistics screens`
Expected: PASS.

---

### Task 8: Full verification

- [ ] **Step 1: No references to the old service**

Run: `grep -rn "healthKitService" app components hooks screens services utils`
Expected: no output.

- [ ] **Step 2: Typecheck, tests, lint**

```bash
npx tsc --noEmit 2>&1 | grep -v "^app-example" | grep "error TS"
npx jest --ci
npx eslint app components hooks screens services utils
```
Expected: no TypeScript errors, all suites pass, 0 ESLint errors.

- [ ] **Step 3: Both platform bundles build**

```bash
npx expo export --platform ios --output-dir /tmp/walkit-export-ios
npx expo export --platform android --output-dir /tmp/walkit-export-android
grep -l "Health Connect could not be initialized" /tmp/walkit-export-android/_expo/static/js/android/*.hbc >/dev/null && echo "android bundle has Health Connect provider"
grep -l "Health Connect could not be initialized" /tmp/walkit-export-ios/_expo/static/js/ios/*.hbc >/dev/null || echo "ios bundle excludes Health Connect provider"
rm -rf /tmp/walkit-export-ios /tmp/walkit-export-android
```
Expected: both exports print `Exported`, followed by `android bundle has Health Connect provider` and `ios bundle excludes Health Connect provider`. This proves the platform files are chosen automatically.

- [ ] **Step 4: Lockfiles stay public**

Run (repository root): `node scripts/normalize-lockfile-registry.js --check backend/package-lock.json frontend/package-lock.json`
Expected: `All lockfile URLs use the public npm registry.`

- [ ] **Step 5: Manual check (user)**

Requires development builds, because native modules aren't in Expo Go:
- **Android:** a device or emulator with Health Connect. Set `EXPO_PUBLIC_USE_MOCK_HEALTH=false` in `frontend/.env`, then run `npx expo run:android` (or `eas build --profile development --platform android`).
  - Open Statistics, grant the three permissions and see real data.
  - Revoking permission in Health Connect shows "Open Settings".
  - On a device without Health Connect (Android 8–13) you see "Get Health Connect".
- **iOS:** the same with `npx expo run:ios`.
