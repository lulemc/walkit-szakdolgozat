import i18n from "@/i18n";
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
  // A getter, so the name follows the app language
  get displayName() {
    return i18n.t("statistics:provider.unsupported");
  },
  getAvailability: async () => "unsupported",
  requestPermissions: async () => false,
  getHourlySteps: unsupported,
  getDailyStats: unsupported,
  openSettings: async () => {},
  openInstallPage: async () => {},
};
