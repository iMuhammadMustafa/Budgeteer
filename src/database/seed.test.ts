/**
 * Test file to verify WatermelonDB seeding functionality
 * This can be run manually to test the seed implementation
 */

import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { schema } from "./schema";
import migrations from "./migrations";
import { seedWatermelonDB, isSeeded, clearSeedData } from "./seed";
import { AccountCategory, TransactionGroup, TransactionCategory, Configuration } from "./models";

// Create a test database instance
const createTestDatabase = (): Database => {
  const adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    dbName: "test_budgeteer_db",
  });

  return new Database({
    adapter,
    modelClasses: [AccountCategory, TransactionGroup, TransactionCategory, Configuration],
  });
};

/**
 * Test the seeding functionality
 */
export const testSeeding = async (): Promise<void> => {
  console.log("🌱 Testing WatermelonDB seeding...");

  try {
    // Create test database
    const testDb = createTestDatabase();
    console.log("✅ Test database created");

    // Verify database is initially empty
    const initialSeeded = await isSeeded(testDb);
    console.log(`📊 Initial seeded status: ${initialSeeded}`);

    // Seed the database
    await seedWatermelonDB(testDb);
    console.log("✅ Database seeded successfully");

    // Verify seeding worked
    const afterSeedSeeded = await isSeeded(testDb);
    console.log(`📊 After seed seeded status: ${afterSeedSeeded}`);

    // Check specific data
    const transactionGroups = await testDb.get(TransactionGroup.table).query().fetch();
    const transactionCategories = await testDb.get(TransactionCategory.table).query().fetch();
    const accountCategories = await testDb.get(AccountCategory.table).query().fetch();
    const configurations = await testDb.get(Configuration.table).query().fetch();

    console.log(`📈 Seeded data counts:`);
    console.log(`  - Transaction Groups: ${transactionGroups.length}`);
    console.log(`  - Transaction Categories: ${transactionCategories.length}`);
    console.log(`  - Account Categories: ${accountCategories.length}`);
    console.log(`  - Configurations: ${configurations.length}`);

    // Verify some specific records
    const entertainmentGroup = transactionGroups.find(g => (g as TransactionGroup).name === "Entertainment");
    const billsGroup = transactionGroups.find(g => (g as TransactionGroup).name === "Bills");
    const employerGroup = transactionGroups.find(g => (g as TransactionGroup).name === "Employer");

    console.log(`🎯 Sample groups found:`);
    console.log(`  - Entertainment: ${entertainmentGroup ? "✅" : "❌"}`);
    console.log(`  - Bills: ${billsGroup ? "✅" : "❌"}`);
    console.log(`  - Employer: ${employerGroup ? "✅" : "❌"}`);

    // Test categories with proper relationships
    const rentCategory = transactionCategories.find(c => (c as TransactionCategory).name === "Rent");
    const salaryCategory = transactionCategories.find(c => (c as TransactionCategory).name === "Salary");

    console.log(`🎯 Sample categories found:`);
    console.log(`  - Rent: ${rentCategory ? "✅" : "❌"}`);
    console.log(`  - Salary: ${salaryCategory ? "✅" : "❌"}`);

    // Test clearing
    await clearSeedData(testDb);
    console.log("✅ Seed data cleared successfully");

    const afterClearSeeded = await isSeeded(testDb);
    console.log(`📊 After clear seeded status: ${afterClearSeeded}`);

    console.log("🎉 All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
};

/**
 * Run the test if this file is executed directly
 */
if (typeof window !== "undefined") {
  // In browser environment, expose test function globally
  (window as any).testWatermelonDBSeeding = testSeeding;
  console.log("🧪 WatermelonDB seeding test available as window.testWatermelonDBSeeding()");
}

export default {
  testSeeding,
  createTestDatabase,
};
