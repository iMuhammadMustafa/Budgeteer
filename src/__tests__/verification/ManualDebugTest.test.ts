/**
 * Manual Debug Test - Shows exactly what's happening
 */

import { MockAccountCategoryProvider } from "../../services/apis/__mock__/AccountCategories.mock";
import { accountCategories } from "../../services/apis/__mock__/mockDataStore";

describe("Manual Debug Test", () => {
  beforeEach(() => {
    accountCategories.length = 0;
    console.log("✨ Test setup: Cleared accountCategories array");
  });

  test("debug category creation and storage step by step", async () => {
    console.log("\n🔍 Manual Debug Test - Category Creation");

    // Step 1: Check initial state
    console.log("1️⃣ Initial state check:");
    console.log("   accountCategories.length =", accountCategories.length);
    console.log("   accountCategories =", JSON.stringify(accountCategories, null, 2));

    // Step 2: Create provider
    console.log("\n2️⃣ Creating provider:");
    const categoryProvider = new MockAccountCategoryProvider();
    console.log("   Provider created successfully");

    // Step 3: Create category data
    console.log("\n3️⃣ Creating category data:");
    const categoryData = {
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
    console.log("   Category data:", JSON.stringify(categoryData, null, 2));

    // Step 4: Create category
    console.log("\n4️⃣ Creating category via provider:");
    try {
      const createdCategory = await categoryProvider.createAccountCategory(categoryData);
      console.log("   ✅ Category created successfully!");
      console.log("   Created category:", JSON.stringify(createdCategory, null, 2));

      // Step 5: Check data store after creation
      console.log("\n5️⃣ Data store after creation:");
      console.log("   accountCategories.length =", accountCategories.length);
      console.log("   accountCategories =", JSON.stringify(accountCategories, null, 2));

      // Step 6: Try to retrieve by ID
      console.log("\n6️⃣ Attempting to retrieve by ID:");
      console.log("   Looking for ID:", createdCategory.id);
      console.log("   Looking in tenant:", "test-tenant");

      const retrievedCategory = await categoryProvider.getAccountCategoryById(createdCategory.id, "test-tenant");
      console.log("   Retrieved category:", JSON.stringify(retrievedCategory, null, 2));

      // Step 7: Try getAllAccountCategories
      console.log("\n7️⃣ Attempting to get all categories:");
      const allCategories = await categoryProvider.getAllAccountCategories("test-tenant");
      console.log("   All categories count:", allCategories.length);
      console.log("   All categories:", JSON.stringify(allCategories, null, 2));

      // Final assertions
      expect(accountCategories.length).toBe(1);
      expect(retrievedCategory).not.toBeNull();
      expect(retrievedCategory?.id).toBe(createdCategory.id);
      expect(allCategories.length).toBe(1);

      console.log("\n✅ Test passed! Everything is working correctly.");
    } catch (error) {
      console.log("\n❌ Error during category creation:");
      console.log("   Error:", error);
      throw error;
    }
  });
});
