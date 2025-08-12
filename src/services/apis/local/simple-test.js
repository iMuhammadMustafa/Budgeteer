// Simple JavaScript test to verify the Dexie schema works
// This can be run in a browser console to test the implementation

async function testDexieSchema() {
  console.log('Testing Dexie schema...');
  
  try {
    // Import Dexie (assuming it's available globally or via module)
    const { BudgeteerDatabase } = await import('./BudgeteerDatabase.ts');
    
    const db = new BudgeteerDatabase();
    
    // Test opening the database
    await db.open();
    console.log('✅ Database opened successfully');
    
    // Test creating a test account category
    const testCategory = {
      id: 'test-category-' + Date.now(),
      tenantid: 'test-tenant',
      name: 'Test Category',
      type: 'Asset',
      color: '#FF0000',
      icon: 'wallet',
      displayorder: 1,
      isdeleted: false
    };
    
    await db.accountcategories.add(testCategory);
    console.log('✅ Account category created successfully');
    
    // Test creating a test account
    const testAccount = {
      id: 'test-account-' + Date.now(),
      tenantid: 'test-tenant',
      categoryid: testCategory.id,
      name: 'Test Account',
      balance: 1000,
      color: '#00FF00',
      currency: 'USD',
      icon: 'bank',
      displayorder: 1,
      isdeleted: false
    };
    
    await db.accounts.add(testAccount);
    console.log('✅ Account created successfully');
    
    // Test querying
    const accounts = await db.accounts
      .where('tenantid')
      .equals('test-tenant')
      .and(account => !account.isdeleted)
      .toArray();
    
    console.log('✅ Query successful, found accounts:', accounts.length);
    
    // Test compound index query
    const accountsByTenantAndDeleted = await db.accounts
      .where('[tenantid+isdeleted]')
      .equals(['test-tenant', false])
      .toArray();
    
    console.log('✅ Compound index query successful, found accounts:', accountsByTenantAndDeleted.length);
    
    // Cleanup
    await db.accounts.delete(testAccount.id);
    await db.accountcategories.delete(testCategory.id);
    console.log('✅ Cleanup completed');
    
    await db.close();
    console.log('✅ Database closed successfully');
    
    console.log('🎉 All tests passed! The Dexie schema is working correctly.');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDexieSchema };
} else if (typeof window !== 'undefined') {
  window.testDexieSchema = testDexieSchema;
}

console.log('Test function loaded. Run testDexieSchema() to test the implementation.');