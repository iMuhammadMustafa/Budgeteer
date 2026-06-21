/**
 * Global constants for WatermelonDB operations
 * These values are used across all local database operations
 */

/**
 * Default tenant ID for WatermelonDB operations
 * This is the primary tenant identifier used when operating in local storage mode
 * All local data will be associated with this tenant
 */
export const SQLITE_DEFAULT_TENANT_ID = "d8d5efae-da25-4b50-870f-8774b83d73e9";
export const SQLITE_DEMO_TENANT_ID = "ffffffff-da25-4b50-870f-ffffffffffff";

/**
 * Default user ID for WatermelonDB operations
 * This is the primary user identifier used when operating in local storage mode
 * All local data will be created/updated by this user
 */
export const SQLITE_DEFAULT_USER_ID = "d8d5efae-da25-4b50-870f-8774b83d73e9";
export const SQLITE_DEMO_USER_ID = "ffffffff-da25-4b50-870f-ffffffffffff";

/**
 * Default currency code for WatermelonDB operations
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
 * Utility function to get current timestamp for WatermelonDB records
 */
export const getCurrentTimestamp = (): Date => new Date();

/**
 * Utility function to get the default tenant ID
 * This function can be extended in the future to support multiple tenants
 */
export const getDefaultTenantId = (): string => {
  return SQLITE_DEFAULT_TENANT_ID;
};

/**
 * Utility function to get the default user ID
 * This function can be extended in the future to support current user context
 */
export const getDefaultUserId = (): string => {
  return SQLITE_DEFAULT_USER_ID;
};

/**
 * Common default values for new WatermelonDB records
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

export default {
  SQLITE_DEFAULT_TENANT_ID,
  SQLITE_DEFAULT_USER_ID,
  SQLITE_DEFAULT_CURRENCY,
  SQLITE_DEFAULT_BUDGET_FREQUENCY,
  SQLITE_DEFAULT_COLOR,
  SQLITE_DEFAULTS,
  getCurrentTimestamp,
  getDefaultTenantId,
  getDefaultUserId,
};
