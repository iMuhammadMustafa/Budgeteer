/**
 * End-to-End Integration Tests
 *
 * This test suite covers complete user workflows from login to data operations
 * across all storage modes, validating data consistency and mode switching.
 *
 * Requirements: 1.5, 7.1, 7.3, 7.5
 */

import { StorageModeManager } from "@/src/services/storage/StorageModeManager";
import { DIContainer } from "@/src/services/storage/DIContainer";
import { StorageMode } from "@/src/types/storage/StorageTypes";
import { TableNames } from "@/src/types/db/TableNames";

// Mock environment variables for testing
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

describe("End-to-End Integration Tests", () => {
  let storageModeManager: StorageModeManager;
  let diContainer: DIContainer;

  beforeEach(async () => {
    // Initialize fresh instances for each test
    storageModeManager = StorageModeManager.getInstance();
    diContainer = DIContainer.getInstance();

    // Clear any existing data
    await storageModeManager.cleanup();
  });

  afterEach(async () => {
    // Cleanup after each test
    await storageModeManager.cleanup();
  });

  describe("Complete User Workflows", () => {
    const testModes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

    testModes.forEach(mode => {
      describe(`${mode.toUpperCase()} Mode Workflow`, () => {
        beforeEach(async () => {
          await storageModeManager.setMode(mode);
        });

        it("should complete full account management workflow", async () => {
          // Step 1: Create account category
          const accountCategoryProvider = diContainer.getProvider("accountCategories");
          const categoryData = {
            id: "test-category-1",
            tenantid: "test-tenant",
            name: "Test Category",
            type: "asset" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          const createdCategory = await accountCategoryProvider.createAccountCategory(categoryData);
          expect(createdCategory).toBeDefined();

          // Step 2: Create account
          const accountProvider = diContainer.getProvider("accounts");
          const accountData = {
            id: "test-account-1",
            tenantid: "test-tenant",
            name: "Test Account",
            balance: 1000,
            categoryid: "test-category-1",
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          const createdAccount = await accountProvider.createAccount(accountData);
          expect(createdAccount).toBeDefined();

          // Step 3: Verify account retrieval
          const retrievedAccounts = await accountProvider.getAllAccounts("test-tenant");
          expect(retrievedAccounts).toHaveLength(1);
          expect(retrievedAccounts[0].name).toBe("Test Account");

          // Step 4: Update account
          const updatedAccount = await accountProvider.updateAccount({
            id: "test-account-1",
            name: "Updated Test Account",
            balance: 1500,
          });
          expect(updatedAccount).toBeDefined();

          // Step 5: Verify update
          const updatedAccounts = await accountProvider.getAllAccounts("test-tenant");
          expect(updatedAccounts[0].name).toBe("Updated Test Account");
          expect(updatedAccounts[0].balance).toBe(1500);

          // Step 6: Delete account (soft delete)
          await accountProvider.deleteAccount("test-account-1");

          // Step 7: Verify soft delete
          const accountsAfterDelete = await accountProvider.getAllAccounts("test-tenant");
          expect(accountsAfterDelete).toHaveLength(0); // Should not return deleted accounts

          // Step 8: Restore account
          await accountProvider.restoreAccount("test-account-1");

          // Step 9: Verify restore
          const restoredAccounts = await accountProvider.getAllAccounts("test-tenant");
          expect(restoredAccounts).toHaveLength(1);
          expect(restoredAccounts[0].name).toBe("Updated Test Account");
        });

        it("should complete full transaction workflow", async () => {
          // Setup: Create required dependencies
          const accountCategoryProvider = diContainer.getProvider("accountCategories");
          const accountProvider = diContainer.getProvider("accounts");
          const transactionCategoryProvider = diContainer.getProvider("transactionCategories");
          const transactionProvider = diContainer.getProvider("transactions");

          // Create account category
          await accountCategoryProvider.createAccountCategory({
            id: "test-acc-cat-1",
            tenantid: "test-tenant",
            name: "Test Account Category",
            type: "asset" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          // Create account
          await accountProvider.createAccount({
            id: "test-account-1",
            tenantid: "test-tenant",
            name: "Test Account",
            balance: 1000,
            categoryid: "test-acc-cat-1",
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          // Create transaction category
          await transactionCategoryProvider.createTransactionCategory({
            id: "test-trans-cat-1",
            tenantid: "test-tenant",
            name: "Test Transaction Category",
            type: "expense" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          // Step 1: Create transaction
          const transactionData = {
            id: "test-transaction-1",
            tenantid: "test-tenant",
            accountid: "test-account-1",
            categoryid: "test-trans-cat-1",
            amount: -100,
            description: "Test Transaction",
            date: new Date().toISOString(),
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          const createdTransaction = await transactionProvider.createTransaction(transactionData);
          expect(createdTransaction).toBeDefined();

          // Step 2: Verify transaction retrieval
          const retrievedTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(retrievedTransactions).toHaveLength(1);
          expect(retrievedTransactions[0].description).toBe("Test Transaction");

          // Step 3: Update transaction
          const updatedTransaction = await transactionProvider.updateTransaction({
            id: "test-transaction-1",
            description: "Updated Test Transaction",
            amount: -150,
          });
          expect(updatedTransaction).toBeDefined();

          // Step 4: Verify update
          const updatedTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(updatedTransactions[0].description).toBe("Updated Test Transaction");
          expect(updatedTransactions[0].amount).toBe(-150);

          // Step 5: Delete and restore transaction
          await transactionProvider.deleteTransaction("test-transaction-1", "test-tenant");
          const deletedTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(deletedTransactions).toHaveLength(0);

          await transactionProvider.restoreTransaction("test-transaction-1", "test-tenant");
          const restoredTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(restoredTransactions).toHaveLength(1);
        });

        it("should handle referential integrity correctly", async () => {
          const accountProvider = diContainer.getProvider("accounts");
          const accountCategoryProvider = diContainer.getProvider("accountCategories");

          // Try to create account with non-existent category
          const accountData = {
            id: "test-account-1",
            tenantid: "test-tenant",
            name: "Test Account",
            balance: 1000,
            categoryid: "non-existent-category",
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          // Should throw referential integrity error
          await expect(accountProvider.createAccount(accountData)).rejects.toThrow();

          // Create valid category first
          await accountCategoryProvider.createAccountCategory({
            id: "valid-category",
            tenantid: "test-tenant",
            name: "Valid Category",
            type: "asset" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          // Now account creation should succeed
          const validAccountData = {
            ...accountData,
            categoryid: "valid-category",
          };

          const createdAccount = await accountProvider.createAccount(validAccountData);
          expect(createdAccount).toBeDefined();
        });
      });
    });
  });

  describe("Storage Mode Switching", () => {
    it("should switch between storage modes without errors", async () => {
      // Test switching from demo to local
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe("demo");

      await storageModeManager.setMode(StorageMode.Local);
      expect(storageModeManager.getMode()).toBe("local");

      // Test switching back to demo
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe("demo");
    });

    it("should maintain data isolation between modes", async () => {
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create data in demo mode
      await storageModeManager.setMode(StorageMode.Demo);

      await accountCategoryProvider.createAccountCategory({
        id: "demo-category",
        tenantid: "test-tenant",
        name: "Demo Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "demo-account",
        tenantid: "test-tenant",
        name: "Demo Account",
        balance: 1000,
        categoryid: "demo-category",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      const demoAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(demoAccounts).toHaveLength(1);

      // Switch to local mode
      await storageModeManager.setMode(StorageMode.Local);

      // Local mode should have no data
      const localAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(localAccounts).toHaveLength(0);

      // Create different data in local mode
      await accountCategoryProvider.createAccountCategory({
        id: "local-category",
        tenantid: "test-tenant",
        name: "Local Category",
        type: "liability" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "local-account",
        tenantid: "test-tenant",
        name: "Local Account",
        balance: 2000,
        categoryid: "local-category",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      const localAccountsAfterCreate = await accountProvider.getAllAccounts("test-tenant");
      expect(localAccountsAfterCreate).toHaveLength(1);
      expect(localAccountsAfterCreate[0].name).toBe("Local Account");

      // Switch back to demo mode
      await storageModeManager.setMode(StorageMode.Demo);

      // Demo data should still be there
      const demoAccountsAfterSwitch = await accountProvider.getAllAccounts("test-tenant");
      expect(demoAccountsAfterSwitch).toHaveLength(1);
      expect(demoAccountsAfterSwitch[0].name).toBe("Demo Account");
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should handle storage initialization failures gracefully", async () => {
      // Test with invalid mode
      await expect(storageModeManager.setMode("invalid" as StorageMode)).rejects.toThrow();

      // Should still be able to set valid mode after failure
      await storageModeManager.setMode(StorageMode.Demo);
      expect(storageModeManager.getMode()).toBe("demo");
    });

    it("should handle provider errors consistently", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");

      // Test duplicate ID error
      const accountData = {
        id: "duplicate-account",
        tenantid: "test-tenant",
        name: "Test Account",
        balance: 1000,
        categoryid: "test-category",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      // Create account category first
      const accountCategoryProvider = diContainer.getProvider("accountCategories");
      await accountCategoryProvider.createAccountCategory({
        id: "test-category",
        tenantid: "test-tenant",
        name: "Test Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // First creation should succeed
      await accountProvider.createAccount(accountData);

      // Second creation with same ID should fail
      await expect(accountProvider.createAccount(accountData)).rejects.toThrow();
    });
  });

  describe("Performance and Memory", () => {
    it("should handle large datasets efficiently", async () => {
      await storageModeManager.setMode("demo");
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create category first
      await accountCategoryProvider.createAccountCategory({
        id: "perf-category",
        tenantid: "test-tenant",
        name: "Performance Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      const startTime = Date.now();
      const accountPromises = [];

      // Create 100 accounts
      for (let i = 0; i < 100; i++) {
        accountPromises.push(
          accountProvider.createAccount({
            id: `perf-account-${i}`,
            tenantid: "test-tenant",
            name: `Performance Account ${i}`,
            balance: i * 100,
            categoryid: "perf-category",
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          }),
        );
      }

      await Promise.all(accountPromises);
      const createTime = Date.now() - startTime;

      // Retrieve all accounts
      const retrieveStartTime = Date.now();
      const allAccounts = await accountProvider.getAllAccounts("test-tenant");
      const retrieveTime = Date.now() - retrieveStartTime;

      expect(allAccounts).toHaveLength(100);
      expect(createTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(retrieveTime).toBeLessThan(1000); // Should retrieve within 1 second

      console.log(`Performance test - Create: ${createTime}ms, Retrieve: ${retrieveTime}ms`);
    });
  });
});
