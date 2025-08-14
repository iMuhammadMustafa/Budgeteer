/**
 * Schema Migration Utilities for Local Storage
 * 
 * This module provides schema migration utilities for local storage implementations
 * (IndexedDB and SQLite) to handle database schema updates and version management.
 */

import { Database } from '@/src/types/db/database.types';
import { TableNames, ViewNames } from '@/src/types/db/TableNames';
import { schemaValidator } from './SchemaValidator';

export interface MigrationScript {
  version: number;
  description: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

export interface SchemaVersion {
  version: number;
  appliedAt: Date;
  description: string;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  appliedMigrations: number[];
  errors: string[];
}

/**
 * Abstract base class for schema migration implementations
 */
export abstract class SchemaMigrationBase {
  protected currentVersion: number = 1;
  protected migrations: Map<number, MigrationScript> = new Map();

  constructor() {
    this.initializeMigrations();
  }

  /**
   * Initialize migration scripts
   */
  protected initializeMigrations(): void {
    // Migration 1: Initial schema creation
    this.addMigration({
      version: 1,
      description: 'Initial schema creation',
      up: async () => {
        await this.createInitialSchema();
      },
      down: async () => {
        await this.dropAllTables();
      }
    });

    // Migration 2: Add indexes for performance
    this.addMigration({
      version: 2,
      description: 'Add performance indexes',
      up: async () => {
        await this.createPerformanceIndexes();
      },
      down: async () => {
        await this.dropPerformanceIndexes();
      }
    });

    // Migration 3: Add foreign key constraints
    this.addMigration({
      version: 3,
      description: 'Add foreign key constraints',
      up: async () => {
        await this.createForeignKeyConstraints();
      },
      down: async () => {
        await this.dropForeignKeyConstraints();
      }
    });
  }

  /**
   * Add a migration script
   */
  protected addMigration(migration: MigrationScript): void {
    this.migrations.set(migration.version, migration);
  }

  /**
   * Get current schema version from storage
   */
  public abstract getCurrentVersion(): Promise<number>;

  /**
   * Set schema version in storage
   */
  protected abstract setVersion(version: number, description: string): Promise<void>;

  /**
   * Create initial database schema
   */
  protected abstract createInitialSchema(): Promise<void>;

  /**
   * Drop all tables
   */
  protected abstract dropAllTables(): Promise<void>;

  /**
   * Create performance indexes
   */
  protected abstract createPerformanceIndexes(): Promise<void>;

  /**
   * Drop performance indexes
   */
  protected abstract dropPerformanceIndexes(): Promise<void>;

  /**
   * Create foreign key constraints
   */
  protected abstract createForeignKeyConstraints(): Promise<void>;

  /**
   * Drop foreign key constraints
   */
  protected abstract dropForeignKeyConstraints(): Promise<void>;

  /**
   * Run migrations to bring schema up to target version
   */
  public async migrate(targetVersion?: number): Promise<MigrationResult> {
    const currentVersion = await this.getCurrentVersion();
    const target = targetVersion || this.currentVersion;
    
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

  /**
   * Get migration history
   */
  public abstract getMigrationHistory(): Promise<SchemaVersion[]>;

  /**
   * Validate current schema against expected structure
   */
  public async validateSchema(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate all tables exist
      for (const tableName of Object.values(TableNames)) {
        const exists = await this.tableExists(tableName);
        if (!exists) {
          errors.push(`Table '${tableName}' does not exist`);
        }
      }

      // Validate schema structure matches database.types.ts
      await this.validateTableStructures(errors);

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a table exists
   */
  protected abstract tableExists(tableName: string): Promise<boolean>;

  /**
   * Validate table structures match expected schema
   */
  protected abstract validateTableStructures(errors: string[]): Promise<void>;

  /**
   * Get table schema information
   */
  protected getTableSchema(tableName: string): any {
    return schemaValidator.getTableMetadata(tableName);
  }
}

/**
 * IndexedDB-specific migration implementation
 */
export class IndexedDBMigration extends SchemaMigrationBase {
  private db: IDBDatabase | null = null;
  private dbName: string;

  constructor(dbName: string = 'BudgeteerDB') {
    super();
    this.dbName = dbName;
  }

  public async getCurrentVersion(): Promise<number> {
    if (!this.db) {
      await this.openDatabase();
    }
    return this.db?.version || 0;
  }

  protected async setVersion(version: number, description: string): Promise<void> {
    // IndexedDB version is managed by the database itself
    // We can store migration history in a separate object store
    await this.storeMigrationRecord(version, description);
  }

  protected async createInitialSchema(): Promise<void> {
    // IndexedDB schema is created during database opening
    // This is handled in the database upgrade event
  }

  protected async dropAllTables(): Promise<void> {
    if (!this.db) return;
    
    const objectStoreNames = Array.from(this.db.objectStoreNames);
    // Note: Cannot drop object stores outside of upgrade transaction
    // This would need to be handled during database version upgrade
  }

  protected async createPerformanceIndexes(): Promise<void> {
    // Indexes are created during object store creation in IndexedDB
    // This would be handled in the upgrade transaction
  }

  protected async dropPerformanceIndexes(): Promise<void> {
    // Index management in IndexedDB is handled during upgrade transactions
  }

  protected async createForeignKeyConstraints(): Promise<void> {
    // IndexedDB doesn't have built-in foreign key constraints
    // These are enforced at the application level through validation
  }

  protected async dropForeignKeyConstraints(): Promise<void> {
    // No-op for IndexedDB as constraints are application-level
  }

  protected async tableExists(tableName: string): Promise<boolean> {
    if (!this.db) {
      await this.openDatabase();
    }
    return this.db?.objectStoreNames.contains(tableName) || false;
  }

  protected async validateTableStructures(errors: string[]): Promise<void> {
    if (!this.db) return;

    for (const tableName of Object.values(TableNames)) {
      if (!this.db.objectStoreNames.contains(tableName)) {
        errors.push(`Object store '${tableName}' is missing`);
      }
    }
  }

  public async getMigrationHistory(): Promise<SchemaVersion[]> {
    // Implementation would read from a migrations object store
    return [];
  }

  private async openDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }

  private async storeMigrationRecord(version: number, description: string): Promise<void> {
    // Implementation would store migration record in a dedicated object store
  }
}

/**
 * SQLite-specific migration implementation
 */
export class SQLiteMigration extends SchemaMigrationBase {
  private db: any; // SQLite database instance
  private dbPath: string;

  constructor(dbPath: string = 'budgeteer.db') {
    super();
    this.dbPath = dbPath;
  }

  public async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync('PRAGMA user_version');
      return result?.user_version || 0;
    } catch {
      return 0;
    }
  }

  protected async setVersion(version: number, description: string): Promise<void> {
    await this.db.execAsync(`PRAGMA user_version = ${version}`);
    
    // Store migration history
    await this.db.runAsync(
      'INSERT OR REPLACE INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)',
      [version, description, new Date().toISOString()]
    );
  }

  protected async createInitialSchema(): Promise<void> {
    // Create schema_migrations table first
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        description TEXT NOT NULL,
        applied_at TEXT NOT NULL
      )
    `);

    // Create all tables based on database.types.ts structure
    await this.createAccountCategoriesTable();
    await this.createAccountsTable();
    await this.createTransactionGroupsTable();
    await this.createTransactionCategoriesTable();
    await this.createTransactionsTable();
    await this.createConfigurationsTable();
    await this.createRecurringsTable();
  }

  protected async dropAllTables(): Promise<void> {
    const tables = Object.values(TableNames);
    for (const table of tables) {
      await this.db.execAsync(`DROP TABLE IF EXISTS ${table}`);
    }
    await this.db.execAsync('DROP TABLE IF EXISTS schema_migrations');
  }

  protected async createPerformanceIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_accounts_tenantid ON accounts(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_accounts_categoryid ON accounts(categoryid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_tenantid ON transactions(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_accountid ON transactions(accountid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_categoryid ON transactions(categoryid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
      'CREATE INDEX IF NOT EXISTS idx_transactioncategories_tenantid ON transactioncategories(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_transactioncategories_groupid ON transactioncategories(groupid)',
      'CREATE INDEX IF NOT EXISTS idx_recurrings_tenantid ON recurrings(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_recurrings_sourceaccountid ON recurrings(sourceaccountid)'
    ];

    for (const indexSql of indexes) {
      await this.db.execAsync(indexSql);
    }
  }

  protected async dropPerformanceIndexes(): Promise<void> {
    const indexes = [
      'idx_accounts_tenantid',
      'idx_accounts_categoryid',
      'idx_transactions_tenantid',
      'idx_transactions_accountid',
      'idx_transactions_categoryid',
      'idx_transactions_date',
      'idx_transactioncategories_tenantid',
      'idx_transactioncategories_groupid',
      'idx_recurrings_tenantid',
      'idx_recurrings_sourceaccountid'
    ];

    for (const index of indexes) {
      await this.db.execAsync(`DROP INDEX IF EXISTS ${index}`);
    }
  }

  protected async createForeignKeyConstraints(): Promise<void> {
    // Enable foreign key constraints
    await this.db.execAsync('PRAGMA foreign_keys = ON');
  }

  protected async dropForeignKeyConstraints(): Promise<void> {
    // Disable foreign key constraints
    await this.db.execAsync('PRAGMA foreign_keys = OFF');
  }

  protected async tableExists(tableName: string): Promise<boolean> {
    const result = await this.db.getFirstAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      [tableName]
    );
    return !!result;
  }

  protected async validateTableStructures(errors: string[]): Promise<void> {
    for (const tableName of Object.values(TableNames)) {
      try {
        const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
        if (tableInfo.length === 0) {
          errors.push(`Table '${tableName}' structure could not be validated`);
        }
        // Additional structure validation could be added here
      } catch (error) {
        errors.push(`Failed to validate table '${tableName}': ${error}`);
      }
    }
  }

  public async getMigrationHistory(): Promise<SchemaVersion[]> {
    try {
      const results = await this.db.getAllAsync(
        'SELECT version, description, applied_at FROM schema_migrations ORDER BY version'
      );
      
      return results.map((row: any) => ({
        version: row.version,
        description: row.description,
        appliedAt: new Date(row.applied_at)
      }));
    } catch {
      return [];
    }
  }

  // Table creation methods
  private async createAccountCategoriesTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS accountcategories (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'Asset',
        color TEXT NOT NULL DEFAULT '#3B82F6',
        icon TEXT NOT NULL DEFAULT 'wallet',
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
        createdat TEXT NOT NULL DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT
      )
    `);
  }

  private async createAccountsTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        categoryid TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#3B82F6',
        icon TEXT NOT NULL DEFAULT 'wallet',
        currency TEXT NOT NULL DEFAULT 'USD',
        description TEXT,
        notes TEXT,
        owner TEXT,
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
        createdat TEXT NOT NULL DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (categoryid) REFERENCES accountcategories(id)
      )
    `);
  }

  private async createTransactionGroupsTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactiongroups (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT NOT NULL DEFAULT '',
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'Expense',
        color TEXT NOT NULL DEFAULT '#EF4444',
        icon TEXT NOT NULL DEFAULT 'shopping-cart',
        description TEXT,
        budgetamount REAL NOT NULL DEFAULT 0,
        budgetfrequency TEXT NOT NULL DEFAULT 'monthly',
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
        createdat TEXT NOT NULL DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT
      )
    `);
  }

  private async createTransactionCategoriesTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactioncategories (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT NOT NULL,
        groupid TEXT NOT NULL,
        name TEXT,
        type TEXT NOT NULL DEFAULT 'Expense',
        color TEXT NOT NULL DEFAULT '#EF4444',
        icon TEXT NOT NULL DEFAULT 'shopping-cart',
        description TEXT,
        budgetamount REAL NOT NULL DEFAULT 0,
        budgetfrequency TEXT NOT NULL DEFAULT 'monthly',
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
        createdat TEXT NOT NULL DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (groupid) REFERENCES transactiongroups(id)
      )
    `);
  }

  private async createTransactionsTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT NOT NULL DEFAULT '',
        accountid TEXT NOT NULL,
        categoryid TEXT NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        type TEXT NOT NULL DEFAULT 'Expense',
        name TEXT,
        description TEXT,
        notes TEXT,
        payee TEXT,
        tags TEXT, -- JSON array as text
        transferaccountid TEXT,
        transferid TEXT,
        isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
        isvoid BOOLEAN NOT NULL DEFAULT FALSE,
        createdat TEXT NOT NULL DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (accountid) REFERENCES accounts(id),
        FOREIGN KEY (categoryid) REFERENCES transactioncategories(id),
        FOREIGN KEY (transferaccountid) REFERENCES accounts(id),
        FOREIGN KEY (transferid) REFERENCES transactions(id)
      )
    `);
  }

  private async createConfigurationsTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT,
        key TEXT NOT NULL,
        table TEXT NOT NULL,
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        isdeleted BOOLEAN NOT NULL DEFAULT FALSE,
        createdat TEXT NOT NULL DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT
      )
    `);
  }

  private async createRecurringsTable(): Promise<void> {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurrings (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        tenantid TEXT NOT NULL,
        name TEXT NOT NULL,
        sourceaccountid TEXT NOT NULL,
        categoryid TEXT,
        amount REAL,
        type TEXT NOT NULL DEFAULT 'Expense',
        description TEXT,
        notes TEXT,
        payeename TEXT,
        currencycode TEXT NOT NULL DEFAULT 'USD',
        recurrencerule TEXT NOT NULL,
        nextoccurrencedate TEXT NOT NULL,
        enddate TEXT,
        lastexecutedat TEXT,
        isactive BOOLEAN DEFAULT TRUE,
        isdeleted BOOLEAN DEFAULT FALSE,
        createdat TEXT DEFAULT (datetime('now')),
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (sourceaccountid) REFERENCES accounts(id),
        FOREIGN KEY (categoryid) REFERENCES transactioncategories(id)
      )
    `);
  }
}

/**
 * Factory function to create appropriate migration instance
 */
export function createSchemaMigration(storageType: 'indexeddb' | 'sqlite', config?: any): SchemaMigrationBase {
  switch (storageType) {
    case 'indexeddb':
      return new IndexedDBMigration(config?.dbName);
    case 'sqlite':
      return new SQLiteMigration(config?.dbPath);
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
}