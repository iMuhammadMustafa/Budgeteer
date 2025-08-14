/**
 * Jest configuration for TanStack Query Integration Tests
 */

module.exports = {
  preset: 'jest-expo',
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/services/repositories/__tests__/setup/jestSetup.ts'
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/services/repositories/__tests__/**/*.test.ts',
    '<rootDir>/src/services/repositories/__tests__/**/*.test.tsx'
  ],
  
  // Module file extensions
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/repositories/**/*.{ts,tsx}',
    'src/services/storage/**/*.{ts,tsx}',
    'src/services/apis/**/*.{ts,tsx}',
    '!src/services/**/__tests__/**',
    '!src/services/**/*.test.{ts,tsx}',
    '!src/services/**/*.d.ts'
  ],
  
  coverageDirectory: '<rootDir>/coverage/tanstack-query-integration',
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/.expo/'
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@tanstack|dexie)/)'
  ],
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/services/repositories/__tests__/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/src/services/repositories/__tests__/setup/globalTeardown.ts',
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/test-results',
        outputName: 'tanstack-query-integration-results.xml',
        suiteName: 'TanStack Query Integration Tests'
      }
    ]
  ],
  
  // Snapshot serializers
  snapshotSerializers: [
    'enzyme-to-json/serializer'
  ]
};