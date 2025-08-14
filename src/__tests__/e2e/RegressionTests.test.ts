/**
 * Comprehensive Regression Tests
 *
 * This test suite performs comprehensive regression testing to ensure
 * that all existing functionality continues to work correctly after changes.
 *
 * Requirements: 7.1, 7.3, 7.5
 */

import { StorageModeManager } from "@/src/services/storage/StorageModeManager";
import { DIContainer } from "@/src/services/storage/DIContainer";
import { StorageMode } from "@/src/types/storage/StorageTypes";

// Mock environment
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

describe("Comprehensive Regression Tests", () => {
  let storageModeManager: StorageModeManager;
  let diContainer: DIContainer;

  beforeEach(async () => {
    storageModeManager = StorageModeManager.getInstance();
    diContainer = DIContainer.getInstance();
    await storageModeManager.cleanup();
  });

  afterEach(async () => {
    await storageModeManager.cleanup();
  });

  describe("Core CRUD Operations Regression", () => {
    const testModes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

    testModes.forEach(mode => {
      describe(`${mode.toUpperCase()} Mode CRUD Operations`, () => {
        beforeEach(async () => {
          await storageModeManager.setMode(mode);
        });

        it("should perform complete account lifecycle operations", async () => {
          const accountProvider = diContainer.getProvider("accounts");
          const accountCategoryProvider = diContainer.getProvider("accountCategories");

          // Create account category
          const categoryData = {
            id: `regression-cat-${mode}`,
            tenantid: "test-tenant",
            name: "Regression Test Category",
            type: "asset" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          const createdCategory = await accountCategoryProvider.createAccountCategory(categoryData);
          expect(createdCategory).toBeDefined();

          // Create account
          const accountData = {
            id: `regression-acc-${mode}`,
            tenantid: "test-tenant",
            name: "Regression Test Account",
            balance: 1000,
            categoryid: `regression-cat-${mode}`,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          const createdAccount = await accountProvider.createAccount(accountData);
          expect(createdAccount).toBeDefined();

          // Read account
          const accounts = await accountProvider.getAllAccounts("test-tenant");
          expect(accounts).toHaveLength(1);
          expect(accounts[0].name).toBe("Regression Test Account");
          expect(accounts[0].balance).toBe(1000);

          // Update account
          const updatedAccount = await accountProvider.updateAccount({
            id: `regression-acc-${mode}`,
            name: "Updated Regression Account",
            balance: 1500,
          });
          expect(updatedAccount).toBeDefined();

          // Verify update
          const updatedAccounts = await accountProvider.getAllAccounts("test-tenant");
          expect(updatedAccounts[0].name).toBe("Updated Regression Account");
          expect(updatedAccounts[0].balance).toBe(1500);

          // Soft delete account
          await accountProvider.deleteAccount(`regression-acc-${mode}`);

          // Verify soft delete
          const deletedAccounts = await accountProvider.getAllAccounts("test-tenant");
          expect(deletedAccounts).toHaveLength(0);

          // Restore account
          await accountProvider.restoreAccount(`regression-acc-${mode}`);

          // Verify restore
          const restoredAccounts = await accountProvider.getAllAccounts("test-tenant");
          expect(restoredAccounts).toHaveLength(1);
          expect(restoredAccounts[0].name).toBe("Updated Regression Account");
        });

        it("should perform complete transaction lifecycle operations", async () => {
          const accountProvider = diContainer.getProvider("accounts");
          const accountCategoryProvider = diContainer.getProvider("accountCategories");
          const transactionProvider = diContainer.getProvider("transactions");
          const transactionCategoryProvider = diContainer.getProvider("transactionCategories");

          // Setup dependencies
          await accountCategoryProvider.createAccountCategory({
            id: `trans-acc-cat-${mode}`,
            tenantid: "test-tenant",
            name: "Transaction Account Category",
            type: "asset" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          await accountProvider.createAccount({
            id: `trans-acc-${mode}`,
            tenantid: "test-tenant",
            name: "Transaction Account",
            balance: 1000,
            categoryid: `trans-acc-cat-${mode}`,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          await transactionCategoryProvider.createTransactionCategory({
            id: `trans-cat-${mode}`,
            tenantid: "test-tenant",
            name: "Transaction Category",
            type: "expense" as const,
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          });

          // Create transaction
          const transactionData = {
            id: `trans-${mode}`,
            tenantid: "test-tenant",
            accountid: `trans-acc-${mode}`,
            categoryid: `trans-cat-${mode}`,
            amount: -100,
            description: "Regression Test Transaction",
            date: new Date().toISOString(),
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          };

          const createdTransaction = await transactionProvider.createTransaction(transactionData);
          expect(createdTransaction).toBeDefined();

          // Read transaction
          const transactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(transactions).toHaveLength(1);
          expect(transactions[0].description).toBe("Regression Test Transaction");
          expect(transactions[0].amount).toBe(-100);

          // Update transaction
          const updatedTransaction = await transactionProvider.updateTransaction({
            id: `trans-${mode}`,
            description: "Updated Regression Transaction",
            amount: -150,
          });
          expect(updatedTransaction).toBeDefined();

          // Verify update
          const updatedTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(updatedTransactions[0].description).toBe("Updated Regression Transaction");
          expect(updatedTransactions[0].amount).toBe(-150);

          // Delete and restore transaction
          await transactionProvider.deleteTransaction(`trans-${mode}`, "test-tenant");
          const deletedTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(deletedTransactions).toHaveLength(0);

          await transactionProvider.restoreTransaction(`trans-${mode}`, "test-tenant");
          const restoredTransactions = await transactionProvider.getAllTransactions("test-tenant");
          expect(restoredTransactions).toHaveLength(1);
        });
      });
    });
  });

  describe("Business Logic Regression", () => {
    it("should maintain account balance calculations correctly", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create account category
      await accountCategoryProvider.createAccountCategory({
        id: "balance-cat",
        tenantid: "test-tenant",
        name: "Balance Test Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Create account with initial balance
      await accountProvider.createAccount({
        id: "balance-acc",
        tenantid: "test-tenant",
        name: "Balance Test Account",
        balance: 1000,
        categoryid: "balance-cat",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Test balance update
      await accountProvider.updateAccountBalance("balance-acc", 500);

      const accounts = await accountProvider.getAllAccounts("test-tenant");
      expect(accounts[0].balance).toBe(1500);

      // Test negative balance update
      await accountProvider.updateAccountBalance("balance-acc", -200);

      const updatedAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(updatedAccounts[0].balance).toBe(1300);
    });

    it("should handle tenant isolation correctly", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create data for tenant 1
      await accountCategoryProvider.createAccountCategory({
        id: "tenant1-cat",
        tenantid: "tenant-1",
        name: "Tenant 1 Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "tenant1-acc",
        tenantid: "tenant-1",
        name: "Tenant 1 Account",
        balance: 1000,
        categoryid: "tenant1-cat",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Create data for tenant 2
      await accountCategoryProvider.createAccountCategory({
        id: "tenant2-cat",
        tenantid: "tenant-2",
        name: "Tenant 2 Category",
        type: "liability" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "tenant2-acc",
        tenantid: "tenant-2",
        name: "Tenant 2 Account",
        balance: 2000,
        categoryid: "tenant2-cat",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Verify tenant isolation
      const tenant1Accounts = await accountProvider.getAllAccounts("tenant-1");
      const tenant2Accounts = await accountProvider.getAllAccounts("tenant-2");

      expect(tenant1Accounts).toHaveLength(1);
      expect(tenant1Accounts[0].name).toBe("Tenant 1 Account");
      expect(tenant1Accounts[0].balance).toBe(1000);

      expect(tenant2Accounts).toHaveLength(1);
      expect(tenant2Accounts[0].name).toBe("Tenant 2 Account");
      expect(tenant2Accounts[0].balance).toBe(2000);
    });
  });

  describe("Error Handling Regression", () => {
    it("should handle duplicate ID errors consistently", async () => {
      const testModes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

      for (const mode of testModes) {
        await storageModeManager.setMode(mode);

        const accountProvider = diContainer.getProvider("accounts");
        const accountCategoryProvider = diContainer.getProvider("accountCategories");

        // Create category
        await accountCategoryProvider.createAccountCategory({
          id: `dup-cat-${mode}`,
          tenantid: "test-tenant",
          name: "Duplicate Test Category",
          type: "asset" as const,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        // Create first account
        const accountData = {
          id: `dup-acc-${mode}`,
          tenantid: "test-tenant",
          name: "Duplicate Test Account",
          balance: 1000,
          categoryid: `dup-cat-${mode}`,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        };

        await accountProvider.createAccount(accountData);

        // Try to create duplicate account
        await expect(accountProvider.createAccount(accountData)).rejects.toThrow();
      }
    });

    it("should handle referential integrity violations consistently", async () => {
      const testModes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

      for (const mode of testModes) {
        await storageModeManager.setMode(mode);

        const accountProvider = diContainer.getProvider("accounts");

        // Try to create account with non-existent category
        const invalidAccountData = {
          id: `invalid-acc-${mode}`,
          tenantid: "test-tenant",
          name: "Invalid Account",
          balance: 1000,
          categoryid: "non-existent-category",
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        };

        await expect(accountProvider.createAccount(invalidAccountData)).rejects.toThrow();
      }
    });
  });

  describe("Performance Regression", () => {
    it("should maintain acceptable performance for large datasets", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create category
      await accountCategoryProvider.createAccountCategory({
        id: "perf-cat",
        tenantid: "test-tenant",
        name: "Performance Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Create many accounts
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          accountProvider.createAccount({
            id: `perf-acc-${i}`,
            tenantid: "test-tenant",
            name: `Performance Account ${i}`,
            balance: i * 10,
            categoryid: "perf-cat",
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          }),
        );
      }

      await Promise.all(promises);
      const creationTime = Date.now() - startTime;

      // Retrieve all accounts
      const retrievalStartTime = Date.now();
      const accounts = await accountProvider.getAllAccounts("test-tenant");
      const retrievalTime = Date.now() - retrievalStartTime;

      expect(accounts).toHaveLength(100);
      expect(creationTime).toBeLessThan(10000); // 10 seconds max
      expect(retrievalTime).toBeLessThan(2000); // 2 seconds max

      console.log(`Performance regression test - Create: ${creationTime}ms, Retrieve: ${retrievalTime}ms`);
    });

    it("should handle concurrent operations without data corruption", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create category
      await accountCategoryProvider.createAccountCategory({
        id: "concurrent-cat",
        tenantid: "test-tenant",
        name: "Concurrent Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Create accounts concurrently
      const concurrentPromises = [];
      for (let i = 0; i < 20; i++) {
        concurrentPromises.push(
          accountProvider.createAccount({
            id: `concurrent-acc-${i}`,
            tenantid: "test-tenant",
            name: `Concurrent Account ${i}`,
            balance: i * 100,
            categoryid: "concurrent-cat",
            isdeleted: false,
            createdat: new Date().toISOString(),
            updatedat: new Date().toISOString(),
          }),
        );
      }

      await Promise.all(concurrentPromises);

      // Verify all accounts were created correctly
      const accounts = await accountProvider.getAllAccounts("test-tenant");
      expect(accounts).toHaveLength(20);

      // Verify data integrity
      for (let i = 0; i < 20; i++) {
        const account = accounts.find(acc => acc.id === `concurrent-acc-${i}`);
        expect(account).toBeDefined();
        expect(account?.name).toBe(`Concurrent Account ${i}`);
        expect(account?.balance).toBe(i * 100);
      }
    });
  });

  describe("Integration Points Regression", () => {
    it("should maintain compatibility with existing query patterns", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create test data
      await accountCategoryProvider.createAccountCategory({
        id: "query-cat",
        tenantid: "test-tenant",
        name: "Query Test Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "query-acc",
        tenantid: "test-tenant",
        name: "Query Test Account",
        balance: 1000,
        categoryid: "query-cat",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Test various query patterns that should still work
      const allAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(allAccounts).toHaveLength(1);

      const specificAccount = await accountProvider.getAccountById("query-acc", "test-tenant");
      expect(specificAccount).toBeDefined();
      expect(specificAccount?.name).toBe("Query Test Account");

      const totalBalance = await accountProvider.getTotalAccountBalance("test-tenant");
      expect(totalBalance).toBeDefined();
      expect(totalBalance?.totalbalance).toBe(1000);
    });

    it("should maintain backward compatibility with existing data structures", async () => {
      await storageModeManager.setMode(StorageMode.Demo);
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create data using the expected structure
      const categoryData = {
        id: "compat-cat",
        tenantid: "test-tenant",
        name: "Compatibility Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      const accountData = {
        id: "compat-acc",
        tenantid: "test-tenant",
        name: "Compatibility Account",
        balance: 1000,
        categoryid: "compat-cat",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      await accountCategoryProvider.createAccountCategory(categoryData);
      await accountProvider.createAccount(accountData);

      // Verify data structure matches expectations
      const accounts = await accountProvider.getAllAccounts("test-tenant");
      const account = accounts[0];

      expect(account).toHaveProperty("id");
      expect(account).toHaveProperty("tenantid");
      expect(account).toHaveProperty("name");
      expect(account).toHaveProperty("balance");
      expect(account).toHaveProperty("categoryid");
      expect(account).toHaveProperty("isdeleted");
      expect(account).toHaveProperty("createdat");
      expect(account).toHaveProperty("updatedat");

      expect(typeof account.id).toBe("string");
      expect(typeof account.tenantid).toBe("string");
      expect(typeof account.name).toBe("string");
      expect(typeof account.balance).toBe("number");
      expect(typeof account.categoryid).toBe("string");
      expect(typeof account.isdeleted).toBe("boolean");
    });
  });
});
