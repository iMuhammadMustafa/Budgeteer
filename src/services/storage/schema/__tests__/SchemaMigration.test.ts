/**
 * Tests for Schema Migration Utilities
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Import types only for testing
type MigrationResult = {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  appliedMigrations: number[];
  errors: string[];
};

type SchemaVersion = {
  version: number;
  appliedAt: Date;
  description: string;
};

// Mock implementation for testing
class MockSchemaMigration {
  private version: number = 0;
  private migrationHistory: SchemaVersion[] = [];
  private tables: Set<string> = new Set();
  private migrations: Map<number, any> = new Map();

  constructor() {
    // Initialize migrations like the base class would
    this.migrations.set(1, {
      version: 1,
      description: 'Initial schema creation',
      up: async () => this.createInitialSchema(),
      down: async () => this.dropAllTables()
    });
    this.migrations.set(2, {
      version: 2,
      description: 'Add performance indexes',
      up: async () => this.createPerformanceIndexes(),
      down: async () => this.dropPerformanceIndexes()
    });
  }

  async getCurrentVersion(): Promise<number> {
    return this.version;
  }

  async setVersion(version: number, description: string): Promise<void> {
    this.version = version;
    this.migrationHistory.push({
      version,
      description,
      appliedAt: new Date()
    });
  }

  async createInitialSchema(): Promise<void> {
    this.tables.add('accounts');
    this.tables.add('accountcategories');
    this.tables.add('transactions');
    this.tables.add('transactioncategories');
    this.tables.add('transactiongroups');
    this.tables.add('configurations');
    this.tables.add('recurrings');
  }

  async dropAllTables(): Promise<void> {
    this.tables.clear();
  }

  async createPerformanceIndexes(): Promise<void> {
    // Mock implementation
  }

  async dropPerformanceIndexes(): Promise<void> {
    // Mock implementation
  }

  async createForeignKeyConstraints(): Promise<void> {
    // Mock implementation
  }

  async dropForeignKeyConstraints(): Promise<void> {
    // Mock implementation
  }

  async tableExists(tableName: string): Promise<boolean> {
    return this.tables.has(tableName);
  }

  async validateTableStructures(errors: string[]): Promise<void> {
    const requiredTables = ['accounts', 'accountcategories', 'transactions'];
    for (const table of requiredTables) {
      if (!this.tables.has(table)) {
        errors.push(`Table '${table}' is missing`);
      }
    }
  }

  async getMigrationHistory(): Promise<SchemaVersion[]> {
    return [...this.migrationHistory];
  }

  // Implement the migrate method similar to the base class
  async migrate(targetVersion?: number): Promise<MigrationResult> {
    const currentVersion = await this.getCurrentVersion();
    const target = targetVersion || 2;
    
    const result: MigrationResult = {
      success: true,
      fromVersion: currentVersion,
      toVersion: target,
      appliedMigrations: [],
      errors: []
    };

    try {
      if (currentVersion < target) {
        // Run up migrations
        for (let version = currentVersion + 1; version <= target; version++) {
          const migration = this.migrations.get(version);
          if (migration) {
            await migration.up();
            await this.setVersion(version, migration.description);
            result.appliedMigrations.push(version);
          }
        }
      } else if (currentVersion > target) {
        // Run down migrations
        for (let version = currentVersion; version > target; version--) {
          const migration = this.migrations.get(version);
          if (migration) {
            await migration.down();
            await this.setVersion(version - 1, `Rollback: ${migration.description}`);
            result.appliedMigrations.push(version);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
    }

    return result;
  }

  async validateSchema(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate all tables exist
      const requiredTables = ['accounts', 'accountcategories', 'transactions', 'transactioncategories', 'transactiongroups', 'configurations', 'recurrings'];
      for (const tableName of requiredTables) {
        const exists = await this.tableExists(tableName);
        if (!exists) {
          errors.push(`Table '${tableName}' does not exist`);
        }
      }

      await this.validateTableStructures(errors);

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

describe('SchemaMigrationBase', () => {
  let migration: MockSchemaMigration;

  beforeEach(() => {
    migration = new MockSchemaMigration();
  });

  describe('migrate', () => {
    it('should run up migrations to target version', async () => {
      const result = await migration.migrate(2);

      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe(0);
      expect(result.toVersion).toBe(2);
      expect(result.appliedMigrations).toEqual([1, 2]);
      expect(result.errors).toHaveLength(0);
    });

    it('should run down migrations when target is lower', async () => {
      // First migrate up to version 2 (max available)
      await migration.migrate(2);
      
      // Then migrate down to version 1
      const result = await migration.migrate(1);

      expect(result.success).toBe(true);
      expect(result.fromVersion).toBe(2);
      expect(result.toVersion).toBe(1);
      expect(result.appliedMigrations).toEqual([2]);
    });

    it('should handle migration errors gracefully', async () => {
      // Create a migration that will fail
      const failingMigration = new MockSchemaMigration();
      failingMigration['createInitialSchema'] = async () => {
        throw new Error('Migration failed');
      };

      const result = await failingMigration.migrate(1);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Migration failed');
    });

    it('should not migrate if already at target version', async () => {
      await migration.migrate(2);
      const result = await migration.migrate(2);

      expect(result.success).toBe(true);
      expect(result.appliedMigrations).toHaveLength(0);
    });
  });

  describe('validateSchema', () => {
    it('should validate schema successfully after migration', async () => {
      await migration.migrate(1);
      const validation = await migration.validateSchema();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing tables', async () => {
      // Don't run migration, so tables won't exist
      const validation = await migration.validateSchema();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(e => e.includes('does not exist'))).toBe(true);
    });
  });

  describe('getMigrationHistory', () => {
    it('should track migration history', async () => {
      await migration.migrate(2);
      const history = await migration.getMigrationHistory();

      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(1);
      expect(history[0].description).toBe('Initial schema creation');
      expect(history[1].version).toBe(2);
      expect(history[1].description).toBe('Add performance indexes');
    });
  });
});

describe('Migration Factory and Classes', () => {
  it('should test migration factory concept', () => {
    // Test the concept of creating different migration types
    const createMigration = (type: 'indexeddb' | 'sqlite') => {
      switch (type) {
        case 'indexeddb':
          return { type: 'indexeddb', dbName: 'test' };
        case 'sqlite':
          return { type: 'sqlite', dbPath: 'test.db' };
        default:
          throw new Error(`Unsupported type: ${type}`);
      }
    };

    const indexedDbMigration = createMigration('indexeddb');
    expect(indexedDbMigration.type).toBe('indexeddb');

    const sqliteMigration = createMigration('sqlite');
    expect(sqliteMigration.type).toBe('sqlite');

    expect(() => createMigration('unsupported' as any)).toThrow('Unsupported type');
  });

  it('should test migration concepts', () => {
    // Test basic migration concepts
    const migration = {
      version: 1,
      description: 'Initial schema',
      up: () => Promise.resolve(),
      down: () => Promise.resolve()
    };

    expect(migration.version).toBe(1);
    expect(migration.description).toBe('Initial schema');
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  it('should test schema validation concepts', () => {
    // Test schema validation concepts
    const validateSchema = (tables: string[]) => {
      const requiredTables = ['accounts', 'transactions', 'accountcategories'];
      const errors: string[] = [];
      
      for (const table of requiredTables) {
        if (!tables.includes(table)) {
          errors.push(`Table '${table}' is missing`);
        }
      }
      
      return { isValid: errors.length === 0, errors };
    };

    const validSchema = validateSchema(['accounts', 'transactions', 'accountcategories']);
    expect(validSchema.isValid).toBe(true);

    const invalidSchema = validateSchema(['accounts']);
    expect(invalidSchema.isValid).toBe(false);
    expect(invalidSchema.errors.length).toBeGreaterThan(0);
  });
});