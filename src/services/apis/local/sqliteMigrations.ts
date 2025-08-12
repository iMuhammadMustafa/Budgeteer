import { sqliteDb } from './BudgeteerSQLiteDatabase';

interface Migration {
  version: number;
  name: string;
  up: (db: any) => Promise<void>;
  down?: (db: any) => Promise<void>;
}

const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: async (db) => {
      // Initial schema is created in BudgeteerSQLiteDatabase.createTables()
      // This migration is just a placeholder for version tracking
      console.log('Initial schema migration completed');
    }
  }
  // Future migrations will be added here
];

export class SQLiteMigrationManager {
  private db: any;

  constructor() {
    this.db = sqliteDb.getDatabase();
  }

  async initializeMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('Migration system initialized');
    } catch (error) {
      console.error('Failed to initialize migration system:', error);
      throw error;
    }
  }

  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT MAX(version) as version FROM migrations'
      ) as { version: number | null };

      return result?.version || 0;
    } catch (error) {
      console.error('Failed to get current migration version:', error);
      return 0;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      await this.initializeMigrations();
      
      const currentVersion = await this.getCurrentVersion();
      const pendingMigrations = migrations.filter(m => m.version > currentVersion);

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Running ${pendingMigrations.length} pending migrations...`);

      for (const migration of pendingMigrations) {
        console.log(`Running migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.up(this.db);
          
          // Record the migration as applied
          await this.db.runAsync(
            'INSERT INTO migrations (version, name) VALUES (?, ?)',
            [migration.version, migration.name]
          );
          
          console.log(`Migration ${migration.version} completed successfully`);
        } catch (error) {
          console.error(`Migration ${migration.version} failed:`, error);
          throw new Error(`Migration ${migration.version} (${migration.name}) failed: ${error}`);
        }
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration process failed:', error);
      throw error;
    }
  }

  async rollbackMigration(targetVersion: number): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      if (targetVersion >= currentVersion) {
        console.log('No rollback needed');
        return;
      }

      const migrationsToRollback = migrations
        .filter(m => m.version > targetVersion && m.version <= currentVersion)
        .sort((a, b) => b.version - a.version); // Rollback in reverse order

      console.log(`Rolling back ${migrationsToRollback.length} migrations...`);

      for (const migration of migrationsToRollback) {
        if (!migration.down) {
          throw new Error(`Migration ${migration.version} (${migration.name}) does not support rollback`);
        }

        console.log(`Rolling back migration ${migration.version}: ${migration.name}`);
        
        try {
          await migration.down(this.db);
          
          // Remove the migration record
          await this.db.runAsync(
            'DELETE FROM migrations WHERE version = ?',
            [migration.version]
          );
          
          console.log(`Migration ${migration.version} rolled back successfully`);
        } catch (error) {
          console.error(`Rollback of migration ${migration.version} failed:`, error);
          throw new Error(`Rollback of migration ${migration.version} (${migration.name}) failed: ${error}`);
        }
      }

      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback process failed:', error);
      throw error;
    }
  }

  async getMigrationHistory(): Promise<any[]> {
    try {
      const history = await this.db.getAllAsync(
        'SELECT * FROM migrations ORDER BY version ASC'
      );

      return history || [];
    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const sqliteMigrationManager = new SQLiteMigrationManager();

// Export function for easy initialization
export async function initializeSQLiteMigrations(): Promise<void> {
  await sqliteMigrationManager.runMigrations();
}