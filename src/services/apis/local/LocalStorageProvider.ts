import { IStorageProvider, StorageMode } from '../../storage/types';
import { db } from './BudgeteerDatabase';
import { initializeMigrations } from './migrations';

export class LocalStorageProvider implements IStorageProvider {
  public readonly mode: StorageMode = 'local';
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        console.log('Local storage already initialized');
        return;
      }

      console.log('Initializing local storage...');

      // Open the database
      await db.open();

      // Run any pending migrations
      await initializeMigrations();

      // Verify database is working
      await this.verifyDatabase();

      this.initialized = true;
      console.log('Local storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local storage:', error);
      throw new Error(`Local storage initialization failed: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up local storage...');
      
      if (db.isOpen()) {
        await db.close();
      }

      this.initialized = false;
      console.log('Local storage cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup local storage:', error);
      throw new Error(`Local storage cleanup failed: ${error}`);
    }
  }

  private async verifyDatabase(): Promise<void> {
    try {
      // Test basic database operations
      const testConfig = {
        id: `test_${Date.now()}`,
        key: 'test_key',
        table: 'test',
        type: 'string',
        value: 'test_value',
        tenantid: null,
        isdeleted: false,
        createdat: new Date().toISOString(),
        createdby: 'system',
        updatedat: new Date().toISOString(),
        updatedby: 'system'
      };

      // Add test record
      await db.configurations.add(testConfig);

      // Retrieve test record
      const retrieved = await db.configurations.get(testConfig.id);
      if (!retrieved || retrieved.value !== 'test_value') {
        throw new Error('Database verification failed: could not retrieve test record');
      }

      // Delete test record
      await db.configurations.delete(testConfig.id);

      console.log('Database verification completed successfully');
    } catch (error) {
      console.error('Database verification failed:', error);
      throw error;
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async getDatabaseInfo(): Promise<any> {
    try {
      const tables = ['accounts', 'accountcategories', 'transactions', 'transactioncategories', 'transactiongroups', 'configurations', 'recurrings'];
      const info: any = {
        name: db.name,
        version: db.verno,
        isOpen: db.isOpen(),
        tables: {}
      };

      if (db.isOpen()) {
        for (const tableName of tables) {
          const table = (db as any)[tableName];
          if (table) {
            const count = await table.count();
            info.tables[tableName] = { count };
          }
        }
      }

      return info;
    } catch (error) {
      console.error('Failed to get database info:', error);
      return {
        name: db.name,
        version: db.verno,
        isOpen: db.isOpen(),
        error: (error as Error).message
      };
    }
  }
}

// Export singleton instance
export const localStorageProvider = new LocalStorageProvider();