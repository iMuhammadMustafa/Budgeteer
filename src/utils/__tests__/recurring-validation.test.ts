import { describe, it, expect } from "@jest/globals";
import {
  validateRecurring,
  validateTransferRecurring,
  validateCreditCardPaymentRecurring,
  calculateNextOccurrence,
  validateAccountBalance,
  validateExecutionContext,
  validateDate,
} from "../recurring-validation";
import { RecurringType } from "@/src/types/recurring";
import { CreateTransferRequest, CreateCreditCardPaymentRequest, Recurring } from "@/src/types/recurring";
import dayjs from "dayjs";

describe("recurring-validation", () => {
  // Define valid recurring data for reuse in tests
  const validRecurring = {
    name: "Test Recurring",
    sourceaccountid: "account-1",
    amount: 100,
    intervalmonths: 1,
    recurringtype: RecurringType.Standard,
    nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
    isamountflexible: false,
    isdateflexible: false,
    maxfailedattempts: 3,
  };

  describe("validateRecurring", () => {
    it("should validate a valid recurring transaction", () => {
      const result = validateRecurring(validRecurring);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation for invalid interval months", () => {
      const invalidData = {
        ...validRecurring,
        intervalmonths: 25, // Exceeds maximum
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "intervalmonths" && e.rule === "range")).toBe(true);
    });

    it("should fail validation for invalid recurring type", () => {
      const invalidData = {
        ...validRecurring,
        recurringtype: "InvalidType" as any,
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "recurringtype" && e.rule === "enum")).toBe(true);
    });

    it("should fail validation when transfer account is missing for transfer type", () => {
      const invalidData = {
        recurringtype: RecurringType.Transfer,
        sourceaccountid: "account-1",
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "transferaccountid")).toBe(true);
    });

    it("should fail validation when transfer account is same as source account", () => {
      const invalidData = {
        recurringtype: RecurringType.Transfer,
        sourceaccountid: "account-1",
        transferaccountid: "account-1", // Same as source
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "transferaccountid" && e.rule === "different")).toBe(true);
    });

    it("should fail validation when source account is missing for credit card payment", () => {
      const invalidData = {
        recurringtype: RecurringType.CreditCardPayment,
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "sourceaccountid")).toBe(true);
    });

    it("should fail validation when amount is required but missing", () => {
      const invalidData = {
        recurringtype: RecurringType.Standard,
        sourceaccountid: "account-1",
        intervalmonths: 1,
        isamountflexible: false, // Amount is required
        isdateflexible: false,
        // amount is missing
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "amount" && e.rule === "required")).toBe(true);
    });

    it("should fail validation when amount is below minimum", () => {
      const invalidData = {
        recurringtype: RecurringType.Standard,
        sourceaccountid: "account-1",
        amount: 0, // Below minimum
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "amount" && e.rule === "min")).toBe(true);
    });

    it("should fail validation when date is required but missing", () => {
      const invalidData = {
        recurringtype: RecurringType.Standard,
        sourceaccountid: "account-1",
        amount: 100,
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false, // Date is required
        // nextoccurrencedate is missing
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "nextoccurrencedate" && e.rule === "required")).toBe(true);
    });

    it("should allow validation when both amount and date are flexible", () => {
      const validData = {
        recurringtype: RecurringType.Standard,
        sourceaccountid: "account-1",
        intervalmonths: 1,
        isamountflexible: true,
        isdateflexible: true, // Both flexible - now allowed for maximum flexibility
        name: "Flexible Transaction",
        tenantid: "tenant-1",
        recurrencerule: "",
        nextoccurrencedate: "2099-12-31", // Placeholder for flexible date
        currencycode: "USD",
        type: "Expense",
        isactive: true,
        isdeleted: false,
      };

      const result = validateRecurring(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it("should fail validation for invalid max failed attempts", () => {
      const invalidData = {
        recurringtype: RecurringType.Standard,
        sourceaccountid: "account-1",
        amount: 100,
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 15, // Exceeds maximum
      };

      const result = validateRecurring(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "maxfailedattempts" && e.rule === "range")).toBe(true);
    });
  });

  describe("validateTransferRecurring", () => {
    it("should validate a valid transfer recurring transaction", () => {
      const validTransfer: CreateTransferRequest = {
        name: "Monthly Transfer",
        sourceaccountid: "account-1",
        transferaccountid: "account-2",
        amount: 500,
        recurringtype: RecurringType.Transfer,
        nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 3,
      };

      const result = validateTransferRecurring(validTransfer);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation when transfer account is missing", () => {
      const invalidTransfer: CreateTransferRequest = {
        name: "Monthly Transfer",
        sourceaccountid: "account-1",
        transferaccountid: "", // Missing
        amount: 500,
        recurringtype: RecurringType.Transfer,
        nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 3,
      };

      const result = validateTransferRecurring(invalidTransfer);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "transferaccountid" && e.rule === "required")).toBe(true);
    });

    it("should fail validation when transfer account is same as source", () => {
      const invalidTransfer: CreateTransferRequest = {
        name: "Monthly Transfer",
        sourceaccountid: "account-1",
        transferaccountid: "account-1", // Same as source
        amount: 500,
        recurringtype: RecurringType.Transfer,
        nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 3,
      };

      const result = validateTransferRecurring(invalidTransfer);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "transferaccountid" && e.rule === "different")).toBe(true);
    });
  });

  describe("validateCreditCardPaymentRecurring", () => {
    it("should validate a valid credit card payment recurring transaction", () => {
      const validPayment: CreateCreditCardPaymentRequest = {
        name: "Credit Card Payment",
        sourceaccountid: "checking-account",
        categoryid: "credit-card-category",
        recurringtype: RecurringType.CreditCardPayment,
        nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
        intervalmonths: 1,
        isamountflexible: true,
        isdateflexible: false,
        maxfailedattempts: 3,
      };

      const result = validateCreditCardPaymentRecurring(validPayment);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation when source account is missing", () => {
      const invalidPayment: CreateCreditCardPaymentRequest = {
        name: "Credit Card Payment",
        sourceaccountid: "", // Missing
        categoryid: "credit-card-category",
        recurringtype: RecurringType.CreditCardPayment,
        nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
        intervalmonths: 1,
        isamountflexible: true,
        isdateflexible: false,
        maxfailedattempts: 3,
      };

      const result = validateCreditCardPaymentRecurring(invalidPayment);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "sourceaccountid" && e.rule === "required")).toBe(true);
    });

    it("should fail validation when category is missing", () => {
      const invalidPayment: CreateCreditCardPaymentRequest = {
        name: "Credit Card Payment",
        sourceaccountid: "checking-account",
        categoryid: "", // Missing
        recurringtype: RecurringType.CreditCardPayment,
        nextoccurrencedate: dayjs().add(1, "month").format("YYYY-MM-DD"),
        intervalmonths: 1,
        isamountflexible: true,
        isdateflexible: false,
        maxfailedattempts: 3,
      };

      const result = validateCreditCardPaymentRecurring(invalidPayment);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === "categoryid" && e.rule === "required")).toBe(true);
    });
  });

  describe("calculateNextOccurrence", () => {
    it("should calculate next occurrence for 1 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 1);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should calculate next occurrence for 3 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 3);

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(3); // April (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("should handle month-end dates correctly", () => {
      const currentDate = new Date("2024-01-31T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 1);

      // February doesn't have 31 days, so it should be the last day of February
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(29); // 2024 is a leap year
    });

    it("should calculate next occurrence for 12 month interval", () => {
      const currentDate = new Date("2024-01-15T00:00:00.000Z");
      const result = calculateNextOccurrence(currentDate, 12);

      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
    });
  });

  describe("validateAccountBalance", () => {
    it("should validate sufficient balance for asset account", () => {
      const result = validateAccountBalance(1000, 500, "Asset");

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should fail validation for insufficient balance in asset account", () => {
      const result = validateAccountBalance(300, 500, "Asset");

      expect(result.isValid).toBe(false);
      expect(result.message).toContain("Insufficient funds: 300 < 500");
    });

    it("should allow overdraft for liability accounts", () => {
      const result = validateAccountBalance(100, 500, "Liability");

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should allow overdraft when explicitly enabled", () => {
      const result = validateAccountBalance(100, 500, "Asset", true);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe("validateExecutionContext", () => {
    const baseRecurring: Recurring = {
      id: "recurring-1",
      name: "Test Recurring",
      sourceaccountid: "account-1",
      recurringtype: RecurringType.Standard,
      isactive: true,
      isdeleted: false,
      isamountflexible: false,
      amount: 100,
      failedattempts: 0,
      maxfailedattempts: 3,
      tenantid: "tenant-1",
      createdby: "user-1",
      createdat: dayjs().toISOString(),
    } as Recurring;

    it("should validate active recurring transaction", () => {
      const result = validateExecutionContext(baseRecurring);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation for inactive recurring transaction", () => {
      const inactiveRecurring = { ...baseRecurring, isactive: false };
      const result = validateExecutionContext(inactiveRecurring);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Recurring transaction is not active");
    });

    it("should fail validation for deleted recurring transaction", () => {
      const deletedRecurring = { ...baseRecurring, isdeleted: true };
      const result = validateExecutionContext(deletedRecurring);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Recurring transaction has been deleted");
    });

    it("should fail validation when amount is required but missing", () => {
      const noAmountRecurring = { ...baseRecurring, amount: undefined, isamountflexible: false };
      const result = validateExecutionContext(noAmountRecurring);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Amount is required for execution");
    });

    it("should pass validation when override amount is provided", () => {
      const noAmountRecurring = { ...baseRecurring, amount: undefined, isamountflexible: false };
      const result = validateExecutionContext(noAmountRecurring, 200);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation when max failed attempts exceeded", () => {
      const failedRecurring = { ...baseRecurring, failedattempts: 3, maxfailedattempts: 3 };
      const result = validateExecutionContext(failedRecurring);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Recurring transaction has exceeded maximum failed attempts (3/3)");
    });

    it("should fail validation when end date has passed", () => {
      const expiredRecurring = { ...baseRecurring, enddate: dayjs().subtract(1, "day").format("YYYY-MM-DD") };
      const result = validateExecutionContext(expiredRecurring);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Recurring transaction end date has passed");
    });
  });

  describe("validateDate", () => {
    it("should validate a valid date string", () => {
      const result = validateDate("2024-12-25");

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should fail validation for invalid date string", () => {
      const result = validateDate("invalid-date");

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Invalid date format");
    });

    it("should validate future date when required", () => {
      const futureDate = dayjs().add(1, "day").format("YYYY-MM-DD");
      const result = validateDate(futureDate, true);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it("should fail validation for past date when future is required", () => {
      const pastDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      const result = validateDate(pastDate, true);

      expect(result.isValid).toBe(false);
      expect(result.message).toBe("Date must be in the future");
    });

    it("should allow past date when future is not required", () => {
      const pastDate = dayjs().subtract(1, "day").format("YYYY-MM-DD");
      const result = validateDate(pastDate, false);

      expect(result.isValid).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });
});
