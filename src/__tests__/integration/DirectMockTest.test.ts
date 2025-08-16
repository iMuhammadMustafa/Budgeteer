/**
 * Simple Direct Test - Bypassing Jest Mocks
 *
 * This test directly imports and tests the actual mock providers
 * to verify the core data persistence issue.
 */

import { MockAccountProvider } from "../../services/apis/__mock__/Accounts.mock";
import { MockAccountCategoryProvider } from "../../services/apis/__mock__/AccountCategories.mock";
import { accounts, accountCategories } from "../../services/apis/__mock__/mockDataStore";

describe("Direct Mock Provider Test", () => {
  beforeEach(() => {
    // Clear data stores
    accounts.length = 0;
    accountCategories.length = 0;
  });

  test("should directly test mock provider without jest interference", async () => {
    console.log("🔍 Starting direct mock provider test...");

    // Create provider instances
    const accountProvider = new MockAccountProvider();
    const categoryProvider = new MockAccountCategoryProvider();
    console.log("✅ Providers created");

    // Use proper UUID format (as mocked in tests)
    const categoryId = "00000000-0000-0000-0000-000000000000";
    const accountId = "00000000-0000-0000-0000-000000000001";

    console.log("=== STEP 1: Create Account Category ===");
    const categoryData = {
      id: categoryId,
      name: "Test Category",
      description: "Test Description",
      tenantid: "test-tenant",
      isdeleted: false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log("🚀 Creating category with data:", categoryData);
    const createdCategory = await categoryProvider.createAccountCategory(categoryData);
    console.log("✅ Category created, returned:", createdCategory);
    console.log("📊 Categories array length after creation:", accountCategories.length);
    console.log("📊 Categories array content:", accountCategories);

    console.log("=== STEP 2: Verify Category Retrieval ===");
    const foundCategory = await categoryProvider.getAccountCategoryById(categoryId, "test-tenant");
    console.log("� Found category:", foundCategory);

    console.log("=== STEP 3: Create Account with Valid Category ===");
    const accountData = {
      id: accountId,
      name: "Test Account",
      categoryid: categoryId, // This should now be valid
      balance: 1000,
      tenantid: "test-tenant",
      isdeleted: false,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log("� Creating account with data:", accountData);
    const createdAccount = await accountProvider.createAccount(accountData);
    console.log("✅ Account created, returned:", createdAccount);
    console.log("� Accounts array length after creation:", accounts.length);

    console.log("=== STEP 4: Verify Account Retrieval ===");
    const foundAccount = await accountProvider.getAccountById(accountId, "test-tenant");
    console.log("📊 Found account:", foundAccount);

    // Assertions
    expect(accountCategories.length).toBe(1);
    expect(foundCategory).not.toBeNull();
    expect(foundCategory?.id).toBe(categoryId);

    expect(accounts.length).toBe(1);
    expect(foundAccount).not.toBeNull();
    expect(foundAccount?.id).toBe(accountId);
    expect(foundAccount?.categoryid).toBe(categoryId);
  });
});
