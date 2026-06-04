// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Edge functions run on Deno (URL imports, Deno globals) — not lintable
    // by the Expo/Node ESLint config. Deno tooling handles them instead.
    ignores: ['dist/*', 'supabase/functions/**'],
  },
]);
