// Demonstration script for storage mode switching functionality

import { StorageModeManager } from '../StorageModeManager';
import { StorageModeValidator } from '../StorageModeValidator';
import { setStorageMode, getStorageMode, getStorageInfo } from '../../../providers/DemoModeGlobal';
import { StorageMode } from '../types';

export class StorageModeSwitchingDemo {
  
  public static async runDemo(): Promise<void> {
    console.log('=== Storage Mode Switching Demo ===\n');
    
    try {
      // 1. Show initial state
      await this.showCurrentState();
      
      // 2. Validate all storage modes
      await this.validateAllModes();
      
      // 3. Demonstrate mode switching
      await this.demonstrateModeSwitch();
      
      // 4. Show error handling
      await this.demonstrateErrorHandling();
      
      // 5. Show storage information
      await this.showStorageInformation();
      
      console.log('\n=== Demo Complete ===');
      
    } catch (error) {
      console.error('Demo failed:', error);
    }
  }
  
  private static async showCurrentState(): Promise<void> {
    console.log('1. Current Storage State:');
    console.log(`   Current Mode: ${getStorageMode()}`);
    
    const storageManager = StorageModeManager.getInstance();
    console.log(`   Manager Mode: ${storageManager.getMode()}`);
    console.log('');
  }
  
  private static async validateAllModes(): Promise<void> {
    console.log('2. Storage Mode Validation:');
    
    const validationResults = await StorageModeValidator.validateAllModes();
    
    for (const [mode, result] of Object.entries(validationResults)) {
      console.log(`   ${mode.toUpperCase()}:`);
      console.log(`     Supported: ${result.isSupported}`);
      console.log(`     Available: ${result.isAvailable}`);
      if (result.errors.length > 0) {
        console.log(`     Errors: ${result.errors.join(', ')}`);
      }
      if (result.warnings.length > 0) {
        console.log(`     Warnings: ${result.warnings.join(', ')}`);
      }
    }
    
    const recommended = await StorageModeValidator.getRecommendedMode();
    console.log(`   Recommended Mode: ${recommended.toUpperCase()}`);
    console.log('');
  }
  
  private static async demonstrateModeSwitch(): Promise<void> {
    console.log('3. Mode Switching Demonstration:');
    
    const modes: StorageMode[] = ['demo', 'local', 'cloud'];
    
    for (const mode of modes) {
      try {
        console.log(`   Switching to ${mode} mode...`);
        const startTime = Date.now();
        
        await setStorageMode(mode);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`   ✓ Successfully switched to ${mode} mode (${duration}ms)`);
        console.log(`   Current mode: ${getStorageMode()}`);
        
        // Small delay between switches
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ✗ Failed to switch to ${mode} mode: ${error}`);
      }
    }
    console.log('');
  }
  
  private static async demonstrateErrorHandling(): Promise<void> {
    console.log('4. Error Handling Demonstration:');
    
    try {
      console.log('   Attempting to switch to invalid mode...');
      await setStorageMode('invalid' as StorageMode);
    } catch (error: any) {
      console.log(`   ✓ Error properly caught: ${error.message}`);
      console.log(`   Error code: ${error.code || 'N/A'}`);
    }
    
    // Test concurrent switches
    try {
      console.log('   Testing concurrent mode switches...');
      const promises = [
        setStorageMode('demo'),
        setStorageMode('local'),
        setStorageMode('cloud')
      ];
      
      await Promise.all(promises);
      console.log(`   ✓ Concurrent switches handled, final mode: ${getStorageMode()}`);
    } catch (error) {
      console.log(`   ✗ Concurrent switch error: ${error}`);
    }
    console.log('');
  }
  
  private static async showStorageInformation(): Promise<void> {
    console.log('5. Storage Information:');
    
    try {
      const storageInfo = await getStorageInfo();
      console.log('   Storage Info:');
      console.log(`     Current Mode: ${storageInfo.currentMode}`);
      console.log(`     Is Initializing: ${storageInfo.isInitializing}`);
      
      if (storageInfo.storage) {
        console.log('     Storage Details:');
        if (storageInfo.storage.name) {
          console.log(`       Name: ${storageInfo.storage.name}`);
        }
        if (storageInfo.storage.version) {
          console.log(`       Version: ${storageInfo.storage.version}`);
        }
        if (storageInfo.storage.type) {
          console.log(`       Type: ${storageInfo.storage.type}`);
        }
      }
      
      if (storageInfo.error) {
        console.log(`     Error: ${storageInfo.error}`);
      }
      
    } catch (error) {
      console.log(`   ✗ Failed to get storage info: ${error}`);
    }
    console.log('');
  }
}

// Export function to run demo
export const runStorageModeSwitchingDemo = StorageModeSwitchingDemo.runDemo;