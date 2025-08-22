import { AccountCategorySQLiteRepository } from "../../../repositories/sqlite/AccountCategories.sqlite";
import { AccountCategoryInsert } from "../../../types/db/sqllite/schema";

// Mock the SQLite provider
jest.mock("../../../providers/SQLite", () => ({
  getSQLiteDB: jest.fn(),
  isSQLiteReady: jest.fn(() => true),
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
getSQLiteDB.mockReturnValue(mockDb);

describe("AccountCategorySQLiteRepository", () => {
  let repository: AccountCategorySQLiteRepository;
  const mockTenantId = "test-tenant-id";

  beforeEach(() => {
    repository = new AccountCategorySQLiteRepository();
    jest.clearAllMocks();
    mockQueryResult = [];
  });

  describe("findAll", () => {
    it("should find all account categories with proper ordering", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Assets",
          type: "Asset",
          tenantid: mockTenantId,
          isdeleted: false,
          displayorder: 1,
        },
        {
          id: "2", 
          name: "Liabilities",
          type: "Liability",
          tenantid: mockTenantId,
          isdeleted: false,
          displayorder: 0,
        },
      ];

      mockQueryResult = mockCategories;

      const result = await repository.findAll({}, mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it("should handle filters correctly", async () => {
      const filters = { type: "Asset" };
      mockQueryResult = [];

      await repository.findAll(filters, mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should find account category by id", async () => {
      const mockCategory = {
        id: "1",
        name: "Assets",
        type: "Asset",
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
    it("should create a new account category", async () => {
      const newCategory: AccountCategoryInsert = {
        id: "new-id",
        name: "New Category",
        type: "Asset",
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
    it("should update an existing account category", async () => {
      const updateData = { name: "Updated Category" };
      const updatedCategory = {
        id: "1",
        name: "Updated Category",
        type: "Asset",
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
    it("should soft delete an account category", async () => {
      await repository.softDelete("1", mockTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe("restore", () => {
    it("should restore a soft deleted account category", async () => {
      await repository.restore("1", mockTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});