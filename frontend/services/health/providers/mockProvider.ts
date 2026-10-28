import i18n from "@/i18n";
import { generateMockHealth } from "@/utils/mockHealthData";
import { startOfDay } from "../normalize";
import type { HealthProvider } from "../types";

/** Deterministic demo data, so the Statistics screen works in Expo Go and on the web */
export const mockProvider: HealthProvider = {
  platform: "mock",
  // A getter, so the name follows the app language
  get displayName() {
    return i18n.t("statistics:provider.demo");
  },

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
