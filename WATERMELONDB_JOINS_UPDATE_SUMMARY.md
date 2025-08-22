# WatermelonDB Repository Joins Update Summary

## Overview

This document summarizes the changes made to ensure that WatermelonDB repositories match the join patterns used in Supabase repositories. The goal was to maintain consistency between the two data access layers to prevent data structure mismatches when switching between online/offline modes.

## Problem Identified

The Supabase repositories were using proper joins to include related data, while the WatermelonDB repositories were only returning basic entity data without the related objects. This caused inconsistent data structures between the two implementations.

## Supabase Repository Join Patterns (Reference)

### 1. AccountSupaRepository

- **findAll()**: Includes category join
  ```sql
  SELECT *, category:account_categories!accounts_categoryid_fkey(*)
  ```
- **findById()**: Manually fetches category after getting account data

### 2. TransactionCategorySupaRepository

- **findAll()**: Includes group join
  ```sql
  SELECT *, group:transaction_groups!transactioncategories_groupid_fkey(*)
  ```

### 3. RecurringSupaRepository

- **findAll()** & **findById()**: Include multiple joins
  ```sql
  SELECT *,
    source_account:accounts!recurrings_sourceaccountid_fkey(*),
    category:transaction_categories!recurrings_categoryid_fkey(*)
  ```

## Changes Made to WatermelonDB Repositories

### 1. AccountWatermelonRepository

**File**: `src/repositories/watermelondb/Accounts.watermelon.ts`

**Changes**:

- Added `AccountCategory` import
- Overrode `findAll()` method to fetch and include category data
- Overrode `findById()` method to fetch and include category data
- Each account now includes a `category` object with complete category details

**Structure Added**:

```typescript
account.category = {
  id,
  name,
  type,
  color,
  icon,
  displayorder,
  tenantid,
  isdeleted,
  createdat,
  createdby,
  updatedat,
  updatedby,
};
```

### 2. TransactionCategoryWatermelonRepository

**File**: `src/repositories/watermelondb/TransactionCategories.watermelon.ts`

**Changes**:

- Added `TransactionGroup` import
- Overrode `findAll()` method to fetch and include group data
- Overrode `findById()` method to fetch and include group data
- Each category now includes a `group` object with complete group details

**Structure Added**:

```typescript
category.group = {
  id,
  name,
  type,
  color,
  icon,
  description,
  displayorder,
  budgetamount,
  budgetfrequency,
  tenantid,
  isdeleted,
  createdat,
  createdby,
  updatedat,
  updatedby,
};
```

### 3. RecurringWatermelonRepository

**File**: `src/repositories/watermelondb/Recurrings.watermelon.ts`

**Changes**:

- Added `Account` and `TransactionCategory` imports
- Overrode `findAll()` method to fetch and include both source account and category data
- Overrode `findById()` method to fetch and include both source account and category data
- Each recurring now includes `source_account` and `category` objects (category is optional)

**Structure Added**:

```typescript
recurring.source_account = {
  id,
  name,
  categoryid,
  balance,
  currency,
  color,
  icon,
  description,
  notes,
  owner,
  displayorder,
  tenantid,
  isdeleted,
  createdat,
  createdby,
  updatedat,
  updatedby,
};

recurring.category = {
  // Optional
  id,
  name,
  groupid,
  type,
  color,
  icon,
  description,
  displayorder,
  budgetamount,
  budgetfrequency,
  tenantid,
  isdeleted,
  createdat,
  createdby,
  updatedat,
  updatedby,
};
```

## Implementation Details

### Query Strategy

- Used separate queries for each related entity to maintain WatermelonDB compatibility
- Applied proper filtering (isdeleted = false, tenant filtering)
- Handled optional relationships (e.g., category in recurring can be null)

### Data Mapping

- Maintained exact field structure to match Supabase output
- Used proper type conversions (Date to ISO string)
- Preserved null handling for optional fields

### Performance Considerations

- Each join requires additional database queries
- For large datasets, this might impact performance compared to Supabase's single-query joins
- Future optimization could implement batch fetching or caching strategies

## Validation

Created test file: `src/repositories/__tests__/joins-validation.test.ts`

- Validates that all repository classes exist and have required methods
- Documents expected join structures
- Provides regression testing for future changes

## Benefits Achieved

1. **Consistency**: WatermelonDB and Supabase repositories now return identical data structures
2. **Reliability**: No more missing related data when switching between online/offline modes
3. **Maintainability**: Clear documentation of join requirements
4. **Future-proof**: Pattern established for adding joins to other repositories

## Files Modified

1. `src/repositories/watermelondb/Accounts.watermelon.ts`
2. `src/repositories/watermelondb/TransactionCategories.watermelon.ts`
3. `src/repositories/watermelondb/Recurrings.watermelon.ts`
4. `src/repositories/__tests__/joins-validation.test.ts` (new)

## Repositories Not Requiring Changes

- **AccountCategoryWatermelonRepository**: No joins in Supabase version
- **TransactionGroupWatermelonRepository**: No joins in Supabase version
- **ConfigurationWatermelonRepository**: No joins in Supabase version
- **StatsWatermelonRepository**: Uses aggregation, not entity joins

## Next Steps

1. Consider optimizing WatermelonDB join queries for better performance
2. Add integration tests with actual data to validate join correctness
3. Monitor performance impact in production
4. Consider implementing similar patterns for Transaction repository joins (currently has TODOs)

## Notes

- Transaction repository in WatermelonDB has TODO comments for joins that still need implementation
- The current approach prioritizes correctness over performance
- Future enhancements could include relation-based querying using WatermelonDB's @relation decorators
