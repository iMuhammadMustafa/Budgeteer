import { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { accounts, profiles, recurrings } from "./schema";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";

/**
 * Updates an account balance by adding the specified amount
 * Matches the behavior of the Supabase updateaccountbalance function
 * 
 * @param db - Drizzle database instance
 * @param accountId - ID of the account to update
 * @param amount - Amount to add to the account balance (can be negative)
 * @returns The new account balance
 */
export async function updateAccountBalance(
  db: ExpoSQLiteDatabase<typeof schema>, 
  accountId: string, 
  amount: number
): Promise<number> {
  const result = await db
    .update(accounts)
    .set({ 
      balance: sql`${accounts.balance} + ${amount}`,
      updatedat: new Date().toISOString()
    })
    .where(eq(accounts.id, accountId))
    .returning({ balance: accounts.balance });
  
  if (result.length === 0) {
    throw new Error(`Account with ID ${accountId} not found`);
  }
  
  return result[0].balance ?? 0;
}

/**
 * Creates a new user profile when a user signs up
 * Replicates the behavior of the Supabase handle_new_user trigger
 * 
 * @param db - Drizzle database instance
 * @param userData - User data from authentication
 */
export async function handleNewUser(
  db: ExpoSQLiteDatabase<typeof schema>,
  userData: {
    id: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    timezone?: string;
    tenantId?: string;
  }
): Promise<void> {
  await db.insert(profiles).values({
    id: userData.id,
    email: userData.email,
    full_name: userData.fullName || null,
    avatar_url: userData.avatarUrl || null,
    timezone: userData.timezone || null,
    tenantid: userData.tenantId || null,
    updated_at: new Date().toISOString()
  });
}

/**
 * Applies a recurring transaction by creating a new transaction and updating the recurring schedule
 * Replicates the behavior of the Supabase apply_recurring_transaction function
 * 
 * @param db - Drizzle database instance
 * @param recurringId - ID of the recurring transaction to apply
 */
export async function applyRecurringTransaction(
  db: ExpoSQLiteDatabase<typeof schema>,
  recurringId: string
): Promise<void> {
  // This is a stub implementation as specified in the task
  // The full implementation would:
  // 1. Fetch the recurring transaction details
  // 2. Create a new transaction based on the recurring data
  // 3. Update the recurring's next occurrence date
  // 4. Handle recurrence rule parsing (FREQ=DAILY/WEEKLY/MONTHLY/YEARLY, INTERVAL=X)
  // 5. Deactivate if past end date
  
  console.log(`applyRecurringTransaction called for recurring ID: ${recurringId}`);
  
  // For now, just verify the recurring exists
  const recurringRecord = await db
    .select()
    .from(recurrings)
    .where(eq(recurrings.id, recurringId))
    .limit(1);
    
  if (recurringRecord.length === 0) {
    throw new Error(`Recurring transaction with ID ${recurringId} not found`);
  }
  
  if (!recurringRecord[0].isactive) {
    console.log(`Recurring ${recurringId} is not active, skipping execution`);
    return;
  }
  
  // TODO: Implement full recurring transaction logic
  // This stub ensures the function exists and can be called without errors
}