import { useMutation, useQuery } from "@tanstack/react-query";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  listRecurrings,
  getRecurringById,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  // applyRecurringTransaction, // Removed as logic moves to repository
  Inserts<TableNames.Recurrings>,
  Updates<TableNames.Recurrings>,
} from "@/src/repositories/Recurrings.repository";
// Import createTransaction from Transactions.api
import { createTransaction } from "@/src/repositories/Transactions.repository";
import { updateAccountBalance } from "@/src/repositories/Accounts.repository";
import { Inserts as TransactionInserts } from "@/src/types/db/Tables.Types"; // For Transaction DTO
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import dayjs from "dayjs";

export const useListRecurrings = (filters?: any) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Recurring[]>({
    queryKey: [TableNames.Recurrings, tenantId, filters],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return listRecurrings({ tenantId, filters });
    },
    enabled: !!tenantId,
  });
};

export const useGetRecurring = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Recurring | null>({
    queryKey: [TableNames.Recurrings, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getRecurringById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useCreateRecurring = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async (recurringData: Inserts<TableNames.Recurrings>) => {
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");
      // recurringData (Inserts<TableNames.Recurrings>) should have camelCase keys from regenerated types.
      // The createRecurring API function expects lowercase keys in its direct payload.
      const apiPayload = {
        ...recurringData, // Spread camelCase keys
        tenantid: tenantId, // API expects lowercase
        createdby: userId, // API expects lowercase
        createdat: dayjs().toISOString(), // API expects lowercase
      };
      // We need to ensure all keys from recurringData are also lowercase if they are part of the DB schema.
      // This assumes Inserts<TableNames.Recurrings> maps directly to DB columns.
      // A more robust way would be to explicitly map camelCase from recurringData to lowercase for apiPayload.
      // For now, let's assume the spread works and only override the specific ones.
      // However, if recurringData contains e.g. nextOccurrenceDate, it will be passed as camelCase.
      // The createRecurring API function needs to handle this or this layer needs to map all.

      // Let's be explicit for clarity and correctness based on API's expectation of lowercase
      const explicitApiPayload: any = {};
      for (const key in recurringData) {
        const newKey = key.replace(/([A-Z])/g, "_$1").toLowerCase(); // Convert camel to snake, then to lower
        explicitApiPayload[newKey] = (recurringData as any)[key];
      }
      explicitApiPayload.tenantid = tenantId;
      explicitApiPayload.createdby = userId;
      explicitApiPayload.createdat = dayjs().toISOString();

      // The DTO (Inserts<TableNames.Recurrings>) should already have the correct (camelCase) casing from regenerated types.
      // The API layer (createRecurring) is the one that transforms it to lowercase for the .insert() call.
      // So, we should pass data structured as Inserts<TableNames.Recurrings> expects (camelCase).
      // The API layer's .insert({ ...payload, tenantid: tenantId }) handles the final structure.
      // Let's revert to simpler if DTOs are camelCase and API layer handles the snake_case for DB.
      // The issue was that the API layer was expecting lowercase for its *own* added properties.

      // Correct approach: Inserts<TableNames.Recurrings> is camelCase. The API function `createRecurring`
      // receives this camelCase DTO and is responsible for any mapping if Supabase client needs snake_case.
      // The API function itself adds tenant_id, so that should be tenantid in its own object construction.
      // The `recurringData` itself should be passed as is.
      // The API function `createRecurring` was: .insert({ ...recurringData, tenant_id: tenantId })
      // This should now be: .insert({ ...recurringData, tenantid: tenantId }) (lowercase in API)
      // And recurringData itself is camelCase.

      // So, the dataToInsert here should be camelCase as per Inserts<TableNames.Recurrings>
      const dataToInsert: Inserts<TableNames.Recurrings> = {
        // Inserts<TableNames.Recurrings> should be camelCase now
        ...(recurringData as any), // Cast to any if recurringData is not perfectly matching Inserts<TableNames.Recurrings> yet
        tenantid: tenantId, // This should be camelCase if Inserts<TableNames.Recurrings> expects it
        createdby: userId, // This should be camelCase
        createdat: dayjs().toISOString(), // This should be camelCase
      };
      // The createRecurring API function will receive this camelCase object.
      // Its internal call to supabase.insert() will use the lowercase keys as we modified in Recurrings.api.ts
      return createRecurring(dataToInsert, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
    },
    onError: error => {
      // Handle or log error
      console.error("Error creating recurring:", error);
      throw error;
    },
  });
};

export const useUpdateRecurring = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async ({ id, recurringData }: { id: string; recurringData: Updates<TableNames.Recurrings> }) => {
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

      // Destructure potential relational objects and other properties from recurringData.
      // Casting to 'any' to handle properties not strictly defined in Updates<TableNames.Recurrings>.
      const {
        category: categoryObject,
        account: accountObject, // Handles if the source account object is passed as 'account'
        source_account: sourceAccountObject, // Handles if passed as 'source_account'
        ...coreRecurringProps
      } = recurringData as any;

      // Initialize dataToUpdate with core properties and audit fields.
      // Properties like 'categoryid' or 'sourceaccountid' might already be in coreRecurringProps if passed directly.
      const dataToUpdate: Partial<Updates<TableNames.Recurrings>> = {
        ...coreRecurringProps,
        updatedby: userId, // Assuming DTO uses camelCase or API layer handles conversion
        updatedat: dayjs().toISOString(), // Assuming DTO uses camelCase or API layer handles conversion
      };

      // Handle category: If a category object with an ID is provided, use its ID.
      // This overrides any 'categoryid' that might have been spread from coreRecurringProps.
      if (categoryObject && typeof categoryObject === "object" && "id" in categoryObject) {
        dataToUpdate.categoryid = (categoryObject as { id: string }).id;
      }

      // Handle source account: Prioritize source_account object, then account object.
      // This overrides any 'sourceaccountid' from coreRecurringProps.
      if (sourceAccountObject && typeof sourceAccountObject === "object" && "id" in sourceAccountObject) {
        dataToUpdate.sourceaccountid = (sourceAccountObject as { id: string }).id;
      } else if (accountObject && typeof accountObject === "object" && "id" in accountObject) {
        dataToUpdate.sourceaccountid = (accountObject as { id: string }).id;
      }

      // Explicitly delete the full relational objects from the payload to prevent them from being sent to the API.
      // This is a safeguard in case they were part of coreRecurringProps or Updates<TableNames.Recurrings> somehow.
      delete (dataToUpdate as any).category;
      delete (dataToUpdate as any).account;
      delete (dataToUpdate as any).source_account;

      // The updateRecurring API function expects an Updates<TableNames.Recurrings> (likely camelCase).
      // It is responsible for any case conversion if the DB requires snake_case.
      return updateRecurring(id, dataToUpdate as Updates<TableNames.Recurrings>, tenantId);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, variables.id, tenantId] });
    },
    onError: error => {
      console.error("Error updating recurring:", error);
      throw error;
    },
  });
};

export const useDeleteRecurring = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");
      return deleteRecurring(id, tenantId, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
    },
    onError: error => {
      console.error("Error deleting recurring:", error);
      throw error;
    },
  });
};

// New hook to handle the multi-step recurring execution process
export const useExecuteRecurringAction = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  /**
   * Accepts { id, amount? }
   * If amount is provided, it overrides the recurring's amount for this execution.
   */
  return useMutation({
    mutationFn: async (params: { item: Recurring; amount?: number }) => {
      const { item: recurring, amount } = params;
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

      // 1. Fetch the recurring details
      if (!recurring || !recurring.isactive) {
        throw new Error("Recurring not found, not active, or does not belong to tenant.");
      }

      const currentNextOccurrenceDate = dayjs(recurring.nextoccurrencedate);

      // 2. Create a new transaction (transaction field names are already lowercase)
      const transactionPayload: TransactionInserts<TableNames.Transactions> = {
        name: recurring.name,
        description: recurring.description,
        amount: typeof amount === "number" && !isNaN(amount) ? amount : recurring.amount,
        date: currentNextOccurrenceDate.toISOString(),
        accountid: recurring.sourceaccountid,
        payee: recurring.payeename,
        notes: recurring.notes,
        type: recurring.type,
        tenantid: tenantId,
        createdby: userId,
        createdat: dayjs().toISOString(),
        categoryid: recurring.categoryid ?? " ",
      };

      const newTransaction = await createTransaction(transactionPayload);
      if (!newTransaction) {
        throw new Error("Failed to create transaction for recurring.");
      }

      // Explicitly update the account balance
      if (typeof transactionPayload.amount !== "number" || isNaN(transactionPayload.amount)) {
        throw new Error("Transaction amount is invalid for account balance update.");
      }
      await updateAccountBalance(recurring.sourceaccountid, transactionPayload.amount);

      // 3. Calculate the new next_occurrence_date
      let newNextOccurrenceDate: dayjs.Dayjs;
      const rrule = recurring.recurrencerule;
      let freq = "MONTHLY";
      let interval = 1;

      if (rrule) {
        const freqMatch = rrule.match(/FREQ=([^;]+)/);
        const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
        if (freqMatch && freqMatch[1]) freq = freqMatch[1];
        if (intervalMatch && intervalMatch[1]) interval = parseInt(intervalMatch[1], 10);
      }

      if (interval <= 0) interval = 1;

      switch (freq.toUpperCase()) {
        case "DAILY":
          newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "day");
          break;
        case "WEEKLY":
          newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "week");
          break;
        case "MONTHLY":
          newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "month");
          break;
        case "YEARLY":
          newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "year");
          break;
        default:
          newNextOccurrenceDate = currentNextOccurrenceDate.add(1, "month");
          console.warn(`Unsupported frequency: ${freq}. Defaulting to monthly.`);
      }

      // 4. Update the recurring
      const recurringUpdateData: Updates<TableNames.Recurrings> = {
        lastexecutedat: currentNextOccurrenceDate.toISOString(),
        nextoccurrencedate: newNextOccurrenceDate.format("YYYY-MM-DD"),
        updatedby: userId,
        updatedat: dayjs().toISOString(),
      };

      if (recurring.enddate && newNextOccurrenceDate.isAfter(dayjs(recurring.enddate))) {
        (recurringUpdateData as any).isactive = false;
      }

      await updateRecurring(recurring.id, recurringUpdateData, tenantId);

      return { newTransaction, updatedRecurring: recurringUpdateData };
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, tenantId] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, variables.item.id, tenantId] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      await queryClient.invalidateQueries({ queryKey: ["transactionsview"] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
    onError: error => {
      console.error("Error executing recurring action:", error);
      throw error;
    },
  });
};
