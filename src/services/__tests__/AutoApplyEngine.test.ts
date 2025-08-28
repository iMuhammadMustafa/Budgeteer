import dayjs from "dayjs";
import { AutoApplyEngine, IAutoApplyEngine } from "../AutoApplyEngine";

// Mock UUID
jest.mock("uuid", () => ({ v7: () => "00000000-0000-0000-0000-000000000000" }));
import { Recurring, AutoApplyResult, DEFAULT_AUTO_APPLY_SETTINGS } from "@/src/types/recurring";
import { RecurringType, RECURRING_CONSTANTS } from "@/src/types/components/recurring";
import { IRecurringRepository } from "@/src/repositories/interfaces/IRecurringRepository";
import { ITransactionRepository } from "@/src/repositories/interfaces/ITransactionRepository";
import { IAccountRepository } from "@/src/repositories/interfaces/IAccountRepository";

// Mock repositories
const mockRecurringRepo = {
  findDueRecurringTransactions: jest.fn(),
  updateNextOccurrenceDates: jest.fn(),
  incrementFailedAttempts: jest.fn(),
  resetFailedAttempts: jest.fn(),
  updateAutoApplyStatus: jest.fn(),
  updateEnhanced: jest.fn(),
} as unknown as IRecurringRepository;

const mockTransactionRepo = {
  create: jest.fn(),
  createMultipleTransactions: jest.fn(),
} as unknown as ITransactionRepository;

const mockAccountRepo = {
  updateAccountBalance: jest.fn(),
  findById: jest.fn(),
} as unknown as IAccountRepository;

describe("AutoApplyEngine", () => {
  let autoApplyEngine: IAutoApplyEngine;
  const tenantId = "test-tenant-id";
  const userId = "test-user-id";

  beforeEach(() => {
    jest.clearAllMocks();
    autoApplyEngine = new AutoApplyEngine(mockRecurringRepo, mockTransactionRepo, mockAccountRepo);
  });

  describe("checkAndApplyDueTransactions", () => {
    it("should return empty result when no due transactions exist", async () => {
      (mockRecurringRepo.findDueRecurringTransactions as jest.Mock).mockResolvedValue([]);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result).toEqual({
        appliedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: [],
      });
    });

    it("should process auto-apply enabled transactions and mark others as pending", async () => {
      const dueTransactions: Recurring[] = [
        createMockRecurring({ id: "1", autoapplyenabled: true }),
        createMockRecurring({ id: "2", autoapplyenabled: false }),
        createMockRecurring({ id: "3", autoapplyenabled: true }),
      ];

      (mockRecurringRepo.findDueRecurringTransactions as jest.Mock).mockResolvedValue(dueTransactions);
      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result.appliedCount).toBe(2);
      expect(result.pendingCount).toBe(1);
      expect(result.failedCount).toBe(0);
    });

    it("should return empty result when global auto-apply is disabled", async () => {
      const engine = new AutoApplyEngine(mockRecurringRepo, mockTransactionRepo, mockAccountRepo, {
        globalEnabled: false,
      });

      const result = await engine.checkAndApplyDueTransactions(tenantId, userId);

      expect(result).toEqual({
        appliedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        appliedTransactions: [],
        failedTransactions: [],
        pendingTransactions: [],
      });
      expect(mockRecurringRepo.findDueRecurringTransactions).not.toHaveBeenCalled();
    });
  });

  describe("getDueRecurringTransactions", () => {
    it("should call repository with correct parameters", async () => {
      const mockTransactions: Recurring[] = [createMockRecurring()];
      (mockRecurringRepo.findDueRecurringTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      const asOfDate = new Date("2024-01-15");
      const result = await autoApplyEngine.getDueRecurringTransactions(tenantId, asOfDate);

      expect(mockRecurringRepo.findDueRecurringTransactions).toHaveBeenCalledWith(tenantId, asOfDate);
      expect(result).toEqual(mockTransactions);
    });

    it("should use current date when asOfDate is not provided", async () => {
      const mockTransactions: Recurring[] = [createMockRecurring()];
      (mockRecurringRepo.findDueRecurringTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      await autoApplyEngine.getDueRecurringTransactions(tenantId);

      expect(mockRecurringRepo.findDueRecurringTransactions).toHaveBeenCalledWith(tenantId, expect.any(Date));
    });
  });

  describe("applyRecurringTransaction", () => {
    it("should successfully apply a standard recurring transaction", async () => {
      const recurring = createMockRecurring({
        recurringtype: RecurringType.Standard,
        amount: 100,
        sourceaccountid: "account-1",
      });

      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe("transaction-id");
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100,
          accountid: "account-1",
          type: "Expense",
        }),
        tenantId,
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith("account-1", 100, tenantId);
    });

    it("should successfully apply a transfer recurring transaction", async () => {
      const recurring = createMockRecurring({
        recurringtype: RecurringType.Transfer,
        amount: 200,
        sourceaccountid: "account-1",
        transferaccountid: "account-2",
      });

      (mockTransactionRepo.createMultipleTransactions as jest.Mock).mockResolvedValue([
        { id: "primary-id" },
        { id: "transfer-id" },
      ]);
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(true);
      expect(mockTransactionRepo.createMultipleTransactions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ amount: 200, accountid: "account-1" }),
          expect.objectContaining({ amount: -200, accountid: "account-2" }),
        ]),
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledTimes(2);
    });

    it("should successfully apply a credit card payment", async () => {
      const recurring = createMockRecurring({
        recurringtype: RecurringType.CreditCardPayment,
        sourceaccountid: "checking-account",
        categoryid: "credit-card-account",
      });

      const mockCreditCardAccount = {
        id: "credit-card-account",
        name: "Credit Card",
        balance: -500, // Negative balance indicates debt
      };

      (mockAccountRepo.findById as jest.Mock).mockResolvedValue(mockCreditCardAccount);
      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "payment-transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(true);
      expect(mockTransactionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 500, // Payment amount should be positive value of debt
          accountid: "checking-account",
        }),
        tenantId,
      );
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith("checking-account", 500, tenantId);
      expect(mockAccountRepo.updateAccountBalance).toHaveBeenCalledWith("credit-card-account", -500, tenantId);
    });

    it("should handle validation errors", async () => {
      const invalidRecurring = createMockRecurring({
        isactive: false, // Invalid: not active
      });

      const result = await autoApplyEngine.applyRecurringTransaction(invalidRecurring, tenantId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Validation failed");
      expect(mockTransactionRepo.create).not.toHaveBeenCalled();
    });

    it("should handle transaction creation errors and increment failed attempts", async () => {
      const recurring = createMockRecurring();

      (mockTransactionRepo.create as jest.Mock).mockRejectedValue(new Error("Database error"));
      (mockRecurringRepo.incrementFailedAttempts as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Database error");
      expect(mockRecurringRepo.incrementFailedAttempts).toHaveBeenCalledWith([recurring.id]);
    });

    it("should reset failed attempts on successful execution", async () => {
      const recurring = createMockRecurring({
        failedattempts: 2, // Has previous failed attempts
      });

      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(true);
      expect(mockRecurringRepo.resetFailedAttempts).toHaveBeenCalledWith([recurring.id]);
    });
  });

  describe("batchApplyTransactions", () => {
    it("should process multiple transactions and return batch results", async () => {
      const recurrings = [
        createMockRecurring({ id: "1" }),
        createMockRecurring({ id: "2" }),
        createMockRecurring({ id: "3" }),
      ];

      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.batchApplyTransactions(recurrings, tenantId, userId);

      expect(result.results).toHaveLength(3);
      expect(result.summary.appliedCount).toBe(3);
      expect(result.summary.failedCount).toBe(0);
    });

    it("should respect batch size limits", async () => {
      const engine = new AutoApplyEngine(mockRecurringRepo, mockTransactionRepo, mockAccountRepo, { maxBatchSize: 2 });

      const recurrings = [
        createMockRecurring({ id: "1" }),
        createMockRecurring({ id: "2" }),
        createMockRecurring({ id: "3" }),
      ];

      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);

      const result = await engine.batchApplyTransactions(recurrings, tenantId, userId);

      expect(result.results).toHaveLength(3);
      expect(result.summary.appliedCount).toBe(3);
    });

    it("should handle mixed success and failure results", async () => {
      const recurrings = [
        createMockRecurring({ id: "1" }),
        createMockRecurring({ id: "2", isactive: false }), // This will fail validation
        createMockRecurring({ id: "3" }),
      ];

      (mockTransactionRepo.create as jest.Mock).mockResolvedValue({ id: "transaction-id" });
      (mockAccountRepo.updateAccountBalance as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateNextOccurrenceDates as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.resetFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateEnhanced as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.incrementFailedAttempts as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.batchApplyTransactions(recurrings, tenantId, userId);

      expect(result.results).toHaveLength(3);
      expect(result.summary.appliedCount).toBe(2);
      expect(result.summary.failedCount).toBe(1);
    });
  });

  describe("setAutoApplyEnabled", () => {
    it("should call repository to update auto-apply status", async () => {
      const recurringId = "recurring-123";

      await autoApplyEngine.setAutoApplyEnabled(recurringId, true, tenantId);

      expect(mockRecurringRepo.updateAutoApplyStatus).toHaveBeenCalledWith(recurringId, true, tenantId);
    });
  });

  describe("getAutoApplySettings", () => {
    it("should return current settings", () => {
      const settings = autoApplyEngine.getAutoApplySettings();

      expect(settings).toEqual(DEFAULT_AUTO_APPLY_SETTINGS);
    });
  });

  describe("updateAutoApplySettings", () => {
    it("should update settings and return new values", () => {
      const newSettings = { maxBatchSize: 25, timeoutMs: 15000 };

      autoApplyEngine.updateAutoApplySettings(newSettings);
      const updatedSettings = autoApplyEngine.getAutoApplySettings();

      expect(updatedSettings.maxBatchSize).toBe(25);
      expect(updatedSettings.timeoutMs).toBe(15000);
      expect(updatedSettings.globalEnabled).toBe(DEFAULT_AUTO_APPLY_SETTINGS.globalEnabled); // Unchanged
    });
  });

  describe("error handling", () => {
    it("should disable auto-apply after max failed attempts", async () => {
      const recurring = createMockRecurring({
        failedattempts: 2,
        maxfailedattempts: 3,
      });

      (mockTransactionRepo.create as jest.Mock).mockRejectedValue(new Error("Persistent error"));
      (mockRecurringRepo.incrementFailedAttempts as jest.Mock).mockResolvedValue(undefined);
      (mockRecurringRepo.updateAutoApplyStatus as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(false);
      expect(mockRecurringRepo.incrementFailedAttempts).toHaveBeenCalledWith([recurring.id]);
      expect(mockRecurringRepo.updateAutoApplyStatus).toHaveBeenCalledWith(recurring.id, false);
    });

    it("should handle insufficient funds gracefully", async () => {
      const recurring = createMockRecurring({
        recurringtype: RecurringType.CreditCardPayment,
        categoryid: "credit-card-account",
      });

      const mockCreditCardAccount = {
        id: "credit-card-account",
        name: "Credit Card",
        balance: 0, // No debt to pay
      };

      (mockAccountRepo.findById as jest.Mock).mockResolvedValue(mockCreditCardAccount);
      (mockRecurringRepo.incrementFailedAttempts as jest.Mock).mockResolvedValue(undefined);

      const result = await autoApplyEngine.applyRecurringTransaction(recurring, tenantId, userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain("No balance to pay");
    });
  });
});

// Helper function to create mock recurring transactions
function createMockRecurring(overrides: Partial<Recurring> = {}): Recurring {
  return {
    id: "recurring-123",
    name: "Test Recurring",
    description: "Test Description",
    amount: 100,
    sourceaccountid: "account-123",
    categoryid: "category-123",
    type: "Expense",
    isactive: true,
    autoapplyenabled: true,
    recurringtype: RecurringType.Standard,
    intervalmonths: 1,
    nextoccurrencedate: dayjs().format("YYYY-MM-DD"),
    isamountflexible: false,
    isdateflexible: false,
    failedattempts: 0,
    maxfailedattempts: RECURRING_CONSTANTS.FAILED_ATTEMPTS.DEFAULT,
    tenantid: "test-tenant",
    createdby: "test-user",
    createdat: dayjs().toISOString(),
    updatedby: "test-user",
    updatedat: dayjs().toISOString(),
    isdeleted: false,
    payeename: "Test Payee",
    notes: "Test Notes",
    recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
    ...overrides,
  } as Recurring;
}
