// Tests find texts by their English wording, so they always run in English.
// Required in beforeAll, after the test file's jest.mock()s (e.g. of expo-localization);
// a static import would load i18n before them, and Jest can't run import() here
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: i18n } = require("@/i18n");
  return i18n.changeLanguage("en");
});
