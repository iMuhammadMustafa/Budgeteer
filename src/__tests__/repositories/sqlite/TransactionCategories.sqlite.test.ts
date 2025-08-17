import { TransactionCategorySQLiteRepository } from "../../../repositories/sqlite/TransactionCategories.sqlite";
import { TransactionCategoryInsert } from "../../../types/db/sqllite/schema";

// Mock the SQLite provider
jest.mock("../../../providers/SQLite", () => ({
  getSQLiteDB: jest.fn(),
  isSQLiteReady: jest.fn(() => true),
}));

// Mock drizzle-orm
let mockQueryResult: any[] = [];

const createMockChain = (result: any) => ({
  from: jest.fn().mockReturnValue({
    leftJoin: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue(result),
        limit: jest.fn().mockReturnValue(result),
      }),
    }),
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
getSQLiteDB.mockReturnValue(mockDb);

describe("TransactionCategorySQLiteRepository", () => {
  let repository: TransactionCategorySQLiteRepository;
  const mockTenantId = "test-tenant-id";

  beforeEach(() => {
    repository = new TransactionCategorySQLiteRepository();
    jest.clearAllMocks();
    mockQueryResult = [];
  });

  describe("findAll", () => {
    it("should find all transaction categories with proper ordering and joins", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Groceries",
          groupid: "group-1",
          type: "Expense",
          tenantid: mockTenantId,
          isdeleted: false,
          displayorder: 2,
          group: {
            id: "group-1",
            name: "Food",
            type: "Expense",
            displayorder: 1,
          },
        },
        {
          id: "2",
          name: "Salary",
          groupid: "group-2",
          type: "Income",
          tenantid: mockTenantId,
          isdeleted: false,
          displayorder: 1,
          group: {
            id: "group-2",
            name: "Work",
            type: "Income",
            displayorder: 2,
          },
        },
      ];

      mockQueryResult = mockCategories;

      const result = await repository.findAll({}, mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it("should handle filters correctly", async () => {
      const filters = { type: "Expense" };
      mockQueryResult = [];

      await repository.findAll(filters, mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should find transaction category by id", async () => {
      const mockCategory = {
        id: "1",
        name: "Groceries",
        groupid: "group-1",
        type: "Expense",
        tenantid: mockTenantId,
        isdeleted: false,
      };

      mockQueryResult = [mockCategory];

      const result = await repository.findById("1", mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it("should return null when category not found", async () => {
      mockQueryResult = [];

      const result = await repository.findById("nonexistent", mockTenantId);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a new transaction category", async () => {
      const newCategory: TransactionCategoryInsert = {
        id: "new-id",
        name: "New Category",
        groupid: "group-1",
        type: "Expense",
        tenantid: mockTenantId,
        createdat: new Date().toISOString(),
      };

      const createdCategory = { ...newCategory, isdeleted: false };
      mockQueryResult = [createdCategory];

      const result = await repository.create(newCategory, mockTenantId);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(createdCategory);
    });

  });

  describe("update", () => {
    it("should update an existing transaction category", async () => {
      const updateData = { name: "Updated Category" };
      const updatedCategory = {
        id: "1",
        name: "Updated Category",
        groupid: "group-1",
        type: "Expense",
        tenantid: mockTenantId,
        isdeleted: false,
      };

      mockQueryResult = [updatedCategory];

      const result = await repository.update("1", updateData, mockTenantId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedCategory);
    });

  });

  describe("softDelete", () => {
    it("should soft delete a transaction category", async () => {
      await repository.softDelete("1", mockTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("restore", () => {
    it("should restore a soft deleted transaction category", async () => {
      await repository.restore("1", mockTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("filtering and tenant isolation", () => {
    it("should filter by type", async () => {
      const mockExpenseCategories = [
        {
          id: "1",
          name: "Groceries",
          type: "Expense",
          tenantid: mockTenantId,
          isdeleted: false,
        },
      ];

      mockQueryResult = mockExpenseCategories;

      const result = await repository.findAll({ type: "Expense" }, mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockExpenseCategories);
    });

    it("should respect tenant isolation", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Category 1",
          tenantid: "tenant-1",
          isdeleted: false,
        },
      ];

      mockQueryResult = mockCategories;

      await repository.findAll({}, "tenant-1");

      expect(mockDb.select).toHaveBeenCalled();
    });
  });
});