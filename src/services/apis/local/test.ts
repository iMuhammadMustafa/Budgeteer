// Simple test to verify local storage implementation
import { localStorageProvider } from './LocalStorageProvider';
import { ProviderFactory } from '../../storage/ProviderFactory';

export async function testLocalStorage() {
  try {
    console.log('Testing local storage implementation...');

    // Initialize local storage
    await localStorageProvider.initialize();

    // Get provider factory
    const factory = ProviderFactory.getInstance();

    // Test account provider
    const accountProvider = factory.createProvider('accounts', 'local');
    console.log('Account provider created successfully');

    // Test account category provider
    const categoryProvider = factory.createProvider('accountCategories', 'local');
    console.log('Account category provider created successfully');

    // Test transaction provider
    const transactionProvider = factory.createProvider('transactions', 'local');
    console.log('Transaction provider created successfully');

    // Get database info
    const dbInfo = await localStorageProvider.getDatabaseInfo();
    console.log('Database info:', dbInfo);

    console.log('Local storage test completed successfully!');
    return true;
  } catch (error) {
    console.error('Local storage test failed:', error);
    return false;
  } finally {
    // Cleanup
    try {
      await localStorageProvider.cleanup();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  testLocalStorage().then(success => {
    console.log('Test result:', success ? 'PASSED' : 'FAILED');
  });
}