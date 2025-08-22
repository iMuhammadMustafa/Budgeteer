import { TransactionGroupSQLiteRepository } from '../../../repositories/sqlite/TransactionGroups.sqlite';
import { TransactionGroupInsert, TransactionGroupUpdate } from '../../../types/db/sqllite/schema';

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

describe('TransactionGroupSQLiteRepository', () => {
  let repository: TransactionGroupSQLiteRepository;
  const testTenantId = 'test-tenant-123';

  beforeEach(() => {
    repository = new TransactionGroupSQLiteRepository();
    jest.clearAllMocks();
    mockQueryResult = [];
  });

  describe('create', () => {
    it('should create a new transaction group', async () => {
      const groupData: TransactionGroupInsert = {
        id: 'group-1',
        name: 'Test Group',
        type: 'Expense',
        color: 'blue-500',
        icon: 'shopping-cart',
        description: 'Test description',
        displayorder: 1,
        budgetamount: 1000,
        budgetfrequency: 'Monthly',
        tenantid: testTenantId,
        createdat: new Date().toISOString(),
      };

      const createdGroup = { ...groupData, isdeleted: false };
      mockQueryResult = [createdGroup];

      const result = await repository.create(groupData, testTenantId);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(createdGroup);
    });
  });

  describe('findById', () => {
    it('should find a transaction group by id', async () => {
      const mockGroup = {
        id: 'group-1',
        name: 'Test Group',
        type: 'Expense',
        tenantid: testTenantId,
        isdeleted: false,
        createdat: new Date().toISOString(),
      };

      mockQueryResult = [mockGroup];

      const result = await repository.findById('group-1', testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it('should return null for non-existent transaction group', async () => {
      mockQueryResult = [];

      const result = await repository.findById('non-existent', testTenantId);
      
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all transaction groups for tenant with proper ordering', async () => {
      const mockGroups = [
        {
          id: 'group-3',
          name: 'Salary',
          type: 'Income',
          displayorder: 3,
          tenantid: testTenantId,
          isdeleted: false,
        },
        {
          id: 'group-1',
          name: 'Food & Dining',
          type: 'Expense',
          displayorder: 2,
          tenantid: testTenantId,
          isdeleted: false,
        },
        {
          id: 'group-2',
          name: 'Transportation',
          type: 'Expense',
          displayorder: 1,
          tenantid: testTenantId,
          isdeleted: false,
        },
      ];

      mockQueryResult = mockGroups;

      const result = await repository.findAll(undefined, testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockGroups);
    });

    it('should handle filters correctly', async () => {
      const filters = { type: 'Expense' };
      mockQueryResult = [];

      await repository.findAll(filters, testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a transaction group', async () => {
      const updateData: TransactionGroupUpdate = {
        name: 'Updated Group',
        description: 'Updated description',
      };

      const updatedGroup = {
        id: 'group-1',
        name: 'Updated Group',
        description: 'Updated description',
        type: 'Expense',
        tenantid: testTenantId,
        isdeleted: false,
      };

      mockQueryResult = [updatedGroup];

      const result = await repository.update('group-1', updateData, testTenantId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedGroup);
    });

    it('should return null for non-existent transaction group', async () => {
      mockQueryResult = [];

      const updateData: TransactionGroupUpdate = {
        name: 'Updated Group',
      };

      const result = await repository.update('non-existent', updateData, testTenantId);
      expect(result).toBeNull();
    });
  });

  describe('softDelete and restore', () => {
    it('should soft delete a transaction group', async () => {
      await repository.softDelete('group-1', testTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should restore a soft-deleted transaction group', async () => {
      await repository.restore('group-1', testTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should permanently delete a transaction group', async () => {
      await repository.delete('group-1', testTenantId);

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});