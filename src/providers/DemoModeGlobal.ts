// Enhanced global accessor for storage mode state
// This maintains backward compatibility while supporting three modes

import { StorageMode } from '../services/storage/types';
import { StorageModeManager } from '../services/storage/StorageModeManager';

let currentMode: StorageMode = 'cloud';
const storageManager = StorageModeManager.getInstance();

export function setDemoMode(value: boolean) {
  // Backward compatibility: true = demo, false = cloud
  const newMode: StorageMode = value ? 'demo' : 'cloud';
  setStorageMode(newMode);
}

export function getDemoMode(): boolean {
  // Backward compatibility: return true if mode is demo
  return currentMode === 'demo';
}

export function setStorageMode(mode: StorageMode) {
  currentMode = mode;
  // Update the storage manager asynchronously
  storageManager.setMode(mode).catch(error => {
    console.error('Failed to set storage mode:', error);
  });
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

// Initialize storage manager
storageManager.initialize().catch(error => {
  console.error('Failed to initialize storage manager:', error);
});
