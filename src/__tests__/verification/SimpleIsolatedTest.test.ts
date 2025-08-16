/**
 * Simple Isolated Test - No Jest mocks, minimal setup
 */

import { MockAccountCategoryProvider } from "../../services/apis/__mock__/AccountCategories.mock";
import { MockAccountProvider } from "../../services/apis/__mock__/Accounts.mock";
import { accountCategories, accounts } from "../../services/apis/__mock__/mockDataStore";

describe("Simple Isolated Test", () => {
  beforeEach(() => {
    accountCategories.length = 0;
    accounts.length = 0;
  });

  test("simple isolated test - category then account", async () => {
    console.log("\n🧪 Simple Isolated Test");

    // Step 1: Create category
    console.log("1️⃣ Creating category provider");
    const categoryProvider = new MockAccountCategoryProvider();

    console.log("2️⃣ Creating category");
    const categoryData = {
      id: "simple-category",
      name: "Simple Category",
      description: "Simple Description",
      isactive: true,
      isdeleted: false,
      tenantid: "simple-tenant",
      userid: "simple-user",
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
    };

    const createdCategory = await categoryProvider.createAccountCategory(categoryData);
    console.log("✅ Created category:", createdCategory);
    console.log("📊 accountCategories array:", accountCategories);

    // Step 2: Create account
    console.log("3️⃣ Creating account provider");
    const accountProvider = new MockAccountProvider();

    console.log("4️⃣ Creating account");
    const accountData = {
      id: "simple-account",
      name: "Simple Account",
      categoryid: "simple-category", // This should match the category we just created
      balance: 1000,
      tenantid: "simple-tenant",
      userid: "simple-user",
    };

    console.log("📝 Account data being passed:", accountData);

    const createdAccount = await accountProvider.createAccount(accountData);
    console.log("✅ Created account:", createdAccount);
    console.log("📊 accounts array:", accounts);
  });
});
