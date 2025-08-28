import { Recurring, RecurringInsert, RecurringUpdate } from "./db/sqllite/schema";
import { RecurringType, RECURRING_CONSTANTS } from "./enums/recurring";

// Consolidated recurring transaction types - no more "Enhanced" prefix
export type { Recurring, RecurringInsert, RecurringUpdate };

// Validation constraints
export const RecurringValidationRules = {
  intervalMonths: {
    min: RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN,
    max: RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX,
    required: true,
    type: 'integer' as const
  },
  recurringType: {
    required: true,
    enum: Object.values(RecurringType) as readonly RecurringType[]
  },
  transferAccountId: {
    requiredIf: (data: Partial<Recurring>) => data.recurringtype === RecurringType.Transfer,
    mustBeDifferentFrom: 'sourceaccountid' as const
  },
  amount: {
    requiredIf: (data: Partial<Recurring>) => !data.isamountflexible,
    min: RECURRING_CONSTANTS.AMOUNT.MIN
  },
  nextOccurrenceDate: {
    requiredIf: (data: Partial<Recurring>) => !data.isdateflexible,
    futureDate: true
  },
  maxFailedAttempts: {
    min: RECURRING_CONSTANTS.FAILED_ATTEMPTS.MIN,
    max: RECURRING_CONSTANTS.FAILED_ATTEMPTS.MAX,
    default: RECURRING_CONSTANTS.FAILED_ATTEMPTS.DEFAULT
  }
} as const;

// Helper type for validation
export type ValidationRule<T = any> = {
  required?: boolean;
  min?: number;
  max?: number;
  type?: 'integer' | 'string' | 'boolean' | 'date';
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
  retryAttempts: RECURRING_CONSTANTS.AUTO_APPLY.RETRY_ATTEMPTS
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
export interface CreateTransferRequest extends Omit<RecurringInsert, 'recurringtype'> {
  transferaccountid: string;
  recurringtype: RecurringType.Transfer;
}

export interface CreateCreditCardPaymentRequest extends Omit<RecurringInsert, 'recurringtype' | 'amount'> {
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
    message: string
  ) {
    super(message);
    this.name = 'RecurringValidationError';
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: RecurringValidationError[];
}

export interface ErrorHandlingResult {
  action: 'RETRY_LATER' | 'SKIP_AND_RESCHEDULE' | 'DISABLED_AUTO_APPLY';
  message: string;
}