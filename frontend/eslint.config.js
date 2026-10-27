// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // app-example: Expo's template, kept locally (git-ignored), not part of the app
    ignores: ['dist/*', 'app-example/*'],
  },
]);
