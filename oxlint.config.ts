import { oxlintLibraryConfig, testOverrides, configOverrides } from '@finografic/oxc-config/oxlint';
import { defineConfig } from 'oxlint';
import type { OxlintConfig } from 'oxlint';

export default defineConfig({
  ...oxlintLibraryConfig,
  overrides: [testOverrides, configOverrides],
  ignorePatterns: [...(oxlintLibraryConfig.ignorePatterns ?? []), 'assets/**'],
} satisfies OxlintConfig);
