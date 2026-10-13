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
