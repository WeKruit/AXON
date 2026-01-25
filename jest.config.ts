/**
 * Jest configuration for WeCrew-AXON
 *
 * Configured to run tests across the monorepo without requiring Nx.
 */

import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/apps/**/*.spec.ts',
    '<rootDir>/libraries/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@gitroom/nestjs-libraries/(.*)$': '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@gitroom/backend/(.*)$': '<rootDir>/apps/backend/src/$1',
  },
  collectCoverageFrom: [
    'apps/**/*.ts',
    'libraries/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: './reports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './reports',
      outputName: 'junit.xml',
    }],
  ],
  passWithNoTests: true,
  // Ignore files that shouldn't be transformed
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm/)?(@nestjs|firebase-admin)/)',
  ],
  // Setup files
  setupFilesAfterEnv: [],
  // Increase timeout for integration tests
  testTimeout: 30000,
};

export default config;
