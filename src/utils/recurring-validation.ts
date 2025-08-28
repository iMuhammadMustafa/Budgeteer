import {
  Recurring,
  RecurringInsert,
  CreateTransferRequest,
  CreateCreditCardPaymentRequest,
  ValidationResult,
  RecurringValidationError,
} from "@/src/types/recurring";
import { RecurringType, VALIDATION_MESSAGES, RECURRING_CONSTANTS } from "@/src/types/recurring";
import dayjs from "dayjs";

/**
 * Validate recurring transaction data
 */
export function validateRecurring(data: Partial<Recurring>): ValidationResult {
  const errors: RecurringValidationError[] = [];

  // Validate interval months
  if (data.intervalmonths) {
    if (
      data.intervalmonths < RECURRING_CONSTANTS.INTERVAL_MONTHS.MIN ||
      data.intervalmonths > RECURRING_CONSTANTS.INTERVAL_MONTHS.MAX
    ) {
      errors.push(
        new RecurringValidationError(
          "intervalmonths",
          "range",
          data.intervalmonths,
          VALIDATION_MESSAGES.INTERVAL_MONTHS_RANGE,
        ),
      );
    }
  }

  // Validate recurring type
  if (data.recurringtype && !Object.values(RecurringType).includes(data.recurringtype as RecurringType)) {
    errors.push(
      new RecurringValidationError(
        "recurringtype",
        "enum",
        data.recurringtype,
        VALIDATION_MESSAGES.INVALID_RECURRING_TYPE,
      ),
    );
  }

  // Validate transfer account for transfer transactions
  if (data.recurringtype === RecurringType.Transfer) {
    if (!data.transferaccountid) {
      errors.push(
        new RecurringValidationError(
          "transferaccountid",
          "required",
          data.transferaccountid,
          VALIDATION_MESSAGES.TRANSFER_ACCOUNT_REQUIRED,
        ),
      );
    }

    if (data.transferaccountid === data.sourceaccountid) {
      errors.push(
        new RecurringValidationError(
          "transferaccountid",
          "different",
          data.transferaccountid,
          VALIDATION_MESSAGES.TRANSFER_ACCOUNTS_DIFFERENT,
        ),
      );
    }
  }

  // Validate source account for credit card payments
  if (data.recurringtype === RecurringType.CreditCardPayment) {
    if (!data.sourceaccountid) {
      errors.push(
        new RecurringValidationError(
          "sourceaccountid",
          "required",
          data.sourceaccountid,
          VALIDATION_MESSAGES.SOURCE_ACCOUNT_REQUIRED,
        ),
      );
    }

    if (!data.categoryid) {
      errors.push(
        new RecurringValidationError(
          "categoryid",
          "required",
          data.categoryid,
          "Category is required for credit card payments",
        ),
      );
    }

    if (!data.transferaccountid) {
      errors.push(
        new RecurringValidationError(
          "transferaccountid",
          "required",
          data.transferaccountid,
          "Credit card account is required for credit card payments",
        ),
      );
    }

    // Validate that source and credit card accounts are different
    if (data.sourceaccountid === data.transferaccountid) {
      errors.push(
        new RecurringValidationError(
          "transferaccountid",
          "different",
          data.transferaccountid,
          "Source account and credit card account must be different",
        ),
      );
    }
  }

  // Validate amount requirements (credit card payments can have null amounts)
  if (
    !data.isamountflexible &&
    data.recurringtype !== RecurringType.CreditCardPayment &&
    (data.amount === undefined || data.amount === null)
  ) {
    errors.push(new RecurringValidationError("amount", "required", data.amount, VALIDATION_MESSAGES.AMOUNT_REQUIRED));
  }

  if (data.amount !== undefined && data.amount !== null && data.amount < RECURRING_CONSTANTS.AMOUNT.MIN) {
    errors.push(new RecurringValidationError("amount", "min", data.amount, VALIDATION_MESSAGES.AMOUNT_MIN));
  }

  // Validate date requirements
  if (!data.isdateflexible && !data.nextoccurrencedate) {
    errors.push(
      new RecurringValidationError(
        "nextoccurrencedate",
        "required",
        data.nextoccurrencedate,
        VALIDATION_MESSAGES.DATE_REQUIRED,
      ),
    );
  }

  // Note: Both flexible date and flexible amount are now allowed simultaneously
  // This enables manual scheduling with custom amounts at execution time

  // Validate max failed attempts
  if (data.maxfailedattempts) {
    if (
      data.maxfailedattempts < RECURRING_CONSTANTS.FAILED_ATTEMPTS.MIN ||
      data.maxfailedattempts > RECURRING_CONSTANTS.FAILED_ATTEMPTS.MAX
    ) {
      errors.push(
        new RecurringValidationError(
          "maxfailedattempts",
          "range",
          data.maxfailedattempts,
          VALIDATION_MESSAGES.MAX_FAILED_ATTEMPTS_RANGE,
        ),
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate transfer recurring transaction
 */
export function validateTransferRecurring(data: CreateTransferRequest): ValidationResult {
  const errors: RecurringValidationError[] = [];

  // Validate transfer-specific requirements
  if (!data.transferaccountid) {
    errors.push(
      new RecurringValidationError(
        "transferaccountid",
        "required",
        data.transferaccountid,
        VALIDATION_MESSAGES.TRANSFER_ACCOUNT_REQUIRED,
      ),
    );
  }

  if (data.transferaccountid === data.sourceaccountid) {
    errors.push(
      new RecurringValidationError(
        "transferaccountid",
        "different",
        data.transferaccountid,
        VALIDATION_MESSAGES.TRANSFER_ACCOUNTS_DIFFERENT,
      ),
    );
  }

  // Validate common recurring fields
  const commonValidation = validateRecurring(data);
  errors.push(...commonValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate credit card payment recurring transaction
 */
export function validateCreditCardPaymentRecurring(data: CreateCreditCardPaymentRequest): ValidationResult {
  const errors: RecurringValidationError[] = [];

  // Validate credit card payment-specific requirements
  if (!data.sourceaccountid) {
    errors.push(
      new RecurringValidationError(
        "sourceaccountid",
        "required",
        data.sourceaccountid,
        VALIDATION_MESSAGES.SOURCE_ACCOUNT_REQUIRED,
      ),
    );
  }

  if (!data.categoryid) {
    errors.push(
      new RecurringValidationError(
        "categoryid",
        "required",
        data.categoryid,
        "Category is required for credit card payments",
      ),
    );
  }

  if (!data.transferaccountid) {
    errors.push(
      new RecurringValidationError(
        "transferaccountid",
        "required",
        data.transferaccountid,
        "Credit card account is required for credit card payments",
      ),
    );
  }

  // Validate that source and credit card accounts are different
  if (data.sourceaccountid === data.transferaccountid) {
    errors.push(
      new RecurringValidationError(
        "transferaccountid",
        "different",
        data.transferaccountid,
        "Source account and credit card account must be different",
      ),
    );
  }

  // Validate common recurring fields
  const commonValidation = validateRecurring(data);
  errors.push(...commonValidation.errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate next occurrence date based on interval months
 * @deprecated Use calculateNextOccurrence from interval-calculation.ts instead
 */
export function calculateNextOccurrence(currentDate: Date, intervalMonths: number): Date {
  // Import the enhanced version to maintain backward compatibility
  const { calculateNextOccurrence: enhancedCalculateNextOccurrence } = require("./interval-calculation");
  return enhancedCalculateNextOccurrence(currentDate, intervalMonths);
}

/**
 * Validate account balance for transaction
 */
export function validateAccountBalance(
  accountBalance: number,
  transactionAmount: number,
  accountType: string,
  allowOverdraft: boolean = false,
): { isValid: boolean; message?: string } {
  if (accountType === "Liability" || allowOverdraft) {
    return { isValid: true };
  }

  if (accountBalance < transactionAmount) {
    return {
      isValid: false,
      message: `Insufficient funds: ${accountBalance} < ${transactionAmount}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate recurring transaction execution context
 */
export function validateExecutionContext(
  recurring: Recurring,
  overrideAmount?: number,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if recurring is active
  if (!recurring.isactive) {
    errors.push("Recurring transaction is not active");
  }

  // Check if recurring is deleted
  if (recurring.isdeleted) {
    errors.push("Recurring transaction has been deleted");
  }

  // Check if amount is provided when required
  if (!recurring.isamountflexible && !overrideAmount && !recurring.amount) {
    errors.push("Amount is required for execution");
  }

  // Check if recurring has exceeded max failed attempts
  if (
    recurring.failedattempts &&
    recurring.maxfailedattempts &&
    recurring.failedattempts >= recurring.maxfailedattempts
  ) {
    errors.push(
      `Recurring transaction has exceeded maximum failed attempts (${recurring.failedattempts}/${recurring.maxfailedattempts})`,
    );
  }

  // Check if end date has passed
  if (recurring.enddate && dayjs().isAfter(dayjs(recurring.enddate))) {
    errors.push("Recurring transaction end date has passed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date format and future date requirement
 */
export function validateDate(
  dateString: string,
  requireFuture: boolean = false,
): { isValid: boolean; message?: string } {
  const date = dayjs(dateString);

  if (!date.isValid()) {
    return {
      isValid: false,
      message: "Invalid date format",
    };
  }

  if (requireFuture && date.isBefore(dayjs(), "day")) {
    return {
      isValid: false,
      message: "Date must be in the future",
    };
  }

  return { isValid: true };
}
