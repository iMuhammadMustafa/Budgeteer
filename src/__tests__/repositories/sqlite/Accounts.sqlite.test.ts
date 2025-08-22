import { AccountSQLiteRepository } from "../../../repositories/sqlite/Accounts.sqlite";
import { AccountInsert } from "../../../types/db/sqllite/schema";

// Mock the SQLite provider
jest.mock("../../../providers/SQLite", () => ({
  getSQLiteDB: jest.fn(),
  isSQLiteReady: jest.fn(() => true),
}));

// Mock the database functions
jest.mock("../../../types/db/sqllite/functions", () => ({
  updateAccountBalance: jest.fn(),
}));

// Mock drizzle-orm
let mockQueryResult: any[] = [];

const createMockChain = (result: any) => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockReturnValue(result),
      limit: jest.fn().mockReturnValue(result),
    }),
  }),
});

const createMockInsertChain = (result: any) => ({
  values: jest.fn().mockReturnValue({
    returning: jest.fn().mockReturnValue(result),
  }),
});

const createMockUpdateChain = (result: any) => ({
  set: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockReturnValue(result),
    }),
  }),
});

const mockDb = {
  select: jest.fn(() => createMockChain(mockQueryResult)),
  insert: jest.fn(() => createMockInsertChain(mockQueryResult)),
  update: jest.fn(() => createMockUpdateChain(mockQueryResult)),
  delete: jest.fn(() => ({
    where: jest.fn().mockReturnValue({}),
  })),
};

const { getSQLiteDB } = require("../../../providers/SQLite");
const { updateAccountBalance } = require("../../../types/db/sqllite/functions");
getSQLiteDB.mockReturnValue(mockDb);

describe("AccountSQLiteRepository", () => {
  let repository: AccountSQLiteRepository;
  const mockTenantId = "test-tenant-id";

  beforeEach(() => {
    repository = new AccountSQLiteRepository();
    jest.clearAllMocks();
    mockQueryResult = [];
  });

  describe("updateAccountBalance", () => {
    it("should update account balance using database function", async () => {
      const accountId = "account-1";
      const amount = 100;
      const expectedBalance = 500;

      updateAccountBalance.mockResolvedValue(expectedBalance);

      const result = await repository.updateAccountBalance(accountId, amount, mockTenantId);

      expect(updateAccountBalance).toHaveBeenCalledWith(mockDb, accountId, amount);
      expect(result).toBe(expectedBalance);
    });

    it("should handle errors from database function", async () => {
      const accountId = "account-1";
      const amount = 100;

      updateAccountBalance.mockRejectedValue(new Error("Database error"));

      await expect(repository.updateAccountBalance(accountId, amount, mockTenantId))
        .rejects.toThrow("Failed to update account balance: Database error");
    });
  });

  describe("getAccountOpenedTransaction", () => {
    it("should find the initial transaction for an account", async () => {
      const accountId = "account-1";
      const mockTransaction = {
        id: "transaction-1",
        amount: 1000,
      };

      mockQueryResult = [mockTransaction];

      const result = await repository.getAccountOpenedTransaction(accountId, mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it("should throw error when no initial transaction found", async () => {
      const accountId = "account-1";
      mockQueryResult = [];

      await expect(repository.getAccountOpenedTransaction(accountId, mockTenantId))
        .rejects.toThrow("No initial transaction found for account account-1");
    });
  });

  describe("getTotalAccountBalance", () => {
    it("should calculate total balance across all accounts", async () => {
      const mockResult = { totalbalance: 5000 };
      mockQueryResult = [mockResult];

      const result = await repository.getTotalAccountBalance(mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it("should return zero balance when no accounts found", async () => {
      mockQueryResult = [{ totalbalance: null }];

      const result = await repository.getTotalAccountBalance(mockTenantId);

      expect(result).toEqual({ totalbalance: 0 });
    });
  });

  describe("basic CRUD operations", () => {
    it("should create an account", async () => {
      const newAccount: AccountInsert = {
        id: "new-account",
        name: "Test Account",
        categoryid: "category-1",
        tenantid: mockTenantId,
        createdat: new Date().toISOString(),
      };

      const createdAccount = { ...newAccount, balance: 0, isdeleted: false };
      mockQueryResult = [createdAccount];

      const result = await repository.create(newAccount, mockTenantId);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(createdAccount);
    });

    it("should find account by id", async () => {
      const mockAccount = {
        id: "account-1",
        name: "Test Account",
        categoryid: "category-1",
        tenantid: mockTenantId,
        isdeleted: false,
      };

      mockQueryResult = [mockAccount];

      const result = await repository.findById("account-1", mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockAccount);
    });
  });
});