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
