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
