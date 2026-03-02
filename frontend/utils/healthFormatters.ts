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
  if (calories === 0) return "Let's get moving! 💪";
  if (calories < 100) return "Good start! 🔥";
  if (calories < 300) return "Great work! ⚡";
  if (calories < 500) return "Awesome! 🎉";
  return "Amazing! 🚀";
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
 * Get day of week abbreviation
 */
export const getDayAbbreviation = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

/**
 * Get short month name
 */
export const getMonthName = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

/**
 * Format date as "Mon, Dec 25"
 */
export const formatDate = (date: Date): string => {
  return `${getDayAbbreviation(date)}, ${getMonthName(date)} ${date.getDate()}`;
};

/**
 * Format last updated time
 */
export const formatLastUpdated = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return formatDate(date);
};