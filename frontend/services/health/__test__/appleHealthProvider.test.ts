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
