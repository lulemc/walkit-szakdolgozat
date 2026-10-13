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

import { AppState } from "react-native";
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
  let appStateHandler: (state: string) => void;
  const subscription = { remove: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, handler) => {
      appStateHandler = handler as (state: string) => void;
      return subscription;
    });
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

  const foreground = () =>
    act(async () => {
      appStateHandler("active");
    });

  it("does not reload on foreground unless the user left through openSettings", async () => {
    service.connect.mockRejectedValue(failWith(HealthErrorCode.PERMISSION_DENIED));
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("denied"));
    expect(service.connect).toHaveBeenCalledTimes(1);

    await foreground();

    expect(service.connect).toHaveBeenCalledTimes(1);
  });

  it("reloads once after returning from Settings", async () => {
    service.connect.mockRejectedValueOnce(failWith(HealthErrorCode.PERMISSION_DENIED));
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("denied"));

    await act(() => result.current.openSettings());
    await foreground();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(service.connect).toHaveBeenCalledTimes(2);

    service.connect.mockRejectedValue(failWith(HealthErrorCode.PERMISSION_DENIED));
    await foreground();

    expect(service.connect).toHaveBeenCalledTimes(2);
  });

  it("reloads after returning from the Play Store", async () => {
    service.connect.mockRejectedValueOnce(failWith(HealthErrorCode.NOT_INSTALLED));
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("notInstalled"));

    await act(() => result.current.openInstallPage());
    await foreground();

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(service.connect).toHaveBeenCalledTimes(2);
  });

  it("never overlaps loads", async () => {
    service.connect.mockRejectedValueOnce(failWith(HealthErrorCode.PERMISSION_DENIED));
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("denied"));

    let release: () => void = () => {};
    service.connect.mockReturnValueOnce(new Promise<void>((resolve) => (release = resolve)));
    await act(() => result.current.openSettings());
    await foreground();
    await foreground();
    await act(async () => {
      result.current.refresh();
    });

    expect(service.connect).toHaveBeenCalledTimes(2);

    await act(async () => release());
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("does not reload on foreground while ready", async () => {
    const { result } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(service.getDailyStats).toHaveBeenCalledTimes(1);

    await act(async () => {
      appStateHandler("active");
    });

    expect(service.getDailyStats).toHaveBeenCalledTimes(1);
  });

  it("stops listening to app state on unmount", async () => {
    const { result, unmount } = renderHook(() => useHealthData());
    await waitFor(() => expect(result.current.status).toBe("ready"));

    unmount();

    expect(subscription.remove).toHaveBeenCalled();
  });
});
