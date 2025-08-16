/**
 * Mock Data Providers Integration Test
 *
 * This test bypasses jest mocks to test the actual mock data providers
 * and verify data persistence across operations.
 */

// Don't use the mocked versions - import the actual implementations
jest.unmock("../../services/storage/DIContainer");
jest.unmock("../../services/storage/StorageModeManager");
jest.unmock("../../services/apis/__mock__/mockDataStore");

import { MockAccountProvider } from "../../services/apis/__mock__/Accounts.mock";
import { MockAccountCategoryProvider } from "../../services/apis/__mock__/AccountCategories.mock";
import { MockTransactionProvider } from "../../services/apis/__mock__/Transactions.mock";
import { MockTransactionCategoryProvider } from "../../services/apis/__mock__/TransactionCategories.mock";
import { accounts, accountCategories } from "../../services/apis/__mock__/mockDataStore";

describe("Mock Data Providers Integration", () => {
  beforeEach(() => {
    // Clear any existing data
    accounts.length = 0;
    accountCategories.length = 0;
  });

  describe("Data Persistence Across Provider Instances", () => {
    it("should maintain data across different provider instances", async () => {
      // Create first provider instance and add data
      const provider1 = new MockAccountProvider();
      const newAccount = {
        id: "test-account-1",
        name: "Test Account",
        accountcategoryid: "category-1",
        balance: 1000,
        isactive: true,
        isdeleted: false,
        tenantid: "test-tenant",
        userid: "test-user",
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
      };

      const created = await provider1.createAccount(newAccount, "test-tenant");
      expect(created).toEqual(newAccount);

      // Verify data exists in the shared store
      expect(accounts.length).toBe(1);
      expect(accounts[0]).toEqual(newAccount);

      // Create second provider instance and retrieve data
      const provider2 = new MockAccountProvider();
      const allAccounts = await provider2.getAllAccounts("test-tenant");

      expect(allAccounts.length).toBe(1);
      expect(allAccounts[0]).toEqual(newAccount);
    });

    it("should share data across different entity providers", async () => {
      // Add category first
      const categoryProvider = new AccountCategoriesMock();
      const category = {
        id: "category-1",
        name: "Test Category",
        description: "Test Description",
        isActive: true,
        isDeleted: false,
        tenantId: "test-tenant",
        userId: "test-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await categoryProvider.createAccountCategory(category, "test-tenant");
      expect(accountCategories.length).toBe(1);

      // Add account that references the category
      const accountProvider = new AccountsMock();
      const account = {
        id: "account-1",
        name: "Test Account",
        accountCategoryId: "category-1",
        balance: 1000,
        isActive: true,
        isDeleted: false,
        tenantId: "test-tenant",
        userId: "test-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await accountProvider.createAccount(account, "test-tenant");
      expect(accounts.length).toBe(1);

      // Verify both can be retrieved
      const retrievedCategories = await categoryProvider.getAllAccountCategories("test-tenant");
      const retrievedAccounts = await accountProvider.getAllAccounts("test-tenant");

      expect(retrievedCategories.length).toBe(1);
      expect(retrievedAccounts.length).toBe(1);
      expect(retrievedAccounts[0].accountCategoryId).toBe(retrievedCategories[0].id);
    });
  });

  describe("CRUD Operations", () => {
    it("should perform complete CRUD cycle", async () => {
      const provider = new AccountsMock();
      const tenantId = "test-tenant";

      // Create
      const account = {
        id: "crud-test-1",
        name: "CRUD Test Account",
        accountCategoryId: "category-1",
        balance: 500,
        isActive: true,
        isDeleted: false,
        tenantId,
        userId: "test-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const created = await provider.createAccount(account, tenantId);
      expect(created).toEqual(account);

      // Read
      const retrieved = await provider.getAccountById("crud-test-1", tenantId);
      expect(retrieved).toEqual(account);

      const allAccounts = await provider.getAllAccounts(tenantId);
      expect(allAccounts.length).toBe(1);
      expect(allAccounts[0]).toEqual(account);

      // Update
      const updatedAccount = {
        ...account,
        name: "Updated Account Name",
        balance: 750,
        updatedAt: new Date().toISOString(),
      };

      const updated = await provider.updateAccount(updatedAccount, tenantId);
      expect(updated.name).toBe("Updated Account Name");
      expect(updated.balance).toBe(750);

      // Verify update persisted
      const retrievedAfterUpdate = await provider.getAccountById("crud-test-1", tenantId);
      expect(retrievedAfterUpdate?.name).toBe("Updated Account Name");
      expect(retrievedAfterUpdate?.balance).toBe(750);

      // Delete (soft delete)
      await provider.deleteAccount("crud-test-1", tenantId);

      // Verify soft delete
      const afterDelete = await provider.getAllAccounts(tenantId);
      expect(afterDelete.length).toBe(0); // Should filter out deleted items

      // Verify item still exists but marked as deleted
      const deletedItem = accounts.find(a => a.id === "crud-test-1");
      expect(deletedItem?.isDeleted).toBe(true);
    });
  });

  describe("Validation and Error Handling", () => {
    it("should handle duplicate ID creation", async () => {
      const provider = new AccountsMock();
      const account1 = {
        id: "duplicate-test",
        name: "First Account",
        accountCategoryId: "category-1",
        balance: 100,
        isActive: true,
        isDeleted: false,
        tenantId: "test-tenant",
        userId: "test-user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const account2 = {
        ...account1,
        name: "Second Account",
      };

      // First creation should succeed
      await provider.createAccount(account1, "test-tenant");
      expect(accounts.length).toBe(1);

      // Second creation with same ID should throw error
      await expect(provider.createAccount(account2, "test-tenant")).rejects.toThrow("already exists");
    });

    it("should handle missing entity operations", async () => {
      const provider = new AccountsMock();

      // Try to get non-existent account
      const nonExistent = await provider.getAccountById("non-existent", "test-tenant");
      expect(nonExistent).toBeNull();

      // Try to update non-existent account
      await expect(
        provider.updateAccount(
          {
            id: "non-existent",
            name: "Test",
            accountCategoryId: "cat-1",
            balance: 100,
            isActive: true,
            isDeleted: false,
            tenantId: "test-tenant",
            userId: "test-user",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          "test-tenant",
        ),
      ).rejects.toThrow("not found");

      // Try to delete non-existent account
      await expect(provider.deleteAccount("non-existent", "test-tenant")).rejects.toThrow("not found");
    });
  });
});
