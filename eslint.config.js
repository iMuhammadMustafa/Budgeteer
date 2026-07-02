// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const playwright = require("eslint-plugin-playwright");

module.exports = defineConfig([
  // Global ignores — an object with ONLY `ignores` applies suite-wide.
  // Quarantined legacy E2E specs (pre-redesign) are not linted; they are
  // scheduled for rewrite, not maintenance. See e2e/tests/legacy/README.md.
  {
    ignores: [
      "dist/*",
      // Quarantined pre-redesign E2E specs + the legacy helper layer they use
      // (old form/modal/dropdown interactions with hard waits). navigation.ts,
      // forms.ts, fixtures/app.ts and the active specs ARE linted.
      "e2e/tests/legacy/**",
      "e2e/fixtures/auth.ts",
      "e2e/fixtures/global-setup.ts",
      "e2e/utils/selectors.ts",
      "e2e/utils/helpers/fill-forms.ts",
      "e2e/utils/helpers/item.ts",
      "e2e/utils/helpers/modal.ts",
      "e2e/utils/helpers/transaction.ts",
      "e2e/utils/helpers/account.ts",
    ],
  },
  expoConfig,
  // Phase 5.4: enforce E2E hygiene — no hard waits, no force clicks. Keeps the
  // rebuilt Playwright suite from regressing.
  {
    ...playwright.configs["flat/recommended"],
    files: ["e2e/**/*.ts"],
  },
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "playwright/no-wait-for-timeout": "error",
      "playwright/no-force-option": "warn",
      "playwright/expect-expect": "off",
      // Cloud journeys deliberately self-skip when credentials are absent.
      "playwright/no-skipped-test": "off",
    },
  },
  {
    // Placed AFTER expoConfig so this React-version pin wins the merge.
    // eslint-plugin-react's autodetect calls a context API removed in ESLint 10
    // (`context.getFilename`), crashing the run; pinning skips that path.
    settings: {
      react: { version: "19" },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
]);
