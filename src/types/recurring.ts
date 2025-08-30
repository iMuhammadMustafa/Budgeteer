import { TableNames } from "./db/TableNames";
import { Inserts, Recurring } from "./db/Tables.Types";

export enum RecurringType {
  Standard = "Standard",
  Transfer = "Transfer",
  CreditCardPayment = "CreditCardPayment",
}

export enum AutoApplyAction {
  RETRY_LATER = "RETRY_LATER",
  SKIP_AND_RESCHEDULE = "SKIP_AND_RESCHEDULE",
  DISABLED_AUTO_APPLY = "DISABLED_AUTO_APPLY",
}

// Constants for validation rules
export const RECURRING_CONSTANTS = {
  FAILED_ATTEMPTS: {
    MIN: 1,
    MAX: 10,
    DEFAULT: 3,
  },
  AMOUNT: {
    MIN: 0.01,
  },
  AUTO_APPLY: {
    DEFAULT_ENABLED: false,
    MAX_BATCH_SIZE: 50,
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3,
  },
} as const;

// Recurring type display names and descriptions
export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
  [RecurringType.Standard]: "Standard Transaction",
  [RecurringType.Transfer]: "Account Transfer",
  [RecurringType.CreditCardPayment]: "Credit Card Payment",
};

export const RECURRING_TYPE_DESCRIPTIONS: Record<RecurringType, string> = {
  [RecurringType.Standard]: "Regular income or expense transaction",
  [RecurringType.Transfer]: "Transfer money between your accounts",
  [RecurringType.CreditCardPayment]: "Automatically pay credit card statement balance",
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  INTERVAL_MONTHS_RANGE: `Interval months must be between ${1} and ${24}`,
  TRANSFER_ACCOUNT_REQUIRED: "Transfer account is required for transfer transactions",
  TRANSFER_ACCOUNTS_DIFFERENT: "Transfer account must be different from source account",
  AMOUNT_REQUIRED: "Amount is required when amount is not flexible",
  AMOUNT_MIN: `Amount must be at least ${RECURRING_CONSTANTS.AMOUNT.MIN}`,
  DATE_REQUIRED: "Next occurrence date is required when date is not flexible",
  BOTH_FLEXIBLE: "Both amount and date can be flexible for maximum execution flexibility",
  MAX_FAILED_ATTEMPTS_RANGE: `Max failed attempts must be between ${RECURRING_CONSTANTS.FAILED_ATTEMPTS.MIN} and ${RECURRING_CONSTANTS.FAILED_ATTEMPTS.MAX}`,
  SOURCE_ACCOUNT_REQUIRED: "Source account is required for credit card payments",
  INVALID_RECURRING_TYPE: "Invalid recurring transaction type",
} as const;

// Validation constraints
export const RecurringValidationRules = {
  intervalMonths: {
    min: 1,
    max: 24,
    required: true,
    type: "integer" as const,
  },
  recurringType: {
    required: true,
    enum: Object.values(RecurringType) as readonly RecurringType[],
  },
  transferAccountId: {
    requiredIf: (data: Partial<Recurring>) => data.recurringtype === RecurringType.Transfer,
    mustBeDifferentFrom: "sourceaccountid" as const,
  },
  amount: {
    requiredIf: (data: Partial<Recurring>) => !data.isamountflexible,
    min: RECURRING_CONSTANTS.AMOUNT.MIN,
  },
  nextOccurrenceDate: {
    requiredIf: (data: Partial<Recurring>) => !data.isdateflexible,
    futureDate: true,
  },
  maxFailedAttempts: {
    min: RECURRING_CONSTANTS.FAILED_ATTEMPTS.MIN,
    max: RECURRING_CONSTANTS.FAILED_ATTEMPTS.MAX,
    default: RECURRING_CONSTANTS.FAILED_ATTEMPTS.DEFAULT,
  },
} as const;

// Helper type for validation
export type ValidationRule<T = any> = {
  required?: boolean;
  min?: number;
  max?: number;
  type?: "integer" | "string" | "boolean" | "date";
  enum?: readonly T[];
  requiredIf?: (data: Partial<Recurring>) => boolean;
  mustBeDifferentFrom?: string;
  futureDate?: boolean;
  default?: T;
};

// Auto-apply result types
export interface AutoApplyResult {
  appliedCount: number;
  failedCount: number;
  pendingCount: number;
  appliedTransactions: any[]; // Will be Transaction[] when transaction types are available
  failedTransactions: { recurring: Recurring; error: string }[];
  pendingTransactions: Recurring[];
}

export interface ApplyResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  recurring: Recurring;
}

export interface BatchApplyResult {
  results: ApplyResult[];
  summary: AutoApplyResult;
}

// Auto-apply settings
export interface AutoApplySettings {
  globalEnabled: boolean;
  maxBatchSize: number;
  timeoutMs: number;
  retryAttempts: number;
}

// Default auto-apply settings
export const DEFAULT_AUTO_APPLY_SETTINGS: AutoApplySettings = {
  globalEnabled: true,
  maxBatchSize: RECURRING_CONSTANTS.AUTO_APPLY.MAX_BATCH_SIZE,
  timeoutMs: RECURRING_CONSTANTS.AUTO_APPLY.TIMEOUT_MS,
  retryAttempts: RECURRING_CONSTANTS.AUTO_APPLY.RETRY_ATTEMPTS,
};

// Execution types
export interface ExecutionOverrides {
  amount?: number;
  date?: string;
  description?: string;
  notes?: string;
}

export interface ExecutionPreview {
  recurring: Recurring;
  estimatedAmount: number;
  estimatedDate: string;
  sourceAccount: any; // Will be Account type when available
  destinationAccount?: any; // For transfers
  warnings: string[];
}

// Request types for specialized creation
export interface CreateTransferRequest extends Omit<Inserts<TableNames.Recurrings>, "recurringtype"> {
  transferaccountid: string;
  recurringtype: RecurringType.Transfer;
}

export interface CreateCreditCardPaymentRequest
  extends Omit<Inserts<TableNames.Recurrings>, "recurringtype" | "amount"> {
  recurringtype: RecurringType.CreditCardPayment;
  sourceaccountid: string; // Payment source account
  categoryid: string; // Should reference a liability account category
  amount?: number | null; // Nullable for credit card payments - calculated at execution time
}

// Filter types
export interface RecurringFilters {
  recurringType?: RecurringType;
  autoApplyEnabled?: boolean;
  isActive?: boolean;
  isDue?: boolean;
  asOfDate?: Date;
}

// Status types
export interface AutoApplyStatus {
  totalRecurring: number;
  autoApplyEnabled: number;
  dueTransactions: number;
  failedTransactions: number;
  lastRunAt?: string;
}

// Error handling types
export class RecurringValidationError extends Error {
  constructor(
    public field: string,
    public rule: string,
    public value: any,
    message: string,
  ) {
    super(message);
    this.name = "RecurringValidationError";
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: RecurringValidationError[];
}

export interface ErrorHandlingResult {
  action: AutoApplyAction;
  message: string;
}
