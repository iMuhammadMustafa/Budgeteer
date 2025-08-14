// Storage mode validation and diagnostics utility

import { StorageMode, StorageError } from './types';
import { Platform } from 'react-native';

export interface StorageModeValidationResult {
  mode: StorageMode;
  isSupported: boolean;
  isAvailable: boolean;
  errors: string[];
  warnings: string[];
  requirements: string[];
}

export class StorageModeValidator {
  
  public static async validateMode(mode: StorageMode): Promise<StorageModeValidationResult> {
    const result: StorageModeValidationResult = {
      mode,
      isSupported: false,
      isAvailable: false,
      errors: [],
      warnings: [],
      requirements: []
    };

    switch (mode) {
      case 'cloud':
        return this.validateCloudMode(result);
      case 'demo':
        return this.validateDemoMode(result);
      case 'local':
        return await this.validateLocalMode(result);
      default:
        result.errors.push(`Unknown storage mode: ${mode}`);
        return result;
    }
  }

  private static validateCloudMode(result: StorageModeValidationResult): StorageModeValidationResult {
    result.isSupported = true;
    result.requirements.push('Network connection for Supabase');
    
    // Check network availability
    if (typeof navigator !== 'undefined') {
      if (navigator.onLine === false) {
        result.warnings.push('Network appears to be offline');
        result.isAvailable = false;
      } else {
        result.isAvailable = true;
      }
    } else {
      // Assume available if we can't check
      result.isAvailable = true;
      result.warnings.push('Cannot verify network status');
    }

    return result;
  }

  private static validateDemoMode(result: StorageModeValidationResult): StorageModeValidationResult {
    result.isSupported = true;
    result.isAvailable = true;
    result.requirements.push('In-memory storage (always available)');
    
    return result;
  }

  private static async validateLocalMode(result: StorageModeValidationResult): Promise<StorageModeValidationResult> {
    result.requirements.push('Local storage capability');
    
    if (Platform.OS === 'web') {
      return this.validateIndexedDB(result);
    } else {
      return await this.validateSQLite(result);
    }
  }

  private static validateIndexedDB(result: StorageModeValidationResult): StorageModeValidationResult {
    result.requirements.push('IndexedDB support in browser');
    
    if (typeof window === 'undefined') {
      result.errors.push('Window object not available (not running in browser)');
      return result;
    }

    if (!window.indexedDB) {
      result.errors.push('IndexedDB is not supported in this browser');
      return result;
    }

    // Check if IndexedDB is actually functional
    try {
      const testRequest = window.indexedDB.open('test-db', 1);
      testRequest.onerror = () => {
        result.warnings.push('IndexedDB may not be functional');
      };
      testRequest.onsuccess = () => {
        // Clean up test database
        const db = testRequest.result;
        db.close();
        window.indexedDB.deleteDatabase('test-db');
      };
    } catch (error) {
      result.warnings.push(`IndexedDB test failed: ${error}`);
    }

    result.isSupported = true;
    result.isAvailable = true;
    
    return result;
  }

  private static async validateSQLite(result: StorageModeValidationResult): Promise<StorageModeValidationResult> {
    result.requirements.push('expo-sqlite package for React Native');
    
    try {
      // Try to require expo-sqlite
      require('expo-sqlite');
      result.isSupported = true;
      result.isAvailable = true;
    } catch (error) {
      result.errors.push('expo-sqlite is not available on this platform');
      result.isSupported = false;
      result.isAvailable = false;
    }

    return result;
  }

  public static async validateAllModes(): Promise<Record<StorageMode, StorageModeValidationResult>> {
    const modes: StorageMode[] = ['cloud', 'demo', 'local'];
    const results: Record<StorageMode, StorageModeValidationResult> = {} as any;

    for (const mode of modes) {
      results[mode] = await this.validateMode(mode);
    }

    return results;
  }

  public static async getRecommendedMode(): Promise<StorageMode> {
    const validationResults = await this.validateAllModes();
    
    // Prefer local mode if available, then demo, then cloud
    if (validationResults.local.isAvailable) {
      return 'local';
    }
    
    if (validationResults.demo.isAvailable) {
      return 'demo';
    }
    
    if (validationResults.cloud.isAvailable) {
      return 'cloud';
    }

    // Fallback to demo mode as it should always work
    return 'demo';
  }

  public static formatValidationReport(result: StorageModeValidationResult): string {
    const lines: string[] = [];
    
    lines.push(`Storage Mode: ${result.mode.toUpperCase()}`);
    lines.push(`Supported: ${result.isSupported ? 'Yes' : 'No'}`);
    lines.push(`Available: ${result.isAvailable ? 'Yes' : 'No'}`);
    
    if (result.requirements.length > 0) {
      lines.push('\nRequirements:');
      result.requirements.forEach(req => lines.push(`  - ${req}`));
    }
    
    if (result.warnings.length > 0) {
      lines.push('\nWarnings:');
      result.warnings.forEach(warning => lines.push(`  - ${warning}`));
    }
    
    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      result.errors.forEach(error => lines.push(`  - ${error}`));
    }
    
    return lines.join('\n');
  }
}