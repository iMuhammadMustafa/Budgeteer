/**
 * SQLite Constants
 * These values are used across all local SQLite database operations
 */

/**
 * Default tenant ID for SQLite operations in Local mode
 */
export const SQLITE_DEFAULT_TENANT_ID = "d8d5efae-da25-4b50-870f-8774b83d73e9";

/**
 * Demo tenant ID for SQLite operations in Demo mode
 */
export const SQLITE_DEMO_TENANT_ID = "ffffffff-da25-4b50-870f-ffffffffffff";

/**
 * Default user ID for SQLite operations in Local mode
 */
export const SQLITE_DEFAULT_USER_ID = "d8d5efae-da25-4b50-870f-8774b83d73e9";

/**
 * Demo user ID for SQLite operations in Demo mode
 */
export const SQLITE_DEMO_USER_ID = "ffffffff-da25-4b50-870f-ffffffffffff";

/**
 * Default currency code
 */
export const SQLITE_DEFAULT_CURRENCY = "USD";

/**
 * Default budget frequency for categories and groups
 */
export const SQLITE_DEFAULT_BUDGET_FREQUENCY = "monthly";

/**
 * Default color scheme for new items
 */
export const SQLITE_DEFAULT_COLOR = "error-100";

/**
 * LocalStorage keys for seeding flags
 */
export const SQLITE_SEEDING_FLAGS = {
  LOCAL_SEEDED: "budgeteer-local-seeded",
  DEMO_SEEDED: "budgeteer-demo-seeded",
} as const;

/**
 * Common default values for Local mode
 */
export const SQLITE_DEFAULTS = {
  tenantId: SQLITE_DEFAULT_TENANT_ID,
  userId: SQLITE_DEFAULT_USER_ID,
  currency: SQLITE_DEFAULT_CURRENCY,
  budgetFrequency: SQLITE_DEFAULT_BUDGET_FREQUENCY,
  color: SQLITE_DEFAULT_COLOR,
  budgetAmount: 0,
  displayOrder: 0,
  isDeleted: false,
  email: "local@local.com",
  name: "Local User",
} as const;

/**
 * Common default values for Demo mode
 */
export const SQLITE_DEMO = {
  tenantId: SQLITE_DEMO_TENANT_ID,
  userId: SQLITE_DEMO_USER_ID,
  currency: SQLITE_DEFAULT_CURRENCY,
  budgetFrequency: SQLITE_DEFAULT_BUDGET_FREQUENCY,
  color: SQLITE_DEFAULT_COLOR,
  budgetAmount: 0,
  displayOrder: 0,
  isDeleted: false,
  email: "demo@local.com",
  name: "Demo User",
} as const;

/**
 * Utility function to get current ISO timestamp
 */
export const getCurrentTimestamp = (): string => new Date().toISOString();

/**
 * Utility function to get the default tenant ID
 */
export const getDefaultTenantId = (): string => SQLITE_DEFAULT_TENANT_ID;

/**
 * Utility function to get the demo tenant ID
 */
export const getDemoTenantId = (): string => SQLITE_DEMO_TENANT_ID;

/**
 * Utility function to get the default user ID
 */
export const getDefaultUserId = (): string => SQLITE_DEFAULT_USER_ID;
