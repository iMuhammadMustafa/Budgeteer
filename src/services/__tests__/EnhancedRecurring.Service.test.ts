import { Session } from "@supabase/supabase-js";
import { RecurringType } from "@/src/types/recurring";
import { CreateTransferRequest, CreateCreditCardPaymentRequest } from "@/src/types/recurring";
import { validateTransferRecurring, validateCreditCardPaymentRecurring } from "@/src/utils/recurring-validation";

// Mock environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

// Mock Supabase
jest.mock("@/src/providers/Supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

// Mock UUID helper
jest.mock("@/src/utils/UUID.Helper", () => {
  return jest.fn(() => "test-uuid");
});

// Mock dayjs
jest.mock("dayjs", () => {
  const mockDayjs = () => ({
    format: () => "2025-02-01T00:00:00Z",
    toISOString: () => "2025-02-01T00:00:00Z",
    add: () => mockDayjs(),
  });
  return mockDayjs;
});

// Mock Date to return a date that makes our test dates valid
const mockDate = new Date("2025-01-01T00:00:00Z");
global.Date = jest.fn(() => mockDate) as any;
global.Date.now = jest.fn(() => mockDate.getTime());

// Mock repositories
const mockRecurringRepo = {
  createEnhanced: jest.fn(),
  updateEnhanced: jest.fn(),
  findByIdEnhanced: jest.fn(),
  findAllEnhanced: jest.fn(),
  softDelete: jest.fn(),
  updateAutoApplyStatus: jest.fn(),
  findByAutoApplyEnabled: jest.fn(),
  findDueRecurringTransactions: jest.fn(),
  incrementFailedAttempts: jest.fn(),
};

const mockAccountRepo = {
  findById: jest.fn(),
  updateAccountBalance: jest.fn(),
};

const mockSession: Session = {
  user: {
    id: "test-user-id",
    aud: "supabase",
    role: "authenticated",
    created_at: "2025-01-01T00:00:00Z",
    app_metadata: {},
    user_metadata: {
      tenantid: "test-tenant-id",
    },
  },
  access_token: "test-token",
  refresh_token: "test-refresh-token",
  expires_in: 3600,
  token_type: "Bearer",
};

// Import helper functions for direct testing
import { createRecurringTransferHelper, createCreditCardPaymentHelper } from "../Recurring.Service";

describe("Enhanced Recurring Transfer Functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Transfer Validation", () => {
    it("should validate transfer recurring transaction successfully", () => {
      // Arrange
      const validTransferData: CreateTransferRequest = {
        id: "test-id",
        name: "Monthly Transfer",
        sourceaccountid: "source-account-id",
        transferaccountid: "destination-account-id",
        amount: 200,
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: true, // Make date flexible to avoid date validation issues
        nextoccurrencedate: "2025-03-01",
        tenantid: "test-tenant",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        autoapplyenabled: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
      };

      // Act
      const validation = validateTransferRecurring(validTransferData);

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should fail validation when transfer account is missing", () => {
      // Arrange
      const invalidTransferData = {
        id: "test-id",
        name: "Invalid Transfer",
        sourceaccountid: "source-account-id",
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
        nextoccurrencedate: "2025-03-01",
        tenantid: "test-tenant",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        autoapplyenabled: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        amount: 200,
        // Missing transferaccountid
      } as CreateTransferRequest;

      // Act
      const validation = validateTransferRecurring(invalidTransferData);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === "transferaccountid")).toBe(true);
    });

    it("should fail validation when source and destination accounts are the same", () => {
      // Arrange
      const invalidTransferData: CreateTransferRequest = {
        id: "test-id",
        name: "Invalid Transfer",
        sourceaccountid: "same-account-id",
        transferaccountid: "same-account-id",
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
        intervalmonths: 1,
        isamountflexible: false,
        isdateflexible: false,
        nextoccurrencedate: "2025-03-01",
        tenantid: "test-tenant",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        autoapplyenabled: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        amount: 200,
      };

      // Act
      const validation = validateTransferRecurring(invalidTransferData);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.message.includes("different"))).toBe(true);
    });
  });

  describe("Credit Card Payment Validation", () => {
    it("should validate credit card payment successfully", () => {
      // Arrange
      const validPaymentData: CreateCreditCardPaymentRequest = {
        id: "test-id",
        name: "Monthly CC Payment",
        sourceaccountid: "checking-account-id",
        categoryid: "credit-card-category",
        recurringtype: RecurringType.CreditCardPayment,
        type: "Expense",
        intervalmonths: 1,
        isamountflexible: true,
        isdateflexible: true, // Make date flexible to avoid date validation issues
        amount: 100, // Add amount even though it's flexible to satisfy validation
        nextoccurrencedate: "2025-03-01",
        tenantid: "test-tenant",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        autoapplyenabled: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
      };

      // Act
      const validation = validateCreditCardPaymentRecurring(validPaymentData);

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should fail validation when source account is missing", () => {
      // Arrange
      const invalidPaymentData = {
        id: "test-id",
        name: "Invalid Payment",
        categoryid: "credit-card-category",
        recurringtype: RecurringType.CreditCardPayment,
        type: "Expense",
        intervalmonths: 1,
        isamountflexible: true,
        isdateflexible: false,
        nextoccurrencedate: "2025-03-01",
        tenantid: "test-tenant",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        autoapplyenabled: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        // Missing sourceaccountid
      } as CreateCreditCardPaymentRequest;

      // Act
      const validation = validateCreditCardPaymentRecurring(invalidPaymentData);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.field === "sourceaccountid")).toBe(true);
    });
  });

  describe("Transfer Creation Helper", () => {
    it("should create a recurring transfer successfully", async () => {
      // Arrange
      const mockSourceAccount = {
        id: "source-account-id",
        name: "Checking Account",
        balance: 1000,
        type: "Asset",
      };

      const mockDestinationAccount = {
        id: "destination-account-id",
        name: "Savings Account",
        balance: 500,
        type: "Asset",
      };

      const mockCreatedTransfer = {
        id: "test-uuid",
        name: "Monthly Savings Transfer",
        sourceaccountid: "source-account-id",
        transferaccountid: "destination-account-id",
        amount: 200,
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
      };

      mockAccountRepo.findById.mockResolvedValueOnce(mockSourceAccount).mockResolvedValueOnce(mockDestinationAccount);
      mockRecurringRepo.create.mockResolvedValue(mockCreatedTransfer);

      const transferRequest: CreateTransferRequest = {
        id: "test-uuid",
        name: "Monthly Savings Transfer",
        sourceaccountid: "source-account-id",
        transferaccountid: "destination-account-id",
        amount: 200,
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
        nextoccurrencedate: "2025-02-01",
        intervalmonths: 1,
        autoapplyenabled: false,
        isamountflexible: false,
        isdateflexible: true,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        tenantid: "test-tenant-id",
      };

      // Act
      const result = await createRecurringTransferHelper(
        transferRequest,
        mockSession,
        mockRecurringRepo,
        mockAccountRepo,
      );

      // Assert
      expect(mockAccountRepo.findById).toHaveBeenCalledWith("source-account-id", "test-tenant-id");
      expect(mockAccountRepo.findById).toHaveBeenCalledWith("destination-account-id", "test-tenant-id");
      expect(mockRecurringRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Monthly Savings Transfer",
          sourceaccountid: "source-account-id",
          transferaccountid: "destination-account-id",
          amount: 200,
          recurringtype: RecurringType.Transfer,
          type: "Transfer",
        }),
        "test-tenant-id",
      );
      expect(result).toEqual(mockCreatedTransfer);
    });

    it("should fail when source and destination accounts are the same", async () => {
      // Arrange
      const mockAccount = {
        id: "same-account-id",
        name: "Account",
        balance: 1000,
        type: "Asset",
      };

      mockAccountRepo.findById.mockResolvedValue(mockAccount);

      const transferRequest: CreateTransferRequest = {
        id: "test-uuid",
        name: "Invalid Transfer",
        sourceaccountid: "same-account-id",
        transferaccountid: "same-account-id",
        amount: 200,
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
        nextoccurrencedate: "2025-02-01",
        intervalmonths: 1,
        autoapplyenabled: false,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        tenantid: "test-tenant-id",
      };

      // Act & Assert
      await expect(
        createRecurringTransferHelper(transferRequest, mockSession, mockRecurringRepo, mockAccountRepo),
      ).rejects.toThrow("Source and destination accounts must be different");
    });

    it("should fail when source account does not exist", async () => {
      // Arrange
      mockAccountRepo.findById
        .mockResolvedValueOnce(null) // Source account not found
        .mockResolvedValueOnce({ id: "dest-id", name: "Dest Account" });

      const transferRequest: CreateTransferRequest = {
        id: "test-uuid",
        name: "Transfer to Non-existent Source",
        sourceaccountid: "non-existent-source",
        transferaccountid: "destination-account-id",
        amount: 200,
        recurringtype: RecurringType.Transfer,
        type: "Transfer",
        nextoccurrencedate: "2025-02-01",
        intervalmonths: 1,
        autoapplyenabled: false,
        isamountflexible: false,
        isdateflexible: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        tenantid: "test-tenant-id",
      };

      // Act & Assert
      await expect(
        createRecurringTransferHelper(transferRequest, mockSession, mockRecurringRepo, mockAccountRepo),
      ).rejects.toThrow("Source account not found");
    });
  });

  describe("Credit Card Payment Creation Helper", () => {
    it("should create a credit card payment successfully", async () => {
      // Arrange
      const mockSourceAccount = {
        id: "checking-account-id",
        name: "Checking Account",
        balance: 2000,
        type: "Asset",
      };

      const mockCreatedPayment = {
        id: "test-uuid",
        name: "Monthly Credit Card Payment",
        sourceaccountid: "checking-account-id",
        recurringtype: RecurringType.CreditCardPayment,
        type: "Expense",
        isamountflexible: true,
      };

      mockAccountRepo.findById.mockResolvedValue(mockSourceAccount);
      mockRecurringRepo.create.mockResolvedValue(mockCreatedPayment);

      const paymentRequest: CreateCreditCardPaymentRequest = {
        id: "test-uuid",
        name: "Monthly Credit Card Payment",
        sourceaccountid: "checking-account-id",
        categoryid: "credit-card-category-id",
        recurringtype: RecurringType.CreditCardPayment,
        type: "Expense",
        nextoccurrencedate: "2025-02-01",
        intervalmonths: 1,
        autoapplyenabled: false,
        isdateflexible: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        tenantid: "test-tenant-id",
      };

      // Act
      const result = await createCreditCardPaymentHelper(
        paymentRequest,
        mockSession,
        mockRecurringRepo,
        mockAccountRepo,
      );

      // Assert
      expect(mockAccountRepo.findById).toHaveBeenCalledWith("checking-account-id", "test-tenant-id");
      expect(mockRecurringRepo.createEnhanced).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Monthly Credit Card Payment",
          sourceaccountid: "checking-account-id",
          recurringtype: RecurringType.CreditCardPayment,
          type: "Expense",
          isamountflexible: true, // Should be set to true for credit card payments
        }),
        "test-tenant-id",
      );
      expect(result).toEqual(mockCreatedPayment);
    });

    it("should fail when source account does not exist", async () => {
      // Arrange
      mockAccountRepo.findById.mockResolvedValue(null);

      const paymentRequest: CreateCreditCardPaymentRequest = {
        id: "test-uuid",
        name: "Credit Card Payment",
        sourceaccountid: "non-existent-account",
        categoryid: "credit-card-category-id",
        recurringtype: RecurringType.CreditCardPayment,
        type: "Expense",
        nextoccurrencedate: "2025-02-01",
        intervalmonths: 1,
        autoapplyenabled: false,
        isdateflexible: false,
        maxfailedattempts: 3,
        isactive: true,
        isdeleted: false,
        currencycode: "USD",
        recurrencerule: "FREQ=MONTHLY;INTERVAL=1",
        tenantid: "test-tenant-id",
      };

      // Act & Assert
      await expect(
        createCreditCardPaymentHelper(paymentRequest, mockSession, mockRecurringRepo, mockAccountRepo),
      ).rejects.toThrow("Source account not found");
    });
  });
});
