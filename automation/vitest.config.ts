import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include:     ['tests/unit/**/*.test.ts'],
    environment: 'node',
    globals:     true,
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'json', 'html'],
      include:   ['src/**/*.ts'],
      exclude:   ['src/index.ts'],
    },
    // Timeout for individual tests (in ms)
    testTimeout: 10_000,
  },
  resolve: {
    // Allow .js extensions in imports (NodeNext module resolution)
    extensions: ['.ts', '.js'],
  },
});
