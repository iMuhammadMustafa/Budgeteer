/**
 * Step-by-step verification test
 */

import { MockAccountCategoryProvider } from "../../services/apis/__mock__/AccountCategories.mock";
import { MockAccountProvider } from "../../services/apis/__mock__/Accounts.mock";
import { accounts, accountCategories } from "../../services/apis/__mock__/mockDataStore";

describe("Step by Step Verification", () => {
  beforeEach(() => {
    // Clear data stores
    accounts.length = 0;
    accountCategories.length = 0;
    console.log("🧹 Cleared data stores");
  });

  test("should create category and verify it exists", async () => {
    console.log("🔍 Step 1: Testing category creation only...");

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

    console.log("📝 Creating category...");
    const createdCategory = await categoryProvider.createAccountCategory(category);
    console.log("✅ Category created with ID:", createdCategory.id);

    // Check what's actually in the data store
    console.log("📊 Categories in store:", accountCategories.length);
    console.log(
      "📊 Category data:",
      accountCategories.map(c => ({ id: c.id, name: c.name, isdeleted: c.isdeleted })),
    );

    // Verify category can be retrieved
    const retrievedCategory = await categoryProvider.getAccountCategoryById("test-category", "test-tenant");
    console.log(
      "📊 Retrieved category:",
      retrievedCategory ? { id: retrievedCategory.id, name: retrievedCategory.name } : null,
    );

    const allCategories = await categoryProvider.getAllAccountCategories("test-tenant");
    console.log("📊 All categories count:", allCategories.length);

    expect(accountCategories.length).toBe(1);
    expect(retrievedCategory).not.toBeNull();
    expect(retrievedCategory?.id).toBe("test-category");
    expect(allCategories.length).toBe(1);

    console.log("✅ Category creation and retrieval working correctly!");
  });

  test("should create account after category exists", async () => {
    console.log("🔍 Step 2: Testing account creation with pre-existing category...");

    // First create category
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

    await categoryProvider.createAccountCategory(category);
    console.log("✅ Category created");
    console.log("📊 Categories after creation:", accountCategories.length);
    console.log(
      "📊 Category details:",
      accountCategories.map(c => ({ id: c.id, isdeleted: c.isdeleted })),
    );

    // Now try to create account
    const accountProvider = new MockAccountProvider();
    const account = {
      id: "test-account",
      name: "Test Account",
      categoryid: "test-category", // This should match the category we just created
      balance: 1000,
      isactive: true,
      isdeleted: false,
      tenantid: "test-tenant",
      userid: "test-user",
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    console.log("📝 Creating account with categoryid:", account.categoryid);

    try {
      const createdAccount = await accountProvider.createAccount(account);
      console.log("✅ Account created with ID:", createdAccount.id);

      expect(accounts.length).toBe(1);
      expect(createdAccount.id).toBe("test-account");
      console.log("✅ Account creation working correctly!");
    } catch (error) {
      console.log("❌ Account creation failed:", error);

      // Let's debug what's happening in the validation
      console.log("🔍 Debug: Checking what categories exist for validation:");
      console.log("📊 Categories array:", accountCategories);
      console.log("📊 Looking for category with ID 'test-category' where isdeleted=false");
      const foundCategory = accountCategories.find(cat => cat.id === "test-category" && !cat.isdeleted);
      console.log("📊 Found category:", foundCategory);

      throw error; // Re-throw to fail the test
    }
  });
});
