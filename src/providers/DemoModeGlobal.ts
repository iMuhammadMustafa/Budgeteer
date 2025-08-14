// Enhanced global accessor for storage mode state
// This maintains backward compatibility while supporting three modes

import { StorageMode } from '../services/storage/types';
import { StorageModeManager } from '../services/storage/StorageModeManager';

let currentMode: StorageMode = 'cloud';
const storageManager = StorageModeManager.getInstance();

export async function setDemoMode(value: boolean): Promise<void> {
  // Backward compatibility: true = demo, false = cloud
  const newMode: StorageMode = value ? 'demo' : 'cloud';
  await setStorageMode(newMode);
}

export function getDemoMode(): boolean {
  // Backward compatibility: return true if mode is demo
  return currentMode === 'demo';
}

export async function setStorageMode(mode: StorageMode): Promise<void> {
  const previousMode = currentMode;
  
  try {
    console.log(`Setting storage mode to: ${mode}`);
    
    // Update the storage manager
    await storageManager.setMode(mode);
    
    // Only update current mode after successful initialization
    currentMode = mode;
    
    console.log(`Successfully set storage mode to: ${mode}`);
  } catch (error) {
    console.error(`Failed to set storage mode to ${mode}:`, error);
    
    // Keep the previous mode on failure
    currentMode = previousMode;
    
    // Re-throw the error so the caller can handle it
    throw error;
  }
}

export function getStorageMode(): StorageMode {
  return currentMode;
}

export function isCloudMode(): boolean {
  return currentMode === 'cloud';
}

export function isLocalMode(): boolean {
  return currentMode === 'local';
}

// Utility functions for storage mode management
export async function initializeStorageMode(mode?: StorageMode): Promise<void> {
  const targetMode = mode || currentMode;
  
  try {
    console.log(`Initializing storage mode: ${targetMode}`);
    await storageManager.setMode(targetMode);
    currentMode = targetMode;
    console.log(`Storage mode initialized successfully: ${targetMode}`);
  } catch (error) {
    console.error(`Failed to initialize storage mode ${targetMode}:`, error);
    throw error;
  }
}

export async function getStorageInfo(): Promise<any> {
  try {
    return await storageManager.getStorageInfo();
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return {
      currentMode,
      error: (error as Error).message
    };
  }
}

export function isStorageInitializing(): boolean {
  return storageManager['isInitializing'] || false;
}

// Initialize storage manager with default mode
initializeStorageMode().catch(error => {
  console.error('Failed to initialize storage manager:', error);
});
