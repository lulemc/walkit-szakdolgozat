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
