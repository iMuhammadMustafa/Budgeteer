// Storage mode manager for handling mode selection and provider instantiation

import { StorageMode, EntityType, ProviderRegistry, IStorageProvider, StorageError } from "./types";
import { DIContainer } from "./DIContainer";
import { Platform } from "react-native";

export class StorageModeManager implements IStorageProvider {
  private static instance: StorageModeManager;
  private container: DIContainer;
  public mode: StorageMode;
  private onModeChange?: () => void;
  private isInitializing = false;
  private initializationPromise?: Promise<void>;

  private constructor() {
    this.container = DIContainer.getInstance();
    this.mode = "cloud"; // Default mode
  }

  public static getInstance(): StorageModeManager {
    if (!StorageModeManager.instance) {
      StorageModeManager.instance = new StorageModeManager();
    }
    return StorageModeManager.instance;
  }

  public async setMode(mode: StorageMode): Promise<void> {
    // Prevent concurrent mode switches
    if (this.isInitializing) {
      console.log("Mode switch already in progress, waiting...");
      await this.initializationPromise;
      return;
    }

    if (this.mode === mode) {
      console.log(`Already in ${mode} mode`);
      return;
    }

    this.isInitializing = true;
    this.initializationPromise = this.performModeSwitch(mode);

    try {
      await this.initializationPromise;
    } finally {
      this.isInitializing = false;
      this.initializationPromise = undefined;
    }
  }

  private async performModeSwitch(mode: StorageMode): Promise<void> {
    const previousMode = this.mode;

    try {
      console.log(`Switching storage mode from ${previousMode} to ${mode}`);

      // Validate mode compatibility
      await this.validateModeCompatibility(mode);

      // Cleanup current mode
      console.log(`Cleaning up ${previousMode} mode...`);
      await this.cleanup();

      // Set new mode
      this.mode = mode;
      this.container.setMode(mode);

      // Clear repository instances to force recreation with new providers
      if (this.onModeChange) {
        this.onModeChange();
      }

      // Initialize new mode
      console.log(`Initializing ${mode} mode...`);
      await this.initialize();

      console.log(`Successfully switched to ${mode} mode`);
    } catch (error) {
      console.error(`Failed to switch to ${mode} mode:`, error);

      // Attempt to rollback to previous mode
      try {
        console.log(`Rolling back to ${previousMode} mode...`);
        this.mode = previousMode;
        this.container.setMode(previousMode);
        await this.initialize();
        console.log(`Successfully rolled back to ${previousMode} mode`);
      } catch (rollbackError) {
        console.error(`Failed to rollback to ${previousMode} mode:`, rollbackError);
        throw new StorageError(
          `Mode switch failed and rollback failed. Application may be in an inconsistent state.`,
          "MODE_SWITCH_ROLLBACK_FAILED",
          { originalError: error, rollbackError },
        );
      }

      throw new StorageError(`Failed to switch to ${mode} mode: ${error}`, "MODE_SWITCH_FAILED", {
        mode,
        previousMode,
        error,
      });
    }
  }

  private async validateModeCompatibility(mode: StorageMode): Promise<void> {
    switch (mode) {
      case "local":
        // Check if local storage is supported on current platform
        if (Platform.OS === "web") {
          // Web should use IndexedDB
          if (!window.indexedDB) {
            throw new StorageError("IndexedDB is not supported in this browser", "INDEXEDDB_NOT_SUPPORTED");
          }
        } else {
          // Native should use SQLite
          try {
            // Try to require expo-sqlite to check if it's available
            require("expo-sqlite");
          } catch (error) {
            throw new StorageError("SQLite is not available on this platform", "SQLITE_NOT_AVAILABLE", { error });
          }
        }
        break;

      case "cloud":
        // Check if network is available for cloud mode
        // This is a basic check - in production you might want more sophisticated network detection
        if (typeof navigator !== "undefined" && navigator.onLine === false) {
          console.warn("Network appears to be offline, but proceeding with cloud mode initialization");
        }
        break;

      case "demo":
        // Demo mode should always be available
        break;

      default:
        throw new StorageError(`Unknown storage mode: ${mode}`, "UNKNOWN_STORAGE_MODE", { mode });
    }
  }

  public getMode(): StorageMode {
    return this.mode;
  }

  public getProvider<T extends EntityType>(entityType: T): ProviderRegistry[T] {
    return this.container.getProvider(entityType);
  }

  public async initialize(): Promise<void> {
    try {
      await this.container.initializeProviders();
      console.log(`Storage mode manager initialized with mode: ${this.mode}`);
    } catch (error) {
      console.error(`Failed to initialize storage mode ${this.mode}:`, error);
      throw new StorageError(
        `Storage initialization failed for mode ${this.mode}: ${error}`,
        "STORAGE_INITIALIZATION_FAILED",
        { mode: this.mode, error },
      );
    }
  }

  public async cleanup(): Promise<void> {
    try {
      await this.container.cleanupProviders();
      console.log(`Storage mode manager cleaned up for mode: ${this.mode}`);
    } catch (error) {
      console.error(`Failed to cleanup storage mode ${this.mode}:`, error);
      // Don't throw on cleanup errors to avoid blocking mode switches
      console.warn("Continuing despite cleanup error");
    }
  }

  public async migrateData(fromMode: StorageMode, toMode: StorageMode): Promise<void> {
    if (fromMode === toMode) {
      console.log("No migration needed - same storage mode");
      return;
    }

    console.log(`Migrating data from ${fromMode} to ${toMode}`);

    try {
      // For now, we implement data isolation rather than migration
      // Each mode maintains its own data store
      switch (toMode) {
        case "demo":
          console.log("Switching to demo mode - using sample data");
          break;
        case "local":
          console.log("Switching to local mode - using local storage");
          break;
        case "cloud":
          console.log("Switching to cloud mode - using Supabase");
          break;
      }

      // Future enhancement: implement actual data migration between modes
      // This would involve:
      // 1. Exporting data from source mode
      // 2. Transforming data format if needed
      // 3. Importing data to target mode
      // 4. Validating data integrity
    } catch (error) {
      console.error(`Data migration failed from ${fromMode} to ${toMode}:`, error);
      throw new StorageError(`Data migration failed: ${error}`, "DATA_MIGRATION_FAILED", { fromMode, toMode, error });
    }
  }

  public async getStorageInfo(): Promise<any> {
    try {
      const info = await this.container.getStorageInfo();
      return {
        currentMode: this.mode,
        isInitializing: this.isInitializing,
        ...info,
      };
    } catch (error) {
      console.error("Failed to get storage info:", error);
      return {
        currentMode: this.mode,
        isInitializing: this.isInitializing,
        error: (error as Error).message,
      };
    }
  }

  // Convenience methods for getting specific providers
  public getAccountProvider() {
    return this.getProvider("accounts");
  }

  public getAccountCategoryProvider() {
    return this.getProvider("accountCategories");
  }

  public getTransactionProvider() {
    return this.getProvider("transactions");
  }

  public getTransactionCategoryProvider() {
    return this.getProvider("transactionCategories");
  }

  public getTransactionGroupProvider() {
    return this.getProvider("transactionGroups");
  }

  public getConfigurationProvider() {
    return this.getProvider("configurations");
  }

  public getRecurringProvider() {
    return this.getProvider("recurrings");
  }

  public getStatsProvider() {
    return this.getProvider("stats");
  }

  public setModeChangeCallback(callback: () => void) {
    this.onModeChange = callback;
  }
}
