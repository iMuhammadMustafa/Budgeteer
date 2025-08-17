import { TransactionSQLiteRepository } from '../../../repositories/sqlite/Transactions.sqlite';
import { TransactionFilters } from '../../../types/apis/TransactionFilters';
import { TransactionInsert } from '../../../types/db/sqllite/schema';

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
      leftJoin: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue(result),
            limit: jest.fn().mockReturnValue(result),
            offset: jest.fn().mockReturnValue(result),
          }),
        }),
      }),
    }),
    where: jest.fn().mockReturnValue({
      orderBy: jest.fn().mockReturnValue(result),
      limit: jest.fn().mockReturnValue(result),
      offset: jest.fn().mockReturnValue(result),
    }),
    orderBy: jest.fn().mockReturnValue(result),
    limit: jest.fn().mockReturnValue(result),
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

const createMockSelectDistinctChain = (result: any) => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue(result),
    }),
  }),
});

const mockDb = {
  select: jest.fn(() => createMockChain(mockQueryResult)),
  selectDistinct: jest.fn(() => createMockSelectDistinctChain(mockQueryResult)),
  insert: jest.fn(() => createMockInsertChain(mockQueryResult)),
  update: jest.fn(() => createMockUpdateChain(mockQueryResult)),
  delete: jest.fn(() => ({
    where: jest.fn().mockReturnValue({}),
  })),
};

const { getSQLiteDB } = require("../../../providers/SQLite");
getSQLiteDB.mockReturnValue(mockDb);

describe('TransactionSQLiteRepository', () => {
  let repository: TransactionSQLiteRepository;
  const mockTenantId = "test-tenant-id";

  beforeEach(() => {
    repository = new TransactionSQLiteRepository();
    jest.clearAllMocks();
    mockQueryResult = [];
  });

  describe('Basic CRUD Operations', () => {
    it('should create a transaction', async () => {
      const transactionData: TransactionInsert = {
        id: 'test-transaction-1',
        name: 'Test Transaction',
        accountid: 'test-account-1',
        categoryid: 'test-category-1',
        amount: 100.50,
        date: new Date().toISOString(),
        type: 'Expense',
        tenantid: mockTenantId,
        createdat: new Date().toISOString(),
      };

      const createdTransaction = { ...transactionData, isdeleted: false };
      mockQueryResult = [createdTransaction];

      const result = await repository.create(transactionData, mockTenantId);
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(createdTransaction);
    });

    it('should find transaction by ID', async () => {
      const mockTransaction = {
        id: 'test-transaction-2',
        name: 'Test Transaction 2',
        accountid: 'test-account-1',
        categoryid: 'test-category-1',
        amount: 200.75,
        date: new Date().toISOString(),
        type: 'Income',
        tenantid: mockTenantId,
        accountname: 'Test Account',
        categoryname: 'Test Category',
        groupname: 'Test Group',
        isdeleted: false,
      };

      mockQueryResult = [mockTransaction];

      const result = await repository.findById('test-transaction-2', mockTenantId);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should update a transaction', async () => {
      const updatedTransaction = {
        id: 'test-transaction-3',
        name: 'Updated Transaction Name',
        amount: 350.00,
        tenantid: mockTenantId,
      };

      mockQueryResult = [updatedTransaction];

      const result = await repository.update('test-transaction-3', {
        name: 'Updated Transaction Name',
        amount: 350.00,
      }, mockTenantId);
      
      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTransaction);
    });

    it('should soft delete a transaction', async () => {
      mockQueryResult = [];

      await repository.softDelete('test-transaction-4', mockTenantId);
      
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('Specialized Methods', () => {
    it('should create multiple transactions', async () => {
      const transactionsData: TransactionInsert[] = [
        {
          id: 'test-transaction-5',
          name: 'Bulk Transaction 1',
          accountid: 'test-account-1',
          categoryid: 'test-category-1',
          amount: 100.00,
          date: new Date().toISOString(),
          type: 'Expense',
          tenantid: mockTenantId,
          createdat: new Date().toISOString(),
        },
        {
          id: 'test-transaction-6',
          name: 'Bulk Transaction 2',
          accountid: 'test-account-1',
          categoryid: 'test-category-1',
          amount: 200.00,
          date: new Date().toISOString(),
          type: 'Income',
          tenantid: mockTenantId,
          createdat: new Date().toISOString(),
        },
      ];

      mockQueryResult = transactionsData;

      const results = await repository.createMultipleTransactions(transactionsData);
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(results).toEqual(transactionsData);
    });

    it('should find transactions by name', async () => {
      const mockSearchResult = [
        {
          name: 'Grocery Shopping',
          amount: 150.00,
          categoryid: 'test-category-1',
          accountid: 'test-account-1',
          type: 'Expense',
          tenantid: mockTenantId,
        }
      ];

      mockQueryResult = mockSearchResult;
      
      const results = await repository.findByName('Grocery', mockTenantId);
      
      expect(mockDb.selectDistinct).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].label).toBe('Grocery Shopping');
      expect(results[0].item.name).toBe('Grocery Shopping');
    });

    it('should find all transactions with filters', async () => {
      const mockTransactionView = {
        id: 'test-transaction-8',
        name: 'Filtered Transaction',
        accountid: 'test-account-1',
        categoryid: 'test-category-1',
        amount: 250.00,
        date: new Date().toISOString(),
        type: 'Expense',
        tenantid: mockTenantId,
        accountname: 'Test Account',
        categoryname: 'Test Category',
      };

      mockQueryResult = [mockTransactionView];
      
      const filters: TransactionFilters = {
        name: 'Filtered',
        type: 'Expense',
      };
      
      const results = await repository.findAll(filters, mockTenantId);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Filtered Transaction');
    });

    it('should get transaction by transfer ID', async () => {
      const mockTransactionView = {
        id: 'test-transaction-9',
        name: 'Transfer Transaction',
        transferid: 'transfer-123',
        tenantid: mockTenantId,
      };

      mockQueryResult = [mockTransactionView];

      const result = await repository.getTransactionByTransferId('transfer-123', mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockTransactionView);
    });

    it('should update transfer transaction', async () => {
      const updatedTransaction = {
        id: 'test-transaction-10',
        name: 'Updated Transfer',
        transferid: 'transfer-456',
      };

      mockQueryResult = [updatedTransaction];

      const result = await repository.updateTransferTransaction({
        transferid: 'transfer-456',
        name: 'Updated Transfer',
      });

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedTransaction);
    });

    it('should find transactions by date', async () => {
      const mockTransactionView = {
        id: 'test-transaction-11',
        name: 'Date Transaction',
        date: new Date().toISOString(),
        tenantid: mockTenantId,
      };

      mockQueryResult = [mockTransactionView];

      const result = await repository.findByDate('2024-01-01', mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual([mockTransactionView]);
    });

    it('should find transactions by category', async () => {
      const mockTransactionView = {
        id: 'test-transaction-12',
        name: 'Category Transaction',
        categoryid: 'category-123',
        tenantid: mockTenantId,
      };

      mockQueryResult = [mockTransactionView];

      const result = await repository.findByCategory('category-123', 'category', mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual([mockTransactionView]);
    });

    it('should find transactions by month', async () => {
      const mockTransactionView = {
        id: 'test-transaction-13',
        name: 'Monthly Transaction',
        date: '2024-01-15T00:00:00Z',
        tenantid: mockTenantId,
      };

      mockQueryResult = [mockTransactionView];

      const result = await repository.findByMonth('2024-01', mockTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual([mockTransactionView]);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when transaction not found by transfer ID', async () => {
      mockQueryResult = []; // No results

      await expect(
        repository.getTransactionByTransferId('non-existent-id', mockTenantId)
      ).rejects.toThrow('No transaction found with transfer ID non-existent-id');
    });

    it('should throw error when updating transfer transaction without transfer ID', async () => {
      await expect(
        repository.updateTransferTransaction({ name: 'Updated' })
      ).rejects.toThrow('Transfer ID is required for updating transfer transaction');
    });

    it('should throw error when no transfer transaction found to update', async () => {
      mockQueryResult = []; // No results

      await expect(
        repository.updateTransferTransaction({ transferid: 'non-existent', name: 'Updated' })
      ).rejects.toThrow('No transaction found with transfer ID non-existent');
    });
  });
});