import { IStorageProvider, StorageMode } from '../../storage/types';
import { sqliteDb } from './BudgeteerSQLiteDatabase';
import { initializeSQLiteMigrations } from './sqliteMigrations';
import { Platform } from 'react-native';

export class SQLiteStorageProvider implements IStorageProvider {
  public readonly mode: StorageMode = 'local';
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        console.log('SQLite storage already initialized');
        return;
      }

      // Only initialize on native platforms
      if (Platform.OS === 'web') {
        throw new Error('SQLite storage is not supported on web platform. Use IndexedDB instead.');
      }

      console.log('Initializing SQLite storage...');

      // Initialize the database
      await sqliteDb.initialize();

      // Run any pending migrations
      await initializeSQLiteMigrations();

      // Verify database is working
      await sqliteDb.verifyDatabase();

      this.initialized = true;
      console.log('SQLite storage initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite storage:', error);
      throw new Error(`SQLite storage initialization failed: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up SQLite storage...');
      
      await sqliteDb.close();

      this.initialized = false;
      console.log('SQLite storage cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup SQLite storage:', error);
      throw new Error(`SQLite storage cleanup failed: ${error}`);
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async getDatabaseInfo(): Promise<any> {
    try {
      return await sqliteDb.getDatabaseInfo();
    } catch (error) {
      console.error('Failed to get SQLite database info:', error);
      return {
        name: 'budgeteer.db',
        initialized: this.initialized,
        error: (error as Error).message
      };
    }
  }
}

// Export singleton instance
export const sqliteStorageProvider = new SQLiteStorageProvider();