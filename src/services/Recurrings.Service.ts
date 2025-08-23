import { useMutation, useQuery } from "@tanstack/react-query";
import { Recurring, Inserts, Updates } from "@/src/types/db/Tables.Types";
import { TableNames } from "@/src/types/db/TableNames";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { IService } from "./IService";

export interface IRecurringService
  extends IService<Recurring, Inserts<TableNames.Recurrings>, Updates<TableNames.Recurrings>> {}

export function useRecurringService(): IRecurringService {
  const { session } = useAuth();
  const tenantId = session?.user?.user_metadata?.tenantid;
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const recurringRepo = dbContext.RecurringRepository();

  // Repository-based Recurring hooks
  const findAll = () => {
    return useQuery<Recurring[]>({
      queryKey: [TableNames.Recurrings, tenantId, "repo"],
      queryFn: async () => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return recurringRepo.findAll({}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<Recurring | null>({
      queryKey: [TableNames.Recurrings, id, tenantId, "repo"],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return recurringRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const create = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (data: Inserts<TableNames.Recurrings>) => {
        return await createRepoHelper(data, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
    });
  };

  const update = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async ({ form, original }: { form: Updates<TableNames.Recurrings>; original: Recurring }) => {
        return await updateRepoHelper(form, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
    });
  };

  const softDelete = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await recurringRepo.softDelete(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
    });
  };

  const restore = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (id: string) => {
        if (!tenantId) throw new Error("Tenant ID not found in session");
        return await recurringRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
    });
  };

  const executeRecurringAction = () => {
    if (!session) throw new Error("Session not found");
    return useMutation({
      mutationFn: async (params: { item: Recurring; amount?: number }) => {
        // This is a simplified implementation - in production you'd want to implement
        // the full recurring transaction logic here
        throw new Error("Execute recurring action not yet implemented in repository layer");
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
      },
    });
  };

  // Legacy hooks for backward compatibility
  // const useListRecurrings = (filters?: any) => useListRecurringsLegacy(filters);
  // const useGetRecurring = (id?: string) => useGetRecurringLegacy(id);
  // const useCreateRecurring = () => useCreateRecurringLegacy();
  // const useUpdateRecurring = () => useUpdateRecurringLegacy();
  // const useDeleteRecurring = () => useDeleteRecurringLegacy();
  // const useExecuteRecurringAction = () => useExecuteRecurringActionLegacy();

  return {
    // Repository-based methods (new) - using simple method names
    findAll,
    findById,
    create,
    update,
    softDelete,
    delete: softDelete,
    restore,
    executeRecurringAction,

    // Legacy methods (backward compatibility)
    // useListRecurrings,
    // useGetRecurring,
    // useCreateRecurring,
    // useUpdateRecurring,
    // useDeleteRecurring,
    // useExecuteRecurringAction,

    // Direct repository access
    repo: recurringRepo,
  };
}

// Repository-based helper functions
const createRepoHelper = async (formData: Inserts<TableNames.Recurrings>, session: Session, repository: any) => {
  let userId = session.user.id;
  let tenantid = session.user.user_metadata.tenantid;

  formData.createdat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
  formData.createdby = userId;
  formData.tenantid = tenantid;

  const newEntity = await repository.create(formData, tenantid);
  return newEntity;
};

const updateRepoHelper = async (formData: Updates<TableNames.Recurrings>, session: Session, repository: any) => {
  let userId = session.user.id;

  formData.updatedby = userId;
  formData.updatedat = dayjs().format("YYYY-MM-DDTHH:mm:ssZ");

  if (!formData.id) throw new Error("ID is required for update");
  const updatedEntity = await repository.update(formData.id, formData);
  return updatedEntity;
};

// Legacy functions for backward compatibility
// export const useListRecurringsLegacy = (filters?: any) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<Recurring[]>({
//     queryKey: [TableNames.Recurrings, tenantId, filters],
//     queryFn: async () => {
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return listRecurrings({ tenantId, filters });
//     },
//     enabled: !!tenantId,
//   });
// };

// export const useGetRecurringLegacy = (id?: string) => {
//   const { session } = useAuth();
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   return useQuery<Recurring | null>({
//     queryKey: [TableNames.Recurrings, id, tenantId],
//     queryFn: async () => {
//       if (!id) throw new Error("ID is required");
//       if (!tenantId) throw new Error("Tenant ID not found in session");
//       return getRecurringById(id, tenantId);
//     },
//     enabled: !!id && !!tenantId,
//   });
// };

// export const useCreateRecurringLegacy = () => {
//   const { session } = useAuth();
//   const userId = session?.user.id;
//   const tenantId = session?.user?.user_metadata?.tenantid;

//   return useMutation({
//     mutationFn: async (recurringData: Inserts<TableNames.Recurrings>) => {
//       if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

//       const dataToInsert: Inserts<TableNames.Recurrings> = {
//         ...(recurringData as any),
//         tenantid: tenantId,
//         createdby: userId,
//         createdat: dayjs().toISOString(),
//       };

//       return createRecurring(dataToInsert, tenantId);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
//     },
//     onError: error => {
//       console.error("Error creating recurring:", error);
//       throw error;
//     },
//   });
// };

// export const useUpdateRecurringLegacy = () => {
//   const { session } = useAuth();
//   const userId = session?.user.id;
//   const tenantId = session?.user?.user_metadata?.tenantid;

//   return useMutation({
//     mutationFn: async ({ id, recurringData }: { id: string; recurringData: Updates<TableNames.Recurrings> }) => {
//       if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

//       const {
//         category: categoryObject,
//         account: accountObject,
//         source_account: sourceAccountObject,
//         ...coreRecurringProps
//       } = recurringData as any;

//       const dataToUpdate: Partial<Updates<TableNames.Recurrings>> = {
//         ...coreRecurringProps,
//         updatedby: userId,
//         updatedat: dayjs().toISOString(),
//       };

//       if (categoryObject && typeof categoryObject === "object" && "id" in categoryObject) {
//         dataToUpdate.categoryid = (categoryObject as { id: string }).id;
//       }

//       if (sourceAccountObject && typeof sourceAccountObject === "object" && "id" in sourceAccountObject) {
//         dataToUpdate.sourceaccountid = (sourceAccountObject as { id: string }).id;
//       } else if (accountObject && typeof accountObject === "object" && "id" in accountObject) {
//         dataToUpdate.sourceaccountid = (accountObject as { id: string }).id;
//       }

//       delete (dataToUpdate as any).category;
//       delete (dataToUpdate as any).account;
//       delete (dataToUpdate as any).source_account;

//       return updateRecurring(id, dataToUpdate as Updates<TableNames.Recurrings>, tenantId);
//     },
//     onSuccess: async (_, variables) => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, variables.id, tenantId] });
//     },
//     onError: error => {
//       console.error("Error updating recurring:", error);
//       throw error;
//     },
//   });
// };

// export const useDeleteRecurringLegacy = () => {
//   const { session } = useAuth();
//   const userId = session?.user.id;
//   const tenantId = session?.user?.user_metadata?.tenantid;

//   return useMutation({
//     mutationFn: async (id: string) => {
//       if (!tenantId || !userId) throw new Error("User or Tenant ID not found");
//       return deleteRecurring(id, tenantId, userId);
//     },
//     onSuccess: async () => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
//     },
//     onError: error => {
//       console.error("Error deleting recurring:", error);
//       throw error;
//     },
//   });
// };

// export const useExecuteRecurringActionLegacy = () => {
//   const { session } = useAuth();
//   const userId = session?.user.id;
//   const tenantId = session?.user?.user_metadata?.tenantid;
//   const { dbContext } = useStorageMode();
//   const accountRepo = dbContext.AccountRepository();

//   return useMutation({
//     mutationFn: async (params: { item: Recurring; amount?: number }) => {
//       const { item: recurring, amount } = params;
//       if (!tenantId || !userId) throw new Error("User or Tenant ID not found");

//       if (!recurring || !recurring.isactive) {
//         throw new Error("Recurring not found, not active, or does not belong to tenant.");
//       }

//       const currentNextOccurrenceDate = dayjs(recurring.nextoccurrencedate);

//       const transactionPayload: TransactionInserts<TableNames.Transactions> = {
//         name: recurring.name,
//         description: recurring.description,
//         amount: typeof amount === "number" && !isNaN(amount) ? amount : (recurring.amount ?? 0),
//         date: currentNextOccurrenceDate.toISOString(),
//         accountid: recurring.sourceaccountid,
//         payee: recurring.payeename,
//         notes: recurring.notes,
//         type: recurring.type,
//         tenantid: tenantId,
//         createdby: userId,
//         createdat: dayjs().toISOString(),
//         categoryid: recurring.categoryid ?? " ",
//       };

//       const newTransaction = await createTransaction(transactionPayload);
//       if (!newTransaction) {
//         throw new Error("Failed to create transaction for recurring.");
//       }

//       if (typeof transactionPayload.amount !== "number" || isNaN(transactionPayload.amount)) {
//         throw new Error("Transaction amount is invalid for account balance update.");
//       }
//       await accountRepo.updateAccountBalance(recurring.sourceaccountid, transactionPayload.amount, tenantId);

//       let newNextOccurrenceDate: dayjs.Dayjs;
//       const rrule = recurring.recurrencerule;
//       let freq = "MONTHLY";
//       let interval = 1;

//       if (rrule) {
//         const freqMatch = rrule.match(/FREQ=([^;]+)/);
//         const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
//         if (freqMatch && freqMatch[1]) freq = freqMatch[1];
//         if (intervalMatch && intervalMatch[1]) interval = parseInt(intervalMatch[1], 10);
//       }

//       if (interval <= 0) interval = 1;

//       switch (freq.toUpperCase()) {
//         case "DAILY":
//           newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "day");
//           break;
//         case "WEEKLY":
//           newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "week");
//           break;
//         case "MONTHLY":
//           newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "month");
//           break;
//         case "YEARLY":
//           newNextOccurrenceDate = currentNextOccurrenceDate.add(interval, "year");
//           break;
//         default:
//           newNextOccurrenceDate = currentNextOccurrenceDate.add(1, "month");
//           console.warn(`Unsupported frequency: ${freq}. Defaulting to monthly.`);
//       }

//       const recurringUpdateData: Updates<TableNames.Recurrings> = {
//         lastexecutedat: currentNextOccurrenceDate.toISOString(),
//         nextoccurrencedate: newNextOccurrenceDate.format("YYYY-MM-DD"),
//         updatedby: userId,
//         updatedat: dayjs().toISOString(),
//       };

//       if (recurring.enddate && newNextOccurrenceDate.isAfter(dayjs(recurring.enddate))) {
//         (recurringUpdateData as any).isactive = false;
//       }

//       await updateRecurring(recurring.id, recurringUpdateData, tenantId);

//       return { newTransaction, updatedRecurring: recurringUpdateData };
//     },
//     onSuccess: async (data, variables) => {
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, tenantId] });
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings, variables.item.id, tenantId] });
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
//       await queryClient.invalidateQueries({ queryKey: ["transactionsview"] });
//       await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
//     },
//     onError: error => {
//       console.error("Error executing recurring action:", error);
//       throw error;
//     },
//   });
// };

// Maintain legacy exports for backward compatibility
// export const useListRecurrings = useListRecurringsLegacy;
// export const useGetRecurring = useGetRecurringLegacy;
// export const useCreateRecurring = useCreateRecurringLegacy;
// export const useUpdateRecurring = useUpdateRecurringLegacy;
// export const useDeleteRecurring = useDeleteRecurringLegacy;
// export const useExecuteRecurringAction = useExecuteRecurringActionLegacy;
// Individual hook exports for backward compatibility
export const useExecuteRecurringAction = () => {
  const service = useRecurringService();
  return service.executeRecurringAction();
};

export const useListRecurrings = (filters?: any) => {
  const service = useRecurringService();
  return service.findAll(filters);
};

export const useDeleteRecurring = () => {
  const service = useRecurringService();
  return service.softDelete();
};
export const useGetRecurring = (id?: string) => {
  const service = useRecurringService();
  return service.findById(id);
};

export const useCreateRecurring = () => {
  const service = useRecurringService();
  return service.create();
};

export const useUpdateRecurring = () => {
  const service = useRecurringService();
  return service.update();
};

export const useUpdateRecurring = () => {
  const service = useRecurringService();
  return service.update();
};
