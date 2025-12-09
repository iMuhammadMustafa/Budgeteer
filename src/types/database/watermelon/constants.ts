/**
 * Global constants for WatermelonDB operations
 * These values are used across all local database operations
 */

/**
 * Default tenant ID for WatermelonDB operations
 * This is the primary tenant identifier used when operating in local storage mode
 * All local data will be associated with this tenant
 */
export const WATERMELONDB_DEFAULT_TENANT_ID = "d8d5efae-da25-4b50-870f-8774b83d73e9";

/**
 * Default user ID for WatermelonDB operations
 * This is the primary user identifier used when operating in local storage mode
 * All local data will be created/updated by this user
 */
export const WATERMELONDB_DEFAULT_USER_ID = "d8d5efae-da25-4b50-870f-8774b83d73e9";

/**
 * Default currency code for WatermelonDB operations
 */
export const WATERMELONDB_DEFAULT_CURRENCY = "USD";

/**
 * Default budget frequency for categories and groups
 */
export const WATERMELONDB_DEFAULT_BUDGET_FREQUENCY = "monthly";

/**
 * Default color scheme for new items
 */
export const WATERMELONDB_DEFAULT_COLOR = "error-100";

/**
 * Utility function to get current timestamp for WatermelonDB records
 */
export const getCurrentTimestamp = (): Date => new Date();

/**
 * Utility function to get the default tenant ID
 * This function can be extended in the future to support multiple tenants
 */
export const getDefaultTenantId = (): string => {
  return WATERMELONDB_DEFAULT_TENANT_ID;
};

/**
 * Utility function to get the default user ID
 * This function can be extended in the future to support current user context
 */
export const getDefaultUserId = (): string => {
  return WATERMELONDB_DEFAULT_USER_ID;
};

/**
 * Common default values for new WatermelonDB records
 */
export const WATERMELONDB_DEFAULTS = {
  tenantId: WATERMELONDB_DEFAULT_TENANT_ID,
  userId: WATERMELONDB_DEFAULT_USER_ID,
  currency: WATERMELONDB_DEFAULT_CURRENCY,
  budgetFrequency: WATERMELONDB_DEFAULT_BUDGET_FREQUENCY,
  color: WATERMELONDB_DEFAULT_COLOR,
  budgetAmount: 0,
  displayOrder: 0,
  isDeleted: false,
} as const;

export default {
  WATERMELONDB_DEFAULT_TENANT_ID,
  WATERMELONDB_DEFAULT_USER_ID,
  WATERMELONDB_DEFAULT_CURRENCY,
  WATERMELONDB_DEFAULT_BUDGET_FREQUENCY,
  WATERMELONDB_DEFAULT_COLOR,
  WATERMELONDB_DEFAULTS,
  getCurrentTimestamp,
  getDefaultTenantId,
  getDefaultUserId,
};
