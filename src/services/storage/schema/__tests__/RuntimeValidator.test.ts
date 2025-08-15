/**
 * Tests for Runtime Validation Utilities
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { runtimeValidator, ValidationResult, ValidationOptions } from "../RuntimeValidator";
import { ForeignKeyDataProvider } from "../SchemaValidator";
import { TableNames } from "@/src/types/db/TableNames";

// Mock data provider for testing
class MockDataProvider implements ForeignKeyDataProvider {
  private mockData: Map<string, Set<string>> = new Map();

  constructor() {
    this.mockData.set("accountcategories", new Set(["cat1", "cat2"]));
    this.mockData.set("accounts", new Set(["acc1", "acc2"]));
    this.mockData.set("transactiongroups", new Set(["group1", "group2"]));
    this.mockData.set("transactioncategories", new Set(["tcat1", "tcat2"]));
    this.mockData.set("transactions", new Set(["trans1", "trans2"]));
  }

  async recordExists(tableName: string, fieldName: string, value: any): Promise<boolean> {
    const tableData = this.mockData.get(tableName);
    return tableData ? tableData.has(value) : false;
  }
}

describe("RuntimeValidator", () => {
  let mockDataProvider: MockDataProvider;

  beforeEach(() => {
    mockDataProvider = new MockDataProvider();
  });

  describe("validateCreate", () => {
    it("should validate valid account creation", async () => {
      const accountData = {
        name: "Test Account",
        categoryid: "cat1",
        balance: 100.5,
        currency: "USD",
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("accounts", accountData, mockDataProvider);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect validation errors in account creation", async () => {
      const invalidAccountData = {
        name: "Test Account",
        categoryid: "nonexistent", // Invalid foreign key
        balance: 100.5,
        currency: "INVALID", // Invalid currency format
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("accounts", invalidAccountData, mockDataProvider);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate transaction creation with business rules", async () => {
      const transactionData = {
        accountid: "acc1",
        categoryid: "tcat1",
        date: "2024-01-01",
        amount: 100,
        type: "Transfer" as "Transfer",
        transferaccountid: "acc2",
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("transactions", transactionData, mockDataProvider);

      expect(result.isValid).toBe(true);
    });

    it("should detect transfer transaction without transfer account", async () => {
      const invalidTransferData = {
        accountid: "acc1",
        categoryid: "tcat1",
        date: "2024-01-01",
        amount: 100,
        type: "Transfer" as "Transfer",
        // Missing transferaccountid
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("transactions", invalidTransferData, mockDataProvider);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "MISSING_TRANSFER_ACCOUNT")).toBe(true);
    });

    it("should detect same account transfer", async () => {
      const invalidTransferData = {
        accountid: "acc1",
        categoryid: "tcat1",
        date: "2024-01-01",
        amount: 100,
        type: "Transfer" as "Transfer",
        transferaccountid: "acc1", // Same as accountid
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("transactions", invalidTransferData, mockDataProvider);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_TRANSFER_ACCOUNT")).toBe(true);
    });
  });

  describe("validateUpdate", () => {
    it("should validate valid account update", async () => {
      const updateData = {
        name: "Updated Account Name",
        balance: 200.75,
      };

      const result = await runtimeValidator.validateUpdate("accounts", updateData, mockDataProvider);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate partial updates", async () => {
      const partialUpdateData = {
        balance: 300.0,
      };

      const result = await runtimeValidator.validateUpdate("accounts", partialUpdateData, mockDataProvider);

      expect(result.isValid).toBe(true);
    });

    it("should detect invalid currency in update", async () => {
      const invalidUpdateData = {
        currency: "INVALID_CURRENCY",
      };

      const result = await runtimeValidator.validateUpdate("accounts", invalidUpdateData, mockDataProvider);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_CURRENCY_FORMAT")).toBe(true);
    });
  });

  describe("validateDelete", () => {
    it("should validate deletion of existing record", async () => {
      const result = await runtimeValidator.validateDelete("accounts", "acc1", mockDataProvider);

      expect(result.isValid).toBe(true);
    });

    it("should detect deletion of non-existent record", async () => {
      const result = await runtimeValidator.validateDelete("accounts", "nonexistent", mockDataProvider);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "RECORD_NOT_FOUND")).toBe(true);
    });

    it("should warn about dependent records", async () => {
      // Mock that acc1 has dependent transactions
      const mockProviderWithDependents = new MockDataProvider();
      mockProviderWithDependents.recordExists = async (table, field, value) => {
        if (table === "accounts" && value === "acc1") return true;
        if (table === "transactions" && field === "accountid" && value === "acc1") return true;
        return false;
      };

      const result = await runtimeValidator.validateDelete("accounts", "acc1", mockProviderWithDependents);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes("dependent records"))).toBe(true);
    });
  });

  describe("business rule validation", () => {
    it("should warn about negative account balance", async () => {
      const accountData = {
        name: "Test Account",
        categoryid: "cat1",
        balance: -100.5, // Negative balance
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("accounts", accountData, mockDataProvider);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes("negative"))).toBe(true);
    });

    it("should warn about zero transaction amount", async () => {
      const transactionData = {
        accountid: "acc1",
        categoryid: "tcat1",
        date: "2024-01-01",
        amount: 0, // Zero amount
        tenantid: "tenant1",
      };

      const result = await runtimeValidator.validateCreate("transactions", transactionData, mockDataProvider);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes("zero"))).toBe(true);
    });

    it("should validate recurring transaction rules", async () => {
      const recurringData = {
        name: "Monthly Rent",
        sourceaccountid: "acc1",
        tenantid: "tenant1",
        nextoccurrencedate: "2024-12-01", // Future date
        enddate: "2025-12-01", // After next occurrence
        recurrencerule: "FREQ=MONTHLY",
        type: "Expense" as "Expense",
      };

      const result = await runtimeValidator.validateCreate("recurrings", recurringData, mockDataProvider);

      expect(result.isValid).toBe(true);
    });

    it("should detect invalid recurring end date", async () => {
      const invalidRecurringData = {
        name: "Monthly Rent",
        sourceaccountid: "acc1",
        tenantid: "tenant1",
        nextoccurrencedate: "2024-12-01",
        enddate: "2024-11-01", // Before next occurrence
        recurrencerule: "FREQ=MONTHLY",
        type: "Expense" as "Expense",
      };

      const result = await runtimeValidator.validateCreate("recurrings", invalidRecurringData, mockDataProvider);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.code === "INVALID_END_DATE")).toBe(true);
    });
  });

  describe("validation options", () => {
    it("should skip foreign key validation when requested", async () => {
      const accountData = {
        name: "Test Account",
        categoryid: "nonexistent", // Would normally fail
        tenantid: "tenant1",
      };

      const options: ValidationOptions = {
        skipForeignKeyValidation: true,
      };

      const result = await runtimeValidator.validateCreate("accounts", accountData, mockDataProvider, options);

      expect(result.isValid).toBe(true);
    });

    it("should skip type validation when requested", async () => {
      const accountData = {
        name: "Test Account",
        categoryid: "cat1",
        balance: "invalid_number", // Would normally fail type validation
        tenantid: "tenant1",
      };

      const options: ValidationOptions = {
        skipTypeValidation: true,
      };

      const result = await runtimeValidator.validateCreate("accounts", accountData, mockDataProvider, options);

      // Should still fail due to schema validation, but type validation is skipped
      expect(result.isValid).toBe(false);
    });
  });

  describe("batch validation", () => {
    it("should validate multiple records", async () => {
      const records = [
        {
          name: "Account 1",
          categoryid: "cat1",
          balance: 100,
          tenantid: "tenant1",
        },
        {
          name: "Account 2",
          categoryid: "cat2",
          balance: 200,
          tenantid: "tenant1",
        },
      ];

      const results = await runtimeValidator.validateBatch("accounts", records, "create", mockDataProvider);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.isValid)).toBe(true);
    });

    it("should detect errors in batch validation", async () => {
      const records = [
        {
          name: "Valid Account",
          categoryid: "cat1",
          balance: 100,
          tenantid: "tenant1",
        },
        {
          name: "Invalid Account",
          categoryid: "nonexistent", // Invalid
          balance: 200,
          tenantid: "tenant1",
        },
      ];

      const results = await runtimeValidator.validateBatch("accounts", records, "create", mockDataProvider);

      expect(results).toHaveLength(2);
      expect(results[0].isValid).toBe(true);
      expect(results[1].isValid).toBe(false);
    });
  });
});
