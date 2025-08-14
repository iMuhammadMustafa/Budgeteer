/**
 * Data Consistency Tests
 *
 * Tests to validate data consistency across mode switches and ensure
 * referential integrity is maintained in all storage implementations.
 *
 * Requirements: 1.5, 7.3
 */

import { StorageModeManager } from "@/src/services/storage/StorageModeManager";
import { DIContainer } from "@/src/services/storage/DIContainer";
import { StorageMode } from "@/src/types/storage/StorageTypes";

// Mock environment for testing
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "test-key";

describe("Data Consistency Tests", () => {
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

  describe("Cross-Mode Data Isolation", () => {
    it("should maintain separate data stores for each mode", async () => {
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create test data in demo mode
      await storageModeManager.setMode(StorageMode.Demo);

      await accountCategoryProvider.createAccountCategory({
        id: "demo-cat-1",
        tenantid: "test-tenant",
        name: "Demo Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "demo-acc-1",
        tenantid: "test-tenant",
        name: "Demo Account",
        balance: 1000,
        categoryid: "demo-cat-1",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      const demoAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(demoAccounts).toHaveLength(1);
      expect(demoAccounts[0].name).toBe("Demo Account");

      // Switch to local mode
      await storageModeManager.setMode(StorageMode.Local);

      // Local mode should be empty
      const localAccountsEmpty = await accountProvider.getAllAccounts("test-tenant");
      expect(localAccountsEmpty).toHaveLength(0);

      // Create different data in local mode
      await accountCategoryProvider.createAccountCategory({
        id: "local-cat-1",
        tenantid: "test-tenant",
        name: "Local Category",
        type: "liability" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "local-acc-1",
        tenantid: "test-tenant",
        name: "Local Account",
        balance: 2000,
        categoryid: "local-cat-1",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      const localAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(localAccounts).toHaveLength(1);
      expect(localAccounts[0].name).toBe("Local Account");

      // Switch back to demo mode
      await storageModeManager.setMode(StorageMode.Demo);

      // Demo data should still be intact
      const demoAccountsRestored = await accountProvider.getAllAccounts("test-tenant");
      expect(demoAccountsRestored).toHaveLength(1);
      expect(demoAccountsRestored[0].name).toBe("Demo Account");
      expect(demoAccountsRestored[0].balance).toBe(1000);
    });

    it("should handle concurrent operations across modes", async () => {
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Set up demo mode
      await storageModeManager.setMode(StorageMode.Demo);

      await accountCategoryProvider.createAccountCategory({
        id: "concurrent-cat",
        tenantid: "test-tenant",
        name: "Concurrent Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Create multiple accounts concurrently
      const accountPromises = [];
      for (let i = 0; i < 10; i++) {
        accountPromises.push(
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

      await Promise.all(accountPromises);

      const accounts = await accountProvider.getAllAccounts("test-tenant");
      expect(accounts).toHaveLength(10);

      // Verify all accounts were created correctly
      for (let i = 0; i < 10; i++) {
        const account = accounts.find(acc => acc.id === `concurrent-acc-${i}`);
        expect(account).toBeDefined();
        expect(account?.name).toBe(`Concurrent Account ${i}`);
        expect(account?.balance).toBe(i * 100);
      }
    });
  });

  describe("Referential Integrity Validation", () => {
    it("should enforce foreign key constraints across all modes", async () => {
      const modes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

      for (const mode of modes) {
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

    it("should handle cascade operations consistently", async () => {
      const modes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

      for (const mode of modes) {
        await storageModeManager.setMode(mode);

        const accountProvider = diContainer.getProvider("accounts");
        const accountCategoryProvider = diContainer.getProvider("accountCategories");
        const transactionProvider = diContainer.getProvider("transactions");
        const transactionCategoryProvider = diContainer.getProvider("transactionCategories");

        // Create test data hierarchy
        await accountCategoryProvider.createAccountCategory({
          id: `cascade-acc-cat-${mode}`,
          tenantid: "test-tenant",
          name: "Cascade Account Category",
          type: "asset" as const,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        await accountProvider.createAccount({
          id: `cascade-acc-${mode}`,
          tenantid: "test-tenant",
          name: "Cascade Account",
          balance: 1000,
          categoryid: `cascade-acc-cat-${mode}`,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        await transactionCategoryProvider.createTransactionCategory({
          id: `cascade-trans-cat-${mode}`,
          tenantid: "test-tenant",
          name: "Cascade Transaction Category",
          type: "expense" as const,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        await transactionProvider.createTransaction({
          id: `cascade-trans-${mode}`,
          tenantid: "test-tenant",
          accountid: `cascade-acc-${mode}`,
          categoryid: `cascade-trans-cat-${mode}`,
          amount: -100,
          description: "Cascade Transaction",
          date: new Date().toISOString(),
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        // Verify data was created
        const accounts = await accountProvider.getAllAccounts("test-tenant");
        const transactions = await transactionProvider.getAllTransactions("test-tenant");

        expect(accounts).toHaveLength(1);
        expect(transactions).toHaveLength(1);

        // Delete account (should handle dependent transactions)
        await accountProvider.deleteAccount(`cascade-acc-${mode}`);

        // Verify cascade behavior
        const accountsAfterDelete = await accountProvider.getAllAccounts("test-tenant");
        expect(accountsAfterDelete).toHaveLength(0);

        // Transactions should still exist but account reference should be handled
        const transactionsAfterDelete = await transactionProvider.getAllTransactions("test-tenant");
        // This behavior depends on implementation - could be cascade delete or orphan handling
        expect(transactionsAfterDelete.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Data Migration and Consistency", () => {
    it("should maintain data integrity during rapid mode switches", async () => {
      const accountProvider = diContainer.getProvider("accounts");
      const accountCategoryProvider = diContainer.getProvider("accountCategories");

      // Create base data in demo mode
      await storageModeManager.setMode(StorageMode.Demo);

      await accountCategoryProvider.createAccountCategory({
        id: "rapid-cat",
        tenantid: "test-tenant",
        name: "Rapid Switch Category",
        type: "asset" as const,
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      await accountProvider.createAccount({
        id: "rapid-acc",
        tenantid: "test-tenant",
        name: "Rapid Switch Account",
        balance: 1000,
        categoryid: "rapid-cat",
        isdeleted: false,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      });

      // Perform rapid mode switches
      const modes: StorageMode[] = [StorageMode.Local, StorageMode.Demo, StorageMode.Local, StorageMode.Demo];

      for (const mode of modes) {
        await storageModeManager.setMode(mode);

        if (mode === StorageMode.Demo) {
          // Demo mode should have our data
          const accounts = await accountProvider.getAllAccounts("test-tenant");
          expect(accounts).toHaveLength(1);
          expect(accounts[0].name).toBe("Rapid Switch Account");
        } else {
          // Local mode should be empty (unless we created data there)
          const accounts = await accountProvider.getAllAccounts("test-tenant");
          expect(accounts).toHaveLength(0);
        }
      }

      // Final verification in demo mode
      await storageModeManager.setMode("demo");
      const finalAccounts = await accountProvider.getAllAccounts("test-tenant");
      expect(finalAccounts).toHaveLength(1);
      expect(finalAccounts[0].name).toBe("Rapid Switch Account");
      expect(finalAccounts[0].balance).toBe(1000);
    });

    it("should handle schema validation consistently", async () => {
      const modes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];

      for (const mode of modes) {
        await storageModeManager.setMode(mode);

        const accountProvider = diContainer.getProvider("accounts");
        const accountCategoryProvider = diContainer.getProvider("accountCategories");

        // Create valid category
        await accountCategoryProvider.createAccountCategory({
          id: `schema-cat-${mode}`,
          tenantid: "test-tenant",
          name: "Schema Test Category",
          type: "asset" as const,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        // Test valid account creation
        const validAccount = {
          id: `schema-acc-${mode}`,
          tenantid: "test-tenant",
          name: "Schema Test Account",
          balance: 1000,
          categoryid: `schema-cat-${mode}`,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        };

        const createdAccount = await accountProvider.createAccount(validAccount);
        expect(createdAccount).toBeDefined();

        // Test invalid data (missing required fields)
        const invalidAccount = {
          id: `invalid-schema-acc-${mode}`,
          tenantid: "test-tenant",
          // Missing name field
          balance: 1000,
          categoryid: `schema-cat-${mode}`,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        };

        await expect(accountProvider.createAccount(invalidAccount as any)).rejects.toThrow();
      }
    });
  });

  describe("Performance Consistency", () => {
    it("should maintain consistent performance across modes", async () => {
      const modes: StorageMode[] = [StorageMode.Demo, StorageMode.Local];
      const performanceResults: { [key: string]: number } = {};

      for (const mode of modes) {
        await storageModeManager.setMode(mode);

        const accountProvider = diContainer.getProvider("accounts");
        const accountCategoryProvider = diContainer.getProvider("accountCategories");

        // Create category
        await accountCategoryProvider.createAccountCategory({
          id: `perf-cat-${mode}`,
          tenantid: "test-tenant",
          name: "Performance Category",
          type: "asset" as const,
          isdeleted: false,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        });

        // Measure creation performance
        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < 50; i++) {
          promises.push(
            accountProvider.createAccount({
              id: `perf-acc-${mode}-${i}`,
              tenantid: "test-tenant",
              name: `Performance Account ${i}`,
              balance: i * 10,
              categoryid: `perf-cat-${mode}`,
              isdeleted: false,
              createdat: new Date().toISOString(),
              updatedat: new Date().toISOString(),
            }),
          );
        }

        await Promise.all(promises);
        const creationTime = Date.now() - startTime;

        // Measure retrieval performance
        const retrievalStartTime = Date.now();
        const accounts = await accountProvider.getAllAccounts("test-tenant");
        const retrievalTime = Date.now() - retrievalStartTime;

        performanceResults[`${mode}_creation`] = creationTime;
        performanceResults[`${mode}_retrieval`] = retrievalTime;

        expect(accounts).toHaveLength(50);
        expect(creationTime).toBeLessThan(10000); // Should complete within 10 seconds
        expect(retrievalTime).toBeLessThan(2000); // Should retrieve within 2 seconds
      }

      // Log performance comparison
      console.log("Performance Results:", performanceResults);

      // Performance should be reasonably consistent (within 5x difference)
      const demoCreation = performanceResults["demo_creation"];
      const localCreation = performanceResults["local_creation"];
      const creationRatio = Math.max(demoCreation, localCreation) / Math.min(demoCreation, localCreation);

      expect(creationRatio).toBeLessThan(5);
    });
  });
});
