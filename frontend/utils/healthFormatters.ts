import i18n from "@/i18n";

/**
 * Format distance from meters to km with 1 decimal
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Format calories to nearest integer
 */
export const formatCalories = (calories: number): string => {
  return `${Math.round(calories)} kcal`;
};

/**
 * Format steps with thousand separators
 */
export const formatSteps = (steps: number): string => {
  return steps.toLocaleString();
};

/**
 * Calculate percentage for progress bar
 */
export const calculateProgress = (current: number, goal: number): number => {
  if (goal === 0) return 0;
  return Math.min((current / goal) * 100, 100);
};

/**
 * Get motivational message based on calories
 */
export const getCalorieMessage = (calories: number): string => {
  if (calories === 0) return i18n.t("statistics:calorieMessage.none");
  if (calories < 100) return i18n.t("statistics:calorieMessage.start");
  if (calories < 300) return i18n.t("statistics:calorieMessage.great");
  if (calories < 500) return i18n.t("statistics:calorieMessage.awesome");
  return i18n.t("statistics:calorieMessage.amazing");
};

/**
 * Calculate trend percentage between two values
 */
export const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format trend as string with arrow
 */
export const formatTrend = (trendPercentage: number): string => {
  const arrow = trendPercentage > 0 ? '↗' : trendPercentage < 0 ? '↘' : '→';
  const value = Math.abs(Math.round(trendPercentage));
  const sign = trendPercentage > 0 ? '+' : '';
  
  return `${arrow} ${sign}${value}%`;
};

/**
 * Get day of week abbreviation in the app's language ("Mon")
 */
export const getDayAbbreviation = (date: Date): string =>
  date.toLocaleDateString(i18n.language, { weekday: "short" });

/**
 * Get short month name in the app's language ("Dec")
 */
export const getMonthName = (date: Date): string =>
  date.toLocaleDateString(i18n.language, { month: "short" });

/**
 * Format date in the app's language, e.g. "Mon, Dec 25"
 */
export const formatDate = (date: Date): string =>
  date.toLocaleDateString(i18n.language, { weekday: "short", month: "short", day: "numeric" });

/**
 * Format last updated time
 */
export const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return i18n.t("statistics:lastUpdated.justNow");
  if (diffMins < 60) return i18n.t("statistics:lastUpdated.minutesAgo", { minutes: diffMins });
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return i18n.t("statistics:lastUpdated.hoursAgo", { hours: diffHours });
  
  return formatDate(date);
};

/**
 * Compact number for chart axes: 950 → "950", 12400 → "12.4k"
 */
export const formatCompactNumber = (value: number): string => {
  if (value < 1000) return `${Math.round(value)}`;
  const thousands = value / 1000;
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
};
