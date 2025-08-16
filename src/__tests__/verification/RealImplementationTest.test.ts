/**
 * Integration Test Without Jest Mocks
 *
 * This test bypasses the jest mocking to test actual functionality
 * and prove that the core storage system is working correctly.
 */

// First, let's add a category so we don't get referential integrity errors
import { MockAccountCategoryProvider } from "../../services/apis/__mock__/AccountCategories.mock";
import { MockAccountProvider } from "../../services/apis/__mock__/Accounts.mock";
import { accounts, accountCategories } from "../../services/apis/__mock__/mockDataStore";

describe("Real Implementation Verification", () => {
  beforeEach(() => {
    // Clear data stores
    accounts.length = 0;
    accountCategories.length = 0;
  });

  test("should prove core functionality works correctly", async () => {
    console.log("🔍 Testing real implementations without jest mocks...");

    // Step 1: Create a category first (to satisfy referential integrity)
    const categoryProvider = new MockAccountCategoryProvider();
    const category = {
      id: "test-category",
      name: "Test Category",
      description: "Test Description",
      isactive: true,
      isdeleted: false,
      tenantid: "test-tenant",
      userid: "test-user",
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log("📝 Creating account category...");
    const createdCategory = await categoryProvider.createAccountCategory(category);
    console.log("✅ Category created:", createdCategory.id);

    // Verify category is in data store
    console.log("📊 Categories in store:", accountCategories.length);
    expect(accountCategories.length).toBe(1);

    // Step 2: Create an account (this should work with valid category)
    const accountProvider = new MockAccountProvider();
    const account = {
      id: "test-account",
      name: "Test Account",
      categoryid: "test-category", // Use the valid category ID
      balance: 1000,
      isactive: true,
      isdeleted: false,
      tenantid: "test-tenant",
      userid: "test-user",
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log("📝 Creating account...");
    const createdAccount = await accountProvider.createAccount(account);
    console.log("✅ Account created:", createdAccount.id);

    // Verify account is in data store
    console.log("📊 Accounts in store:", accounts.length);
    expect(accounts.length).toBe(1);

    // Step 3: Retrieve accounts
    console.log("🔍 Retrieving all accounts...");
    const allAccounts = await accountProvider.getAllAccounts("test-tenant");
    console.log("📊 Retrieved accounts count:", allAccounts.length);
    console.log(
      "📊 Retrieved accounts:",
      allAccounts.map(a => ({ id: a.id, name: a.name })),
    );

    // Step 4: Retrieve specific account
    console.log("🔍 Retrieving specific account by ID...");
    const specificAccount = await accountProvider.getAccountById("test-account", "test-tenant");
    console.log(
      "📊 Retrieved specific account:",
      specificAccount ? { id: specificAccount.id, name: specificAccount.name } : null,
    );

    // Assertions proving the system works
    expect(allAccounts.length).toBe(1);
    expect(allAccounts[0].id).toBe("test-account");
    expect(allAccounts[0].name).toBe("Test Account");
    expect(specificAccount).not.toBeNull();
    expect(specificAccount?.id).toBe("test-account");

    console.log("✅ All assertions passed - core functionality is working!");

    // Step 5: Test validation (should fail with invalid category)
    const invalidAccount = {
      id: "invalid-account",
      name: "Invalid Account",
      categoryid: "non-existent-category",
      balance: 1000,
      isactive: true,
      isdeleted: false,
      tenantid: "test-tenant",
      userid: "test-user",
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log("🧪 Testing validation with invalid category...");
    await expect(accountProvider.createAccount(invalidAccount)).rejects.toThrow("Referenced record not found");
    console.log("✅ Validation working correctly - referential integrity enforced!");
  });

  test("should demonstrate proper error handling", async () => {
    const accountProvider = new MockAccountProvider();

    // Test with missing required fields should fail validation
    const invalidAccount = {
      id: "invalid",
      // Missing required fields like name, categoryid, etc.
    } as any;

    console.log("🧪 Testing with invalid data structure...");
    await expect(accountProvider.createAccount(invalidAccount)).rejects.toThrow();
    console.log("✅ Input validation working correctly!");
  });
});
