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
