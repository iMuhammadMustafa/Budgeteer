import { Platform } from 'react-native';
import { 
  isSQLiteAvailable, 
  getNativeStorageProvider, 
  getNativeProviders,
  sqliteDb,
  initializeSQLiteMigrations 
} from './sqlite';

export async function testSQLiteImplementation(): Promise<void> {
  console.log('=== SQLite Implementation Test ===');
  console.log('Platform:', Platform.OS);
  console.log('SQLite Available:', isSQLiteAvailable());

  if (!isSQLiteAvailable()) {
    console.log('SQLite not available on this platform, skipping test');
    return;
  }

  try {
    // Test storage provider initialization
    console.log('\n1. Testing Storage Provider...');
    const storageProvider = getNativeStorageProvider();
    await storageProvider.initialize();
    console.log('✓ Storage provider initialized successfully');

    // Test database info
    console.log('\n2. Testing Database Info...');
    const dbInfo = await storageProvider.getDatabaseInfo();
    console.log('Database Info:', dbInfo);

    // Test providers
    console.log('\n3. Testing Providers...');
    const providers = getNativeProviders();
    console.log('Available providers:', Object.keys(providers));

    // Test basic CRUD operations
    console.log('\n4. Testing Basic CRUD Operations...');
    
    // Test account category creation
    const testCategory = {
      id: `test_category_${Date.now()}`,
      tenantid: 'test_tenant',
      name: 'Test Category',
      type: 'asset' as any,
      color: '#FF0000',
      icon: 'wallet'
    };

    const createdCategory = await providers.accountCategories.createAccountCategory(testCategory);
    console.log('✓ Account category created:', createdCategory.id);

    // Test account creation
    const testAccount = {
      id: `test_account_${Date.now()}`,
      tenantid: 'test_tenant',
      categoryid: createdCategory.id,
      name: 'Test Account',
      balance: 1000,
      currency: 'USD'
    };

    const createdAccount = await providers.accounts.createAccount(testAccount);
    console.log('✓ Account created:', createdAccount.id);

    // Test transaction group creation
    const testGroup = {
      id: `test_group_${Date.now()}`,
      tenantid: 'test_tenant',
      name: 'Test Group',
      type: 'expense' as any
    };

    const createdGroup = await providers.transactionGroups.createTransactionGroup(testGroup);
    console.log('✓ Transaction group created:', createdGroup.id);

    // Test transaction category creation
    const testTransactionCategory = {
      id: `test_tx_category_${Date.now()}`,
      tenantid: 'test_tenant',
      groupid: createdGroup.id,
      name: 'Test Transaction Category',
      type: 'expense' as any
    };

    const createdTransactionCategory = await providers.transactionCategories.createTransactionCategory(testTransactionCategory);
    console.log('✓ Transaction category created:', createdTransactionCategory.id);

    // Test transaction creation
    const testTransaction = {
      id: `test_transaction_${Date.now()}`,
      tenantid: 'test_tenant',
      accountid: createdAccount.id,
      categoryid: createdTransactionCategory.id,
      date: new Date().toISOString().split('T')[0],
      amount: 50,
      type: 'expense' as any,
      name: 'Test Transaction'
    };

    const createdTransaction = await providers.transactions.createTransaction(testTransaction);
    console.log('✓ Transaction created:', createdTransaction.id);

    // Test retrieval operations
    console.log('\n5. Testing Retrieval Operations...');
    
    const accounts = await providers.accounts.getAllAccounts('test_tenant');
    console.log('✓ Retrieved accounts:', accounts.length);

    const transactions = await providers.transactions.getAllTransactions('test_tenant');
    console.log('✓ Retrieved transactions:', transactions.length);

    // Test stats
    console.log('\n6. Testing Stats...');
    const stats = await providers.stats.getStats('test_tenant');
    console.log('✓ Stats retrieved:', stats);

    // Cleanup test data
    console.log('\n7. Cleaning up test data...');
    await providers.transactions.deleteTransaction(createdTransaction.id);
    await providers.transactionCategories.deleteTransactionCategory(createdTransactionCategory.id);
    await providers.transactionGroups.deleteTransactionGroup(createdGroup.id);
    await providers.accounts.deleteAccount(createdAccount.id);
    await providers.accountCategories.deleteAccountCategory(createdCategory.id);
    console.log('✓ Test data cleaned up');

    // Test cleanup
    await storageProvider.cleanup();
    console.log('✓ Storage provider cleaned up');

    console.log('\n=== SQLite Implementation Test PASSED ===');
  } catch (error) {
    console.error('\n=== SQLite Implementation Test FAILED ===');
    console.error('Error:', error);
    throw error;
  }
}

// Export for manual testing
export { testSQLiteImplementation as default };