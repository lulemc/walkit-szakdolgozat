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
  getGrantedPermissions: jest.fn(),
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
    hc.getGrantedPermissions.mockResolvedValue([
      { accessType: "read", recordType: "Steps" },
      { accessType: "read", recordType: "Distance" },
      { accessType: "read", recordType: "ActiveCaloriesBurned" },
    ]);
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

  it("returns real steps and skips the metrics that weren't granted", async () => {
    hc.getGrantedPermissions.mockResolvedValue([
      { accessType: "read", recordType: "Steps" },
      { accessType: "write", recordType: "Distance" },
    ]);
    hc.aggregateGroupByPeriod.mockResolvedValue([
      { startTime: "2026-10-13T00:00", endTime: "", result: { COUNT_TOTAL: 8000 } },
    ]);

    const buckets = await provider.getDailyStats(3, NOW);

    expect(hc.aggregateGroupByPeriod).toHaveBeenCalledTimes(1);
    expect(hc.aggregateGroupByPeriod).toHaveBeenCalledWith(
      expect.objectContaining({ recordType: "Steps" }),
    );
    expect(buckets).toEqual([{ start: new Date(2026, 9, 13), steps: 8000 }]);
  });

  it.each([
    ["hourly steps", (p: HealthConnectProvider) => p.getHourlySteps(NOW)],
    ["daily stats", (p: HealthConnectProvider) => p.getDailyStats(3, NOW)],
  ])("rejects %s with PERMISSION_DENIED when steps access is gone", async (_name, read) => {
    hc.getGrantedPermissions.mockResolvedValue([{ accessType: "read", recordType: "Distance" }]);

    await expect(read(provider)).rejects.toMatchObject({
      code: HealthErrorCode.PERMISSION_DENIED,
      platform: "health-connect",
    });
    expect(hc.aggregateGroupByDuration).not.toHaveBeenCalled();
    expect(hc.aggregateGroupByPeriod).not.toHaveBeenCalled();
  });

  it("maps a PERMISSION_ERROR from the library to PERMISSION_DENIED", async () => {
    hc.aggregateGroupByDuration.mockRejectedValue(
      Object.assign(new Error("SecurityException"), { code: "PERMISSION_ERROR" }),
    );

    await expect(provider.getHourlySteps(NOW)).rejects.toMatchObject({
      code: HealthErrorCode.PERMISSION_DENIED,
    });
  });

  it("wraps query failures as FETCH_FAILED", async () => {
    hc.aggregateGroupByDuration.mockRejectedValue(new Error("boom"));

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
