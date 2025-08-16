# Repository File Consolidation Plan

## Problem Analysis

The codebase has two sets of repository files for each entity:

1. **Legacy files** (suffixed with `.repository.ts`): Act as proxies using RepositoryManager with fallback to getDemoMode()
2. **New files** (named like `XRepository.ts`): Direct dependency-injected repositories

## Current Usage Analysis

### Legacy `.repository.ts` Files in Use:

- `Accounts.repository.ts` - Used in 8+ files
- `Transactions.repository.ts` - Used in 6+ files
- `Recurrings.repository.ts` - Used in 2+ files
- `TransactionCategories.repository.ts` - Referenced in test files
- `TransactionGroups.repository.ts` - Referenced in test files
- `AccountCategories.repository.ts` - Referenced in test files
- `Stats.repository.ts` - Referenced in test files
- `Configurations.repository.ts` - Referenced in test files

### Files Currently Using Legacy Pattern:

1. **Service Layer**:

   - `src/services/repositories/Accounts.Service.ts`
   - `src/services/repositories/Transactions.Service.ts`
   - `src/services/repositories/Recurrings.Service.ts`

2. **Components**:

   - `src/components/forms/TransactionForm.tsx`
   - `src/app/(drawer)/(tabs)/Recurrings/Upsert.tsx`

3. **Tests**:

   - `src/services/repositories/__tests__/Transactions.test.ts`

4. **Documentation** (can be updated later):
   - Multiple documentation files show examples with legacy imports

## Consolidation Strategy

### Phase 1: Update Service Layer (PRIORITY 1)

**Goal**: Convert service layer to use RepositoryManager directly

**Files to Update**:

1. `src/services/repositories/Accounts.Service.ts`
2. `src/services/repositories/Transactions.Service.ts`
3. `src/services/repositories/Recurrings.Service.ts`

**Approach**: Replace direct imports from `.repository.ts` files with RepositoryManager calls

### Phase 2: Update Components (PRIORITY 2)

**Goal**: Convert UI components to use RepositoryManager

**Files to Update**:

1. `src/components/forms/TransactionForm.tsx`
2. `src/app/(drawer)/(tabs)/Recurrings/Upsert.tsx`

### Phase 3: Update Tests (PRIORITY 3)

**Goal**: Convert tests to use new repository pattern

**Files to Update**:

1. `src/services/repositories/__tests__/Transactions.test.ts`
2. Any other test files with legacy imports

### Phase 4: Remove Legacy Files (PRIORITY 4)

**Goal**: Delete `.repository.ts` files after all migrations

**Files to Delete**:

1. `src/services/apis/Accounts.repository.ts`
2. `src/services/apis/Transactions.repository.ts`
3. `src/services/apis/TransactionCategories.repository.ts`
4. `src/services/apis/TransactionGroups.repository.ts`
5. `src/services/apis/AccountCategories.repository.ts`
6. `src/services/apis/Stats.repository.ts`
7. `src/services/apis/Configurations.repository.ts`
8. `src/services/apis/Recurrings.repository.ts`

### Phase 5: Update Documentation (PRIORITY 5)

**Goal**: Update examples in documentation

## Progress Update

### ✅ COMPLETED:

- **Phase 1: Service Layer** - All service files converted to use RepositoryManager
  - ✅ Accounts.Service.ts
  - ✅ Transactions.Service.ts
  - ✅ Recurrings.Service.ts
- **Phase 2: Components** - All component files converted to use RepositoryManager
  - ✅ TransactionForm.tsx
  - ✅ Recurrings/Upsert.tsx

### 🚫 BLOCKED:

- **Phase 3: Tests** - Blocked by DIContainer import failures (154 tests failing)
- **Phase 4: File Deletion** - Waiting for test fixes
- **Phase 5: Documentation** - Low priority

### Critical Issue Identified:

The main blocker is `DIContainer.getInstance is not a function` errors across all tests. This is preventing validation of our consolidation work and must be resolved before proceeding with legacy file deletion.

### Next Steps:

1. **IMMEDIATE**: Fix DIContainer import/export issues
2. **THEN**: Validate all tests pass with new repository pattern
3. **FINALLY**: Delete legacy `.repository.ts` files

### Files Ready for Deletion (after tests pass):

- `src/services/apis/Accounts.repository.ts`
- `src/services/apis/Transactions.repository.ts`
- `src/services/apis/TransactionCategories.repository.ts`
- `src/services/apis/TransactionGroups.repository.ts`
- `src/services/apis/AccountCategories.repository.ts`
- `src/services/apis/Stats.repository.ts`
- `src/services/apis/Configurations.repository.ts`
- `src/services/apis/Recurrings.repository.ts`

## Success Metrics:

✅ Service layer: 100% migrated (3/3 files)
✅ Components: 100% migrated (2/2 files)  
❌ Tests: 0% working due to DIContainer issues
❌ Legacy cleanup: 0% (blocked by tests)
