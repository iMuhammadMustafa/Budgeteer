/**
 * Default tenant/user IDs for local storage mode
 */
export const LOCAL_TENANT_ID = "00000000-da25-4b50-870f-00000000";
export const LOCAL_USER_ID = "00000000-da25-4b50-870f-00000000";

/**
 * Demo tenant/user IDs for demo mode
 */
export const DEMO_TENANT_ID = "ffffffff-da25-4b50-870f-ffffffffffff";
export const DEMO_USER_ID = "ffffffff-da25-4b50-870f-ffffffffffff";

/**
 * Default values
 */
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_BUDGET_FREQUENCY = "Monthly";
export const DEFAULT_COLOR = "error-100";
export const DEFAULT_ICON = "Ellipsis";


export const getNow = () => new Date().toISOString();

export const LOCAL_DEFAULTS = {
    tenantid: LOCAL_TENANT_ID,
    createdby: LOCAL_USER_ID,
    currency: DEFAULT_CURRENCY,
    color: DEFAULT_COLOR,
    icon: DEFAULT_ICON,
    budgetfrequency: DEFAULT_BUDGET_FREQUENCY,
    budgetamount: 0,
    displayorder: 0,
    isdeleted: false,
} as const;

export const DEMO_DEFAULTS = {
    tenantid: DEMO_TENANT_ID,
    createdby: DEMO_USER_ID,
    currency: DEFAULT_CURRENCY,
    color: DEFAULT_COLOR,
    icon: DEFAULT_ICON,
    budgetfrequency: DEFAULT_BUDGET_FREQUENCY,
    budgetamount: 0,
    displayorder: 0,
    isdeleted: false,
} as const;
