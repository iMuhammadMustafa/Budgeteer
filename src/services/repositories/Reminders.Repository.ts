import { useMutation, useQuery } from "@tanstack/react-query";
import { Reminder, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import {
  listReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  // applyReminderTransaction, // Removed as logic moves to repository
  CreateReminderDto,
  UpdateReminderDto,
} from "../apis/Reminders.api";
// Import createTransaction from Transactions.api
import { createTransaction } from "../apis/Transactions.api";
import { updateAccountBalance } from "../apis/Accounts.api";
import { Inserts as TransactionInserts } from "@/src/types/db/Tables.Types"; // For Transaction DTO
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import dayjs from "dayjs";

export const useListReminders = (filters?: any) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Reminder[]>({
    queryKey: [TableNames.Reminders, tenantId, filters],
    queryFn: async () => {
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return listReminders({ tenantId, filters });
    },
    enabled: !!tenantId,
  });
};

export const useGetReminder = (id?: string) => {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  return useQuery<Reminder | null>({
    queryKey: [TableNames.Reminders, id, tenantId],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      if (!tenantId) throw new Error("Tenant ID not found in session");
      return getReminderById(id, tenantId);
    },
    enabled: !!id && !!tenantId,
  });
};

export const useCreateReminder = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async (reminderData: CreateReminderDto) => {
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");
      // reminderData (CreateReminderDto) should have camelCase keys from regenerated types.
      // The createReminder API function expects lowercase keys in its direct payload.
      const apiPayload = {
        ...reminderData, // Spread camelCase keys
        tenantid: tenantId, // API expects lowercase
        createdby: userId, // API expects lowercase
        createdat: dayjs().toISOString(), // API expects lowercase
      };
      // We need to ensure all keys from reminderData are also lowercase if they are part of the DB schema.
      // This assumes CreateReminderDto maps directly to DB columns.
      // A more robust way would be to explicitly map camelCase from reminderData to lowercase for apiPayload.
      // For now, let's assume the spread works and only override the specific ones.
      // However, if reminderData contains e.g. nextOccurrenceDate, it will be passed as camelCase.
      // The createReminder API function needs to handle this or this layer needs to map all.

      // Let's be explicit for clarity and correctness based on API's expectation of lowercase
      const explicitApiPayload: any = {};
      for (const key in reminderData) {
        const newKey = key.replace(/([A-Z])/g, "_$1").toLowerCase(); // Convert camel to snake, then to lower
        explicitApiPayload[newKey] = (reminderData as any)[key];
      }
      explicitApiPayload.tenantid = tenantId;
      explicitApiPayload.createdby = userId;
      explicitApiPayload.createdat = dayjs().toISOString();

      // The DTO (CreateReminderDto) should already have the correct (camelCase) casing from regenerated types.
      // The API layer (createReminder) is the one that transforms it to lowercase for the .insert() call.
      // So, we should pass data structured as CreateReminderDto expects (camelCase).
      // The API layer's .insert({ ...payload, tenantid: tenantId }) handles the final structure.
      // Let's revert to simpler if DTOs are camelCase and API layer handles the snake_case for DB.
      // The issue was that the API layer was expecting lowercase for its *own* added properties.

      // Correct approach: CreateReminderDto is camelCase. The API function `createReminder`
      // receives this camelCase DTO and is responsible for any mapping if Supabase client needs snake_case.
      // The API function itself adds tenant_id, so that should be tenantid in its own object construction.
      // The `reminderData` itself should be passed as is.
      // The API function `createReminder` was: .insert({ ...reminderData, tenant_id: tenantId })
      // This should now be: .insert({ ...reminderData, tenantid: tenantId }) (lowercase in API)
      // And reminderData itself is camelCase.

      // So, the dataToInsert here should be camelCase as per Inserts<TableNames.Reminders>
      const dataToInsert: CreateReminderDto = {
        // CreateReminderDto should be camelCase now
        ...(reminderData as any), // Cast to any if reminderData is not perfectly matching CreateReminderDto yet
        tenantid: tenantId, // This should be camelCase if CreateReminderDto expects it
        createdby: userId, // This should be camelCase
        createdat: dayjs().toISOString(), // This should be camelCase
      };
      // The createReminder API function will receive this camelCase object.
      // Its internal call to supabase.insert() will use the lowercase keys as we modified in Reminders.api.ts
      return createReminder(dataToInsert, tenantId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Reminders] });
    },
    onError: error => {
      // Handle or log error
      console.error("Error creating reminder:", error);
      throw error;
    },
  });
};

export const useUpdateReminder = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async ({ id, reminderData }: { id: string; reminderData: UpdateReminderDto }) => {
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

      // Destructure potential relational objects and other properties from reminderData.
      // Casting to 'any' to handle properties not strictly defined in UpdateReminderDto.
      const {
        category: categoryObject,
        account: accountObject, // Handles if the source account object is passed as 'account'
        source_account: sourceAccountObject, // Handles if passed as 'source_account'
        ...coreReminderProps
      } = reminderData as any;

      // Initialize dataToUpdate with core properties and audit fields.
      // Properties like 'categoryid' or 'sourceaccountid' might already be in coreReminderProps if passed directly.
      const dataToUpdate: Partial<UpdateReminderDto> = {
        ...coreReminderProps,
        updatedby: userId, // Assuming DTO uses camelCase or API layer handles conversion
        updatedat: dayjs().toISOString(), // Assuming DTO uses camelCase or API layer handles conversion
      };

      // Handle category: If a category object with an ID is provided, use its ID.
      // This overrides any 'categoryid' that might have been spread from coreReminderProps.
      if (categoryObject && typeof categoryObject === "object" && "id" in categoryObject) {
        dataToUpdate.categoryid = (categoryObject as { id: string }).id;
      }

      // Handle source account: Prioritize source_account object, then account object.
      // This overrides any 'sourceaccountid' from coreReminderProps.
      if (sourceAccountObject && typeof sourceAccountObject === "object" && "id" in sourceAccountObject) {
        dataToUpdate.sourceaccountid = (sourceAccountObject as { id: string }).id;
      } else if (accountObject && typeof accountObject === "object" && "id" in accountObject) {
        dataToUpdate.sourceaccountid = (accountObject as { id: string }).id;
      }

      // Explicitly delete the full relational objects from the payload to prevent them from being sent to the API.
      // This is a safeguard in case they were part of coreReminderProps or UpdateReminderDto somehow.
      delete (dataToUpdate as any).category;
      delete (dataToUpdate as any).account;
      delete (dataToUpdate as any).source_account;

      // The updateReminder API function expects an UpdateReminderDto (likely camelCase).
      // It is responsible for any case conversion if the DB requires snake_case.
      return updateReminder(id, dataToUpdate as UpdateReminderDto, tenantId);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Reminders] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Reminders, variables.id, tenantId] });
    },
    onError: error => {
      console.error("Error updating reminder:", error);
      throw error;
    },
  });
};

export const useDeleteReminder = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");
      return deleteReminder(id, tenantId, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Reminders] });
    },
    onError: error => {
      console.error("Error deleting reminder:", error);
      throw error;
    },
  });
};

// New hook to handle the multi-step reminder execution process
export const useExecuteReminderAction = () => {
  const { session } = useAuth();
  const userId = session?.user.id;
  const tenantId = session?.user?.user_metadata?.tenantid;

  /**
   * Accepts { id, amount? }
   * If amount is provided, it overrides the reminder's amount for this execution.
   */
  return useMutation({
    mutationFn: async (params: { item: Reminder; amount?: number }) => {
      const { item: reminder, amount } = params;
      if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

      // 1. Fetch the reminder details
      if (!reminder || !reminder.isactive) {
        throw new Error("Reminder not found, not active, or does not belong to tenant.");
      }

      const currentNextOccurrenceDate = dayjs(reminder.nextoccurrencedate);

      // 2. Create a new transaction (transaction field names are already lowercase)
      const transactionPayload: TransactionInserts<TableNames.Transactions> = {
        name: reminder.name,
        description: reminder.description,
        amount: typeof amount === "number" && !isNaN(amount) ? amount : reminder.amount,
        date: currentNextOccurrenceDate.toISOString(),
        accountid: reminder.sourceaccountid,
        payee: reminder.payeename,
        notes: reminder.notes,
        type: reminder.type,
        tenantid: tenantId,
        createdby: userId,
        createdat: dayjs().toISOString(),
        categoryid: reminder.categoryid ?? " ",
      };

      const newTransaction = await createTransaction(transactionPayload);
      if (!newTransaction) {
        throw new Error("Failed to create transaction for reminder.");
      }

      // Explicitly update the account balance
      if (typeof transactionPayload.amount !== "number" || isNaN(transactionPayload.amount)) {
        throw new Error("Transaction amount is invalid for account balance update.");
      }
      await updateAccountBalance(reminder.sourceaccountid, transactionPayload.amount);

      // 3. Calculate the new next_occurrence_date
      let newNextOccurrenceDate: dayjs.Dayjs;
      const rrule = reminder.recurrencerule;
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

      // 4. Update the reminder
      const reminderUpdateData: UpdateReminderDto = {
        lastexecutedat: currentNextOccurrenceDate.toISOString(),
        nextoccurrencedate: newNextOccurrenceDate.format("YYYY-MM-DD"),
        updatedby: userId,
        updatedat: dayjs().toISOString(),
      };

      if (reminder.enddate && newNextOccurrenceDate.isAfter(dayjs(reminder.enddate))) {
        (reminderUpdateData as any).isactive = false;
      }

      await updateReminder(reminder.id, reminderUpdateData, tenantId);

      return { newTransaction, updatedReminder: reminderUpdateData };
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: [TableNames.Reminders, tenantId] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Reminders, variables.id, tenantId] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      await queryClient.invalidateQueries({ queryKey: ["transactionsview"] });
      await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
    },
    onError: error => {
      console.error("Error executing reminder action:", error);
      throw error;
    },
  });
};
