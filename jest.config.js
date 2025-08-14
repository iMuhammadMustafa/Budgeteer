module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    './src/__tests__/setup/testSetup.ts',
    '@testing-library/jest-native/extend-expect'
  ],
  setupFiles: [
    './jestSetupFile.js'
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
    '<rootDir>/old_dist/',
    '<rootDir>/electron-builder/',
    '<rootDir>/src/__tests__/setup/',
    '<rootDir>/src/__tests__/utils/',
    '<rootDir>/src/__tests__/TestRunner.ts',
    '<rootDir>/src/__tests__/runAllTests.ts',
    '<rootDir>/src/services/repositories/__tests__/setup/',
    '<rootDir>/src/services/repositories/__tests__/utils/',
    '<rootDir>/src/services/repositories/__tests__/runTanStackQueryTests.ts',
    '<rootDir>/src/services/repositories/__tests__/jest.config.js'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/temp/**',
    '!src/**/*.config.{ts,tsx}',
    '!src/**/index.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@expo|expo|@supabase|dexie)'
  ],
  testEnvironment: 'jsdom',
  globals: {
    __DEV__: true
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  maxWorkers: 1,
  testTimeout: 30000
};