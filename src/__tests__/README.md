# Comprehensive Test Suite

This directory contains the comprehensive test suite for the Budgeteer application's multi-tier storage architecture. The tests validate end-to-end functionality, data consistency, mode switching, and regression scenarios.

## Test Structure

```
src/__tests__/
├── e2e/                          # End-to-end integration tests
│   ├── EndToEndIntegration.test.ts    # Complete user workflows
│   ├── DataConsistency.test.ts        # Data consistency validation
│   ├── LoginWorkflow.test.ts          # Login and mode selection
│   └── RegressionTests.test.ts        # Comprehensive regression tests
├── fixes/                        # Test fixes and validation
│   └── TestFixes.test.ts              # Common test issue fixes
├── setup/                        # Test configuration
│   └── testSetup.ts                   # Global test setup and mocks
├── TestRunner.ts                 # Test execution framework
├── runAllTests.ts               # Main test runner script
└── README.md                    # This file
```

## Requirements Coverage

This test suite addresses the following requirements from the specification:

### Requirement 1.5 - Mode Switching Validation
- Tests complete user workflows from login to data operations
- Validates mode switching functionality
- Ensures UI consistency across storage modes

### Requirement 7.1 - Comprehensive Validation
- All storage implementations tested against same test suite
- Interface compliance validation
- Cross-mode consistency testing

### Requirement 7.3 - Data Relationship Testing
- Foreign key constraint validation
- Referential integrity across storage modes
- Cascade operation testing

### Requirement 7.5 - Function Signature Consistency
- Interface compliance testing
- Method signature validation
- Behavior consistency across implementations

## Test Categories

### 1. End-to-End Integration Tests (`e2e/EndToEndIntegration.test.ts`)

**Purpose**: Validate complete user workflows across all storage modes

**Coverage**:
- Full account management workflow (create, read, update, delete, restore)
- Complete transaction workflow with dependencies
- Referential integrity validation
- Storage mode switching
- Error handling and recovery
- Performance and memory testing

**Test Modes**: Demo, Local (Cloud mode requires authentication setup)

### 2. Data Consistency Tests (`e2e/DataConsistency.test.ts`)

**Purpose**: Ensure data consistency across mode switches and validate referential integrity

**Coverage**:
- Cross-mode data isolation
- Concurrent operations handling
- Referential integrity enforcement
- Data migration consistency
- Rapid mode switching
- Schema validation consistency
- Performance consistency

### 3. Login Workflow Tests (`e2e/LoginWorkflow.test.ts`)

**Purpose**: Test complete user journey from login screen through data operations

**Coverage**:
- Mode selection UI rendering
- Demo mode initialization
- Local mode initialization
- Cloud mode selection (UI only)
- Post-login data operations
- Mode switching after login
- Error handling in login flow
- User experience validation

### 4. Regression Tests (`e2e/RegressionTests.test.ts`)

**Purpose**: Comprehensive regression testing to ensure existing functionality remains intact

**Coverage**:
- Core CRUD operations across all modes
- Business logic validation (balance calculations, tenant isolation)
- Error handling consistency (duplicates, referential integrity)
- Performance regression testing
- Integration points compatibility
- Backward compatibility validation

### 5. Test Fixes (`fixes/TestFixes.test.ts`)

**Purpose**: Address common test issues and validate test environment setup

**Coverage**:
- Environment variable validation
- Mock configuration verification
- Error handling fixes
- Storage provider mocking
- Interface compliance fixes
- TanStack Query integration fixes
- Cross-storage error consistency
- Test isolation and cleanup
- Performance and memory management

## Running Tests

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Categories
```bash
# End-to-end tests only
npm run test:e2e

# Test fixes and validation
npm run test:fixes

# Integration tests
npm run test:integration

# Unit tests (excluding integration and e2e)
npm run test:unit

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Run Individual Test Files
```bash
# Specific test file
npm test -- src/__tests__/e2e/EndToEndIntegration.test.ts

# With verbose output
npm test -- src/__tests__/e2e/DataConsistency.test.ts --verbose
```

## Test Reports

The test runner generates comprehensive reports:

### JSON Report (`test-report.json`)
- Machine-readable test results
- Detailed error information
- Performance metrics
- Test suite statistics

### HTML Report (`test-report.html`)
- Human-readable visual report
- Interactive test results
- Error details and stack traces
- Performance charts

## Test Environment Setup

### Required Environment Variables
```bash
NODE_ENV=test
EXPO_PUBLIC_SUPABASE_URL=https://test.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=test-key
```

### Mock Configuration
The test suite includes comprehensive mocks for:
- React Native components and APIs
- Supabase client and authentication
- IndexedDB (Dexie) for web storage
- Expo SQLite for native storage
- AsyncStorage for persistent storage
- UUID generation
- Network requests

## Common Issues and Solutions

### 1. "Cannot find module" Errors
**Solution**: Ensure all required mocks are configured in `setup/testSetup.ts`

### 2. "supabaseUrl is required" Errors
**Solution**: Set environment variables in test setup or use mock values

### 3. React Native CSS Interop Errors
**Solution**: Mock the CSS interop module in test setup

### 4. Safe Area Context Errors
**Solution**: Use the provided Safe Area Context mocks

### 5. Test Timeouts
**Solution**: Increase Jest timeout or optimize test performance

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up resources after each test
- Use fresh instances for each test

### 2. Mock Management
- Keep mocks simple and focused
- Avoid over-mocking
- Verify mock behavior in tests

### 3. Error Testing
- Test both success and failure scenarios
- Validate error types and messages
- Test error recovery mechanisms

### 4. Performance Testing
- Include performance benchmarks
- Test with realistic data volumes
- Monitor memory usage

### 5. Maintenance
- Keep tests up-to-date with code changes
- Review and update mocks regularly
- Monitor test execution times

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include both positive and negative test cases
3. Test across all supported storage modes
4. Add appropriate mocks for new dependencies
5. Update this documentation

## Troubleshooting

### Debug Test Failures
```bash
# Run with debug output
npm test -- --verbose --no-cache

# Run single test with full output
npm test -- --testNamePattern="specific test name" --verbose
```

### Clear Jest Cache
```bash
npx jest --clearCache
```

### Check Test Coverage
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Integration with CI/CD

The test suite is designed to work in CI/CD environments:

- All tests run in Node.js environment
- No external dependencies required
- Comprehensive mocking prevents network calls
- Generates machine-readable reports
- Appropriate exit codes for CI systems

For CI integration, use:
```bash
npm run test:all
```

This will run all tests and generate reports, exiting with code 0 on success or 1 on failure.