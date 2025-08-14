import { StorageMode } from '@/src/services/storage/types';

export interface ModeValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export function validateStorageMode(mode: StorageMode): ModeValidationResult {
  switch (mode) {
    case 'cloud':
      // For cloud mode, we might want to check network connectivity
      return {
        isValid: true,
        warnings: ['Requires internet connection for full functionality']
      };
    
    case 'demo':
      return {
        isValid: true,
        warnings: ['Data will not be saved permanently']
      };
    
    case 'local':
      // For local mode, we might want to check storage availability
      return {
        isValid: true,
        warnings: ['Data is stored only on this device']
      };
    
    default:
      return {
        isValid: false,
        error: `Invalid storage mode: ${mode}`
      };
  }
}

export function getModeDisplayInfo(mode: StorageMode) {
  switch (mode) {
    case 'cloud':
      return {
        name: 'Cloud Mode',
        icon: '☁️',
        color: '#3B82F6',
        description: 'Data synced to cloud'
      };
    
    case 'demo':
      return {
        name: 'Demo Mode',
        icon: '🎮',
        color: '#F59E0B',
        description: 'Sample data for testing'
      };
    
    case 'local':
      return {
        name: 'Local Mode',
        icon: '💾',
        color: '#10B981',
        description: 'Data stored locally'
      };
    
    default:
      return {
        name: 'Unknown Mode',
        icon: '❓',
        color: '#6B7280',
        description: 'Unknown storage mode'
      };
  }
}

export function canSwitchToMode(currentMode: StorageMode, targetMode: StorageMode): boolean {
  // Define rules for mode switching
  if (currentMode === targetMode) {
    return false; // Already in target mode
  }
  
  // All modes can switch to any other mode for now
  // In the future, we might add restrictions based on data state
  return true;
}

export function getModeSwitchWarning(currentMode: StorageMode, targetMode: StorageMode): string | null {
  if (currentMode === 'cloud' && targetMode !== 'cloud') {
    return 'Switching from cloud mode will disconnect from your synced data.';
  }
  
  if (currentMode === 'local' && targetMode !== 'local') {
    return 'Switching from local mode will leave your local data on this device.';
  }
  
  if (currentMode === 'demo' && targetMode !== 'demo') {
    return 'Switching from demo mode will lose all demo data.';
  }
  
  return null;
}