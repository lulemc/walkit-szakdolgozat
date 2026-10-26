/**
 * A small levelled logger: `LOG_LEVEL` (debug, info, warn, error, silent;
 * default info) decides what is written. Lines start with the time and level,
 * so they can be searched and filtered in a host's log viewer.
 * Don't log personal data (user ids, emails, coordinates) at info or above.
 */
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const write = (level) => (message, ...details) => {
  const threshold = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;
  if (LEVELS[level] < threshold) return;
  console[level](`${new Date().toISOString()} ${level.toUpperCase()} ${message}`, ...details);
};

export const logger = {
  debug: write("debug"),
  info: write("info"),
  warn: write("warn"),
  error: write("error"),
};
