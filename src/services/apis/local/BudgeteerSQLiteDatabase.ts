import * as SQLite from 'expo-sqlite';
import { Database } from '@/src/types/db/database.types';

// Type definitions for our local database tables (same as IndexedDB)
export type LocalAccount = Database['public']['Tables']['accounts']['Row'];
export type LocalAccountCategory = Database['public']['Tables']['accountcategories']['Row'];
export type LocalTransaction = Database['public']['Tables']['transactions']['Row'];
export type LocalTransactionCategory = Database['public']['Tables']['transactioncategories']['Row'];
export type LocalTransactionGroup = Database['public']['Tables']['transactiongroups']['Row'];
export type LocalConfiguration = Database['public']['Tables']['configurations']['Row'];
export type LocalRecurring = Database['public']['Tables']['recurrings']['Row'];

export class BudgeteerSQLiteDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'budgeteer.db';

  constructor() {
    // Database will be initialized when needed
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing SQLite database...');
      
      // Open or create the database
      this.db = await SQLite.openDatabaseAsync(this.dbName);
      
      // Enable foreign key constraints
      await this.db.execAsync('PRAGMA foreign_keys = ON;');
      
      // Create tables if they don't exist
      await this.createTables();
      
      console.log('SQLite database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw new Error(`SQLite database initialization failed: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create account categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS accountcategories (
        id TEXT PRIMARY KEY,
        tenantid TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#000000',
        icon TEXT NOT NULL DEFAULT 'folder',
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        createdat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT
      );
    `);

    // Create accounts table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        tenantid TEXT NOT NULL,
        categoryid TEXT NOT NULL,
        name TEXT NOT NULL,
        balance REAL NOT NULL DEFAULT 0,
        color TEXT NOT NULL DEFAULT '#000000',
        icon TEXT NOT NULL DEFAULT 'wallet',
        currency TEXT NOT NULL DEFAULT 'USD',
        description TEXT,
        notes TEXT,
        owner TEXT,
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        createdat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (categoryid) REFERENCES accountcategories(id)
      );
    `);

    // Create transaction groups table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactiongroups (
        id TEXT PRIMARY KEY,
        tenantid TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#000000',
        icon TEXT NOT NULL DEFAULT 'folder',
        description TEXT,
        budgetamount REAL NOT NULL DEFAULT 0,
        budgetfrequency TEXT NOT NULL DEFAULT 'monthly',
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        createdat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT
      );
    `);

    // Create transaction categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactioncategories (
        id TEXT PRIMARY KEY,
        tenantid TEXT NOT NULL,
        groupid TEXT NOT NULL,
        name TEXT,
        type TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#000000',
        icon TEXT NOT NULL DEFAULT 'tag',
        description TEXT,
        budgetamount REAL NOT NULL DEFAULT 0,
        budgetfrequency TEXT NOT NULL DEFAULT 'monthly',
        displayorder INTEGER NOT NULL DEFAULT 0,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        createdat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (groupid) REFERENCES transactiongroups(id)
      );
    `);

    // Create transactions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        tenantid TEXT NOT NULL,
        accountid TEXT NOT NULL,
        categoryid TEXT NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        type TEXT NOT NULL,
        name TEXT,
        description TEXT,
        notes TEXT,
        payee TEXT,
        tags TEXT, -- JSON array as string
        transferaccountid TEXT,
        transferid TEXT,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        isvoid BOOLEAN NOT NULL DEFAULT 0,
        createdat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (accountid) REFERENCES accounts(id),
        FOREIGN KEY (categoryid) REFERENCES transactioncategories(id),
        FOREIGN KEY (transferaccountid) REFERENCES accounts(id),
        FOREIGN KEY (transferid) REFERENCES transactions(id)
      );
    `);

    // Create configurations table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS configurations (
        id TEXT PRIMARY KEY,
        tenantid TEXT,
        key TEXT NOT NULL,
        table_name TEXT NOT NULL, -- 'table' is reserved keyword
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        createdat TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT
      );
    `);

    // Create recurrings table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS recurrings (
        id TEXT PRIMARY KEY,
        tenantid TEXT NOT NULL,
        sourceaccountid TEXT NOT NULL,
        categoryid TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL,
        currencycode TEXT NOT NULL DEFAULT 'USD',
        description TEXT,
        notes TEXT,
        payeename TEXT,
        recurrencerule TEXT NOT NULL,
        nextoccurrencedate TEXT NOT NULL,
        enddate TEXT,
        isactive BOOLEAN DEFAULT 1,
        isdeleted BOOLEAN NOT NULL DEFAULT 0,
        lastexecutedat TEXT,
        createdat TEXT DEFAULT CURRENT_TIMESTAMP,
        createdby TEXT,
        updatedat TEXT,
        updatedby TEXT,
        FOREIGN KEY (sourceaccountid) REFERENCES accounts(id),
        FOREIGN KEY (categoryid) REFERENCES transactioncategories(id)
      );
    `);

    // Create indexes for better performance
    await this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const indexes = [
      // Account indexes
      'CREATE INDEX IF NOT EXISTS idx_accounts_tenantid ON accounts(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_accounts_categoryid ON accounts(categoryid)',
      'CREATE INDEX IF NOT EXISTS idx_accounts_tenantid_isdeleted ON accounts(tenantid, isdeleted)',
      
      // Account category indexes
      'CREATE INDEX IF NOT EXISTS idx_accountcategories_tenantid ON accountcategories(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_accountcategories_tenantid_isdeleted ON accountcategories(tenantid, isdeleted)',
      
      // Transaction indexes
      'CREATE INDEX IF NOT EXISTS idx_transactions_tenantid ON transactions(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_accountid ON transactions(accountid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_categoryid ON transactions(categoryid)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_tenantid_isdeleted ON transactions(tenantid, isdeleted)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_accountid_date ON transactions(accountid, date)',
      
      // Transaction category indexes
      'CREATE INDEX IF NOT EXISTS idx_transactioncategories_tenantid ON transactioncategories(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_transactioncategories_groupid ON transactioncategories(groupid)',
      'CREATE INDEX IF NOT EXISTS idx_transactioncategories_tenantid_isdeleted ON transactioncategories(tenantid, isdeleted)',
      
      // Transaction group indexes
      'CREATE INDEX IF NOT EXISTS idx_transactiongroups_tenantid ON transactiongroups(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_transactiongroups_tenantid_isdeleted ON transactiongroups(tenantid, isdeleted)',
      
      // Configuration indexes
      'CREATE INDEX IF NOT EXISTS idx_configurations_tenantid ON configurations(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_configurations_key ON configurations(key)',
      'CREATE INDEX IF NOT EXISTS idx_configurations_tenantid_key ON configurations(tenantid, key)',
      
      // Recurring indexes
      'CREATE INDEX IF NOT EXISTS idx_recurrings_tenantid ON recurrings(tenantid)',
      'CREATE INDEX IF NOT EXISTS idx_recurrings_sourceaccountid ON recurrings(sourceaccountid)',
      'CREATE INDEX IF NOT EXISTS idx_recurrings_tenantid_isdeleted ON recurrings(tenantid, isdeleted)',
      'CREATE INDEX IF NOT EXISTS idx_recurrings_nextoccurrencedate ON recurrings(nextoccurrencedate)'
    ];

    for (const indexSql of indexes) {
      await this.db.execAsync(indexSql);
    }
  }

  // Migration support for future database updates
  async migrate(): Promise<void> {
    // Future migrations will be added here
    console.log('SQLite database migration completed');
  }

  // Utility method to verify database is working
  async verifyDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Test basic database operations
      const testId = `test_${Date.now()}`;
      const testConfig = {
        id: testId,
        key: 'test_key',
        table_name: 'test',
        type: 'string',
        value: 'test_value',
        tenantid: null,
        isdeleted: 0,
        createdat: new Date().toISOString(),
        createdby: 'system',
        updatedat: new Date().toISOString(),
        updatedby: 'system'
      };

      // Insert test record
      await this.db.runAsync(
        'INSERT INTO configurations (id, key, table_name, type, value, tenantid, isdeleted, createdat, createdby, updatedat, updatedby) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [testConfig.id, testConfig.key, testConfig.table_name, testConfig.type, testConfig.value, testConfig.tenantid, testConfig.isdeleted, testConfig.createdat, testConfig.createdby, testConfig.updatedat, testConfig.updatedby]
      );

      // Retrieve test record
      const retrieved = await this.db.getFirstAsync(
        'SELECT * FROM configurations WHERE id = ?',
        [testId]
      ) as any;

      if (!retrieved || retrieved.value !== 'test_value') {
        throw new Error('Database verification failed: could not retrieve test record');
      }

      // Delete test record
      await this.db.runAsync('DELETE FROM configurations WHERE id = ?', [testId]);

      console.log('SQLite database verification completed successfully');
    } catch (error) {
      console.error('SQLite database verification failed:', error);
      throw error;
    }
  }

  // Get database info for debugging
  async getDatabaseInfo(): Promise<any> {
    if (!this.db) {
      return {
        name: this.dbName,
        initialized: false,
        error: 'Database not initialized'
      };
    }

    try {
      const tables = ['accounts', 'accountcategories', 'transactions', 'transactioncategories', 'transactiongroups', 'configurations', 'recurrings'];
      const info: any = {
        name: this.dbName,
        initialized: true,
        tables: {}
      };

      for (const tableName of tables) {
        try {
          const result = await this.db.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`) as any;
          info.tables[tableName] = { count: result?.count || 0 };
        } catch (error) {
          info.tables[tableName] = { error: (error as Error).message };
        }
      }

      return info;
    } catch (error) {
      return {
        name: this.dbName,
        initialized: true,
        error: (error as Error).message
      };
    }
  }
}

// Export singleton instance
export const sqliteDb = new BudgeteerSQLiteDatabase();