import { db } from './BudgeteerDatabase';

export interface Migration {
  version: number;
  description: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export class MigrationManager {
  private static instance: MigrationManager;
  private migrations: Migration[] = [];

  private constructor() {
    this.initializeMigrations();
  }

  public static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  private initializeMigrations() {
    // Future migrations will be added here
    // Example:
    // this.migrations.push({
    //   version: 2,
    //   description: 'Add new column to accounts table',
    //   up: async () => {
    //     // Migration logic here
    //   }
    // });
  }

  public async runMigrations(): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      const pendingMigrations = this.migrations.filter(m => m.version > currentVersion);

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Running ${pendingMigrations.length} migrations...`);

      for (const migration of pendingMigrations) {
        console.log(`Running migration ${migration.version}: ${migration.description}`);
        await migration.up();
        await this.setCurrentVersion(migration.version);
        console.log(`Migration ${migration.version} completed`);
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async getCurrentVersion(): Promise<number> {
    try {
      // Check if we have a version stored in configurations
      const versionConfig = await db.configurations
        .where('key')
        .equals('schema_version')
        .and(config => config.table === 'system')
        .first();

      return versionConfig ? parseInt(versionConfig.value) : 1;
    } catch (error) {
      // If configurations table doesn't exist yet, we're at version 1
      return 1;
    }
  }

  private async setCurrentVersion(version: number): Promise<void> {
    try {
      const existingConfig = await db.configurations
        .where('key')
        .equals('schema_version')
        .and(config => config.table === 'system')
        .first();

      if (existingConfig) {
        await db.configurations.update(existingConfig.id, {
          value: version.toString(),
          updatedat: new Date().toISOString()
        });
      } else {
        await db.configurations.add({
          id: `schema_version_${Date.now()}`,
          key: 'schema_version',
          table: 'system',
          type: 'number',
          value: version.toString(),
          tenantid: null,
          isdeleted: false,
          createdat: new Date().toISOString(),
          createdby: 'system',
          updatedat: new Date().toISOString(),
          updatedby: 'system'
        });
      }
    } catch (error) {
      console.error('Failed to set schema version:', error);
      throw error;
    }
  }

  public async rollbackMigration(targetVersion: number): Promise<void> {
    try {
      const currentVersion = await this.getCurrentVersion();
      
      if (targetVersion >= currentVersion) {
        console.log('Target version is not lower than current version');
        return;
      }

      const migrationsToRollback = this.migrations
        .filter(m => m.version > targetVersion && m.version <= currentVersion)
        .sort((a, b) => b.version - a.version); // Rollback in reverse order

      for (const migration of migrationsToRollback) {
        if (migration.down) {
          console.log(`Rolling back migration ${migration.version}: ${migration.description}`);
          await migration.down();
        } else {
          console.warn(`Migration ${migration.version} has no rollback function`);
        }
      }

      await this.setCurrentVersion(targetVersion);
      console.log(`Rolled back to version ${targetVersion}`);
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }
}

// Initialize and run migrations when the module is imported
export const initializeMigrations = async (): Promise<void> => {
  const migrationManager = MigrationManager.getInstance();
  await migrationManager.runMigrations();
};