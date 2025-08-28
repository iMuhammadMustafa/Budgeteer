// Enhanced Recurring Transaction Enums and Constants

/**
 * Enum for recurring transaction types
 */
export enum RecurringType {
  Standard = 'Standard',
  Transfer = 'Transfer',
  CreditCardPayment = 'CreditCardPayment'
}

/**
 * Enum for auto-apply actions
 */
export enum AutoApplyAction {
  RETRY_LATER = 'RETRY_LATER',
  SKIP_AND_RESCHEDULE = 'SKIP_AND_RESCHEDULE',
  DISABLED_AUTO_APPLY = 'DISABLED_AUTO_APPLY'
}

/**
 * Constants for validation rules
 */
export const RECURRING_CONSTANTS = {
  INTERVAL_MONTHS: {
    MIN: 1,
    MAX: 24,
    DEFAULT: 1
  },
  FAILED_ATTEMPTS: {
    MIN: 1,
    MAX: 10,
    DEFAULT: 3
  },
  AMOUNT: {
    MIN: 0.01
  },
  AUTO_APPLY: {
    DEFAULT_ENABLED: false,
    MAX_BATCH_SIZE: 50,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3
  }
} as const;

/**
 * Recurring type display names
 */
export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
  [RecurringType.Standard]: 'Standard Transaction',
  [RecurringType.Transfer]: 'Account Transfer',
  [RecurringType.CreditCardPayment]: 'Credit Card Payment'
};

/**
 * Recurring type descriptions
 */
export const RECURRING_TYPE_DESCRIPTIONS: Record<RecurringType, string> = {
  [RecurringType.Standard]: 'Regular income or expense transaction',
  [RecurringType.Transfer]: 'Transfer money between your accounts',
  [RecurringType.CreditCardPayment]: 'Automatically pay credit card statement balance'
};

/**
 * Interval display helpers
 * @deprecated Use getIntervalDisplayText from interval-calculation.ts instead
 */
export const getIntervalDisplayText = (intervalMonths: number): string => {
  // Import the enhanced version to maintain backward compatibility
  const { getIntervalDisplayText: enhancedGetIntervalDisplayText } = require('../../utils/interval-calculation');
  return enhancedGetIntervalDisplayText(intervalMonths);
};

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  INTERVAL_MONTHS_RANGE: `Interval months must be between ${RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN} and ${RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX}`,
  TRANSFER_ACCOUNT_REQUIRED: 'Transfer account is required for transfer transactions',
  TRANSFER_ACCOUNTS_DIFFERENT: 'Transfer account must be different from source account',
  AMOUNT_REQUIRED: 'Amount is required when amount is not flexible',
  AMOUNT_MIN: `Amount must be at least ${RECURRING_CONSTANTS.AMOUNT.MIN}`,
  DATE_REQUIRED: 'Next occurrence date is required when date is not flexible',
  BOTH_FLEXIBLE: 'Both amount and date can be flexible for maximum execution flexibility',
  MAX_FAILED_ATTEMPTS_RANGE: `Max failed attempts must be between ${RECURRING_CONSTANTS.FAILED_ATTEMPTS.MIN} and ${RECURRING_CONSTANTS.FAILED_ATTEMPTS.MAX}`,
  SOURCE_ACCOUNT_REQUIRED: 'Source account is required for credit card payments',
  INVALID_RECURRING_TYPE: 'Invalid recurring transaction type'
} as const;