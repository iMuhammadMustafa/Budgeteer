import { ConfigurationSQLiteRepository } from '../../../repositories/sqlite/Configurations.sqlite';
import type { ConfigurationInsert } from '../../../types/db/sqllite/schema';

// Mock the SQLite provider
jest.mock("../../../providers/SQLite", () => ({
  getSQLiteDB: jest.fn(),
  isSQLiteReady: jest.fn(() => true),
}));

// Mock drizzle-orm
let mockQueryResult: any[] = [];

const createMockChain = (result: any) => {
  // Create a mock object that can be both awaited directly and chained
  const whereResult = Promise.resolve(result);
  whereResult.orderBy = jest.fn().mockReturnValue(result);
  whereResult.limit = jest.fn().mockReturnValue(result);
  
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue(whereResult),
    }),
  };
};

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

describe('ConfigurationSQLiteRepository', () => {
  let repository: ConfigurationSQLiteRepository;
  const testTenantId = 'test-tenant-123';

  beforeEach(() => {
    repository = new ConfigurationSQLiteRepository();
    jest.clearAllMocks();
    mockQueryResult = [];
  });

  describe('Basic CRUD Operations', () => {
    it('should create a configuration', async () => {
      const configData: ConfigurationInsert = {
        id: 'config-1',
        key: 'test-key',
        value: 'test-value',
        type: 'string',
        table: 'accounts',
        tenantid: testTenantId,
        createdat: new Date().toISOString(),
      };

      const createdConfig = { ...configData, isdeleted: false };
      mockQueryResult = [createdConfig];

      const result = await repository.create(configData, testTenantId);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result).toEqual(createdConfig);
    });

    it('should find configuration by id', async () => {
      const mockConfig = {
        id: 'config-2',
        key: 'find-key',
        value: 'find-value',
        type: 'string',
        table: 'transactions',
        tenantid: testTenantId,
        isdeleted: false,
        createdat: new Date().toISOString(),
      };

      mockQueryResult = [mockConfig];

      const result = await repository.findById('config-2', testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should find all configurations for tenant', async () => {
      const mockConfigs = [
        {
          id: 'config-3',
          key: 'key1',
          value: 'value1',
          type: 'string',
          table: 'accounts',
          tenantid: testTenantId,
          isdeleted: false,
          createdat: new Date().toISOString(),
        },
        {
          id: 'config-4',
          key: 'key2',
          value: 'value2',
          type: 'number',
          table: 'transactions',
          tenantid: testTenantId,
          isdeleted: false,
          createdat: new Date().toISOString(),
        },
      ];

      mockQueryResult = mockConfigs;

      const results = await repository.findAll({}, testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(results).toEqual(mockConfigs);
    });

    it('should update configuration', async () => {
      const updatedConfig = {
        id: 'config-5',
        key: 'update-key',
        value: 'updated-value',
        type: 'text',
        table: 'accounts',
        tenantid: testTenantId,
        isdeleted: false,
        createdat: new Date().toISOString(),
      };

      mockQueryResult = [updatedConfig];

      const result = await repository.update('config-5', {
        value: 'updated-value',
        type: 'text'
      }, testTenantId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(result).toEqual(updatedConfig);
    });

    it('should soft delete configuration', async () => {
      await repository.softDelete('config-6', testTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('should restore soft-deleted configuration', async () => {
      await repository.restore('config-7', testTenantId);

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('getConfiguration method', () => {
    it('should get configuration by table, type, and key', async () => {
      const mockConfig = {
        id: 'config-get-1',
        key: 'default-currency',
        value: 'USD',
        type: 'string',
        table: 'accounts',
        tenantid: testTenantId,
        isdeleted: false,
        createdat: new Date().toISOString(),
      };

      mockQueryResult = [mockConfig];

      const result = await repository.getConfiguration('accounts', 'string', 'default-currency', testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should get configuration with case-insensitive matching', async () => {
      const mockConfig = {
        id: 'config-get-1',
        key: 'default-currency',
        value: 'USD',
        type: 'string',
        table: 'accounts',
        tenantid: testTenantId,
        isdeleted: false,
        createdat: new Date().toISOString(),
      };

      mockQueryResult = [mockConfig];

      const result = await repository.getConfiguration('ACCOUNTS', 'STRING', 'DEFAULT-CURRENCY', testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
    });

    it('should throw error when configuration not found', async () => {
      mockQueryResult = []; // No results

      await expect(
        repository.getConfiguration('nonexistent', 'string', 'key', testTenantId)
      ).rejects.toThrow('Configuration not found');
    });

    it('should filter by tenant id', async () => {
      const mockConfig = {
        id: 'config-tenant-specific',
        key: 'default-currency',
        value: 'USD',
        type: 'string',
        table: 'accounts',
        tenantid: testTenantId,
        isdeleted: false,
        createdat: new Date().toISOString(),
      };

      mockQueryResult = [mockConfig];

      const result = await repository.getConfiguration('accounts', 'string', 'default-currency', testTenantId);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockConfig);
      expect(result.tenantid).toBe(testTenantId);
    });

    it('should not find soft-deleted configurations', async () => {
      mockQueryResult = []; // Simulate no results for soft-deleted config

      await expect(
        repository.getConfiguration('accounts', 'string', 'default-currency', testTenantId)
      ).rejects.toThrow('Configuration not found');
    });
  });

  describe('Error Handling', () => {
    it('should return null when findById returns no results', async () => {
      mockQueryResult = [];

      const result = await repository.findById('nonexistent', testTenantId);

      expect(result).toBeNull();
    });

    it('should return null when update returns no results', async () => {
      mockQueryResult = [];

      const result = await repository.update('nonexistent', { value: 'new-value' }, testTenantId);

      expect(result).toBeNull();
    });
  });
});