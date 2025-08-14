# TanStack Query Integration Tests

This directory contains comprehensive integration tests for TanStack Query with the multi-tier storage architecture. The tests validate that TanStack Query works correctly across all storage modes (Cloud, Demo, Local) and ensures consistent behavior throughout the application.

## Test Structure

### Core Test Files

1. **TanStackQueryIntegration.test.ts**
   - Main integration test suite
   - Tests storage mode switching
   - Validates query functionality across all modes
   - Tests repository layer integration
   - Performance and memory tests

2. **QueryCaching.test.ts**
   - Query caching behavior tests
   - Cache persistence across storage modes
   - Cache invalidation patterns
   - Cache performance optimization
   - Cache consistency validation

3. **ErrorHandling.test.ts**
   - Error handling scenarios
   - Storage provider error propagation
   - Network error handling
   - Error recovery mechanisms
   - Cross-mode error consistency

4. **QueryInvalidation.test.ts**
   - Query invalidation patterns
   - Cross-entity invalidation
   - Manual invalidation scenarios
   - Invalidation performance
   - Mode-specific invalidation behavior

### Utility Files

- **utils/testUtils.ts** - Common test utilities and helpers
- **setup/jestSetup.ts** - Jest configuration and mocks
- **setup/globalSetup.ts** - Global test environment setup
- **setup/globalTeardown.ts** - Global test cleanup
- **jest.config.js** - Jest configuration for the test suite
- **runTanStackQueryTests.ts** - Test runner script

## Test Coverage

### Storage Modes Tested
- ✅ **Cloud Mode** (Supabase) - Production cloud database
- ✅ **Demo Mode** (Mock) - In-memory sample data
- ✅ **Local Mode** (IndexedDB/SQLite) - Persistent local storage

### Query Operations Tested
- ✅ **useQuery** hooks for data fetching
- ✅ **useMutation** hooks for data modification
- ✅ **Query caching** and cache management
- ✅ **Query invalidation** and refetching
- ✅ **Error handling** and recovery
- ✅ **Loading states** and transitions

### Integration Points Tested
- ✅ **Repository Layer** - Dependency injection integration
- ✅ **Storage Providers** - Multi-mode provider switching
- ✅ **TanStack Query** - Query client configuration
- ✅ **React Hooks** - Hook behavior and lifecycle
- ✅ **Error Boundaries** - Error propagation and handling

## Running the Tests

### Run All Tests
```bash
npm test -- --testPathPattern="TanStackQuery"
```

### Run Specific Test Suite
```bash
npm test -- --testPathPattern="TanStackQueryIntegration.test.ts"
npm test -- --testPathPattern="QueryCaching.test.ts"
npm test -- --testPathPattern="ErrorHandling.test.ts"
npm test -- --testPathPattern="QueryInvalidation.test.ts"
```

### Run with Coverage
```bash
npm test -- --testPathPattern="TanStackQuery" --coverage
```

### Run Test Runner Script
```bash
npx ts-node src/services/repositories/__tests__/runTanStackQueryTests.ts
```

## Test Configuration

### Jest Configuration
The tests use a custom Jest configuration (`jest.config.js`) with:
- **jsdom** test environment for React components
- **TypeScript** support with ts-jest
- **Module mapping** for path aliases
- **Coverage reporting** with thresholds
- **Custom setup** and teardown scripts

### Mocked Dependencies
- **React Native** modules (Platform, Alert, etc.)
- **AsyncStorage** for persistence
- **Expo modules** (SQLite, Constants)
- **Supabase client** for cloud operations
- **Dexie** for IndexedDB operations
- **UUID** generation
- **Date/time** utilities

## Test Scenarios

### 1. Storage Mode Switching
- Validates seamless switching between storage modes
- Tests repository instance recreation
- Verifies provider initialization and cleanup
- Ensures data isolation between modes

### 2. Query Functionality
- Tests all query hooks across storage modes
- Validates data fetching and caching
- Ensures consistent API behavior
- Tests loading and error states

### 3. Cache Management
- Tests cache persistence and invalidation
- Validates cache keys and data structure
- Tests cache performance and memory usage
- Ensures cache consistency across modes

### 4. Error Handling
- Tests error propagation from storage layer
- Validates error recovery mechanisms
- Tests network and timeout errors
- Ensures consistent error handling across modes

### 5. Mutation Operations
- Tests create, update, delete operations
- Validates optimistic updates
- Tests mutation error handling
- Ensures cache invalidation after mutations

### 6. Performance Testing
- Tests query performance across modes
- Validates memory usage and cleanup
- Tests concurrent query handling
- Ensures efficient cache management

## Expected Test Results

### Success Criteria
- ✅ All storage modes work with TanStack Query
- ✅ Query caching behaves consistently
- ✅ Error handling is robust and consistent
- ✅ Query invalidation works across all modes
- ✅ No memory leaks or performance issues
- ✅ Repository integration is seamless

### Coverage Targets
- **Lines**: 70%+ coverage
- **Functions**: 70%+ coverage
- **Branches**: 70%+ coverage
- **Statements**: 70%+ coverage

## Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout in jest.config.js
   - Check for unresolved promises
   - Verify mock implementations

2. **Mock Failures**
   - Ensure all dependencies are properly mocked
   - Check mock implementations in jestSetup.ts
   - Verify module path mappings

3. **Storage Mode Errors**
   - Check StorageModeManager initialization
   - Verify provider factory configuration
   - Ensure cleanup between tests

4. **Query Hook Errors**
   - Verify QueryClient configuration
   - Check wrapper component setup
   - Ensure proper test environment

### Debug Tips

1. **Enable Verbose Logging**
   ```bash
   npm test -- --verbose --testPathPattern="TanStackQuery"
   ```

2. **Run Single Test**
   ```bash
   npm test -- --testNamePattern="specific test name"
   ```

3. **Debug Mode**
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand --testPathPattern="TanStackQuery"
   ```

## Contributing

When adding new tests:

1. **Follow naming conventions** - Use descriptive test names
2. **Add proper setup/teardown** - Clean up after each test
3. **Mock dependencies** - Ensure tests are isolated
4. **Test all storage modes** - Verify consistency across modes
5. **Add documentation** - Update this README with new test scenarios

## Requirements Validation

This test suite validates the following requirements:

- **Requirement 6.3**: TanStack Query works identically with all storage implementations
- **Requirement 6.6**: TanStack Query hooks require minimal changes when adding new storage modes
- **Requirement 7.1**: All storage implementations are tested against the same test suite

The comprehensive test coverage ensures that the multi-tier storage architecture integrates seamlessly with TanStack Query while maintaining consistent behavior across all storage modes.