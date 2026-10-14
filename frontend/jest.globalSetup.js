// Run every test in a fixed non-UTC zone (UTC-3, no DST), so date logic that confuses
// local time with UTC fails here and in CI (which runs in UTC) instead of on devices.
module.exports = async () => {
  process.env.TZ = "America/Sao_Paulo";
};
