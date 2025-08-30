import { useMutation, useQuery } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";
import { queryClient } from "@/src/providers/QueryProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/db/TableNames";
import GenerateUuid from "@/src/utils/UUID.Helper";
import { ExecutionOverrides, RecurringFilters, ApplyResult, RecurringType } from "@/src/types/recurring";
import { validateRecurring, validateExecutionContext } from "@/src/utils/recurring-validation";
import { Inserts, Recurring, Updates } from "@/src/types/db/Tables.Types";
import { IService } from "./IService";
import { IRecurringRepository } from "@/src/repositories";

export interface IRecurringService
  extends IService<Recurring, Inserts<TableNames.Recurrings>, Updates<TableNames.Recurrings>> {
  executeRecurring: () => ReturnType<
    typeof useMutation<ApplyResult, Error, { recurring: Recurring; overrides?: ExecutionOverrides }>
  >;
}

export function useRecurringService(): IRecurringService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");
  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");
  const userId = session?.user?.id;
  const { dbContext } = useStorageMode();
  const recurringRepo = dbContext.RecurringRepository();
  const accountRepo = dbContext.AccountRepository();
  const transactionRepo = dbContext.TransactionRepository();

  const create = () => {
    return useMutation({
      mutationFn: async (form: Inserts<TableNames.Recurrings>) => {
        return await createRecurringHelper(form, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error creating recurring:", error);
        throw error;
      },
    });
  };
  const update = () => {
    return useMutation({
      mutationFn: async ({ form, original }: { form: Updates<TableNames.Recurrings>; original?: Recurring }) => {
        return await updateRecurringHelper(form, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error updating recurring:", error);
        throw error;
      },
    });
  };
  const upsert = () => {
    return useMutation({
      mutationFn: async ({
        form,
        original,
      }: {
        form: Inserts<TableNames.Recurrings> | Updates<TableNames.Recurrings>;
        original?: Recurring;
      }) => {
        Object.keys(form).forEach(key => {
          if (form[key as keyof typeof form] === undefined) {
            delete form[key as keyof typeof form];
          }
        });

        if (form.id && original) {
          return await updateRecurringHelper(form as Updates<TableNames.Recurrings>, session, recurringRepo);
        }
        await createRecurringHelper(form as Inserts<TableNames.Recurrings>, session, recurringRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error updating recurring:", error);
        throw error;
      },
    });
  };

  const deleteRecurring = () => {
    return useMutation({
      mutationFn: async ({ id }: { id: string }) => {
        return await recurringRepo.softDelete(id, tenantId);
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
  const restore = () => {
    return useMutation({
      mutationFn: async (id: string) => {
        return await recurringRepo.restore(id, tenantId);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
      },
      onError: error => {
        console.error("Error restoring recurring:", error);
        throw error;
      },
    });
  };

  const findAll = (filters?: RecurringFilters) => {
    return useQuery<Recurring[]>({
      queryKey: [TableNames.Recurrings, tenantId, filters],
      queryFn: async () => {
        return recurringRepo.findAll(filters || {}, tenantId);
      },
      enabled: !!tenantId,
    });
  };

  const findById = (id?: string) => {
    return useQuery<Recurring | null>({
      queryKey: [TableNames.Recurrings, id, tenantId],
      queryFn: async () => {
        if (!id) throw new Error("ID is required");
        return recurringRepo.findById(id, tenantId);
      },
      enabled: !!id && !!tenantId,
    });
  };

  const executeRecurring = () => {
    return useMutation({
      mutationFn: async ({ recurring, overrides }: { recurring: Recurring; overrides?: ExecutionOverrides }) => {
        return await executeRecurringHelper(recurring, overrides, session, recurringRepo, transactionRepo, accountRepo);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [TableNames.Recurrings] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Transactions] });
        await queryClient.invalidateQueries({ queryKey: [TableNames.Accounts] });
      },
      onError: error => {
        console.error("Error executing recurring:", error);
        throw error;
      },
    });
  };

  return {
    findAll,
    findById,
    create,
    update,
    upsert,
    delete: deleteRecurring,
    softDelete: deleteRecurring,
    executeRecurring,
    restore,

    repo: recurringRepo,
  };
}

const createRecurringHelper = async (
  formData: Inserts<TableNames.Recurrings>,
  session: Session,
  repository: IRecurringRepository,
): Promise<Recurring> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  const validation = validateRecurring(formData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(", ")}`);
  }

  const recurringData: Inserts<TableNames.Recurrings> = {
    ...formData,
    id: GenerateUuid(),
    createdat: dayjs().utc().format("YYYY-MM-DDTHH:mm:ssZ"),
    createdby: userId,
    tenantid: tenantId,
    intervalmonths: formData.intervalmonths || 1,
    autoapplyenabled: formData.autoapplyenabled || false,
    isamountflexible: formData.isamountflexible || false,
    isdateflexible: formData.isdateflexible || false,
    recurringtype: formData.recurringtype || RecurringType.Standard,
    failedattempts: 0,
    maxfailedattempts: formData.maxfailedattempts || 3,
  };

  return await repository.create(recurringData, tenantId);
};

const updateRecurringHelper = async (
  form: Updates<TableNames.Recurrings>,
  session: Session,
  repository: any,
): Promise<Recurring | null> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  const validation = validateRecurring(form);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(", ")}`);
  }

  const dataToUpdate: Updates<TableNames.Recurrings> = {
    ...form,
    updatedby: userId,
    updatedat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
  };

  const updatedEntity = await repository.update(form.id, dataToUpdate, tenantId);
  return updatedEntity;
};

export const executeRecurringHelper = async (
  recurring: Recurring,
  overrides: ExecutionOverrides | undefined,
  session: Session,
  recurringRepo: any,
  transactionRepo: any,
  accountRepo: any,
): Promise<ApplyResult> => {
  const userId = session.user.id;
  const tenantId = session.user.user_metadata.tenantid;

  if (!recurring) {
    throw new Error("Recurring transaction not found");
  }
  try {
    validateExecutionContext(recurring, overrides?.amount);

    const executionAmount = overrides?.amount ?? recurring.amount ?? 0;
    const executionDate = recurring.nextoccurrencedate ?? overrides?.date ?? dayjs().utc().toISOString();
    const executionDescription = overrides?.description ?? recurring.description;
    const executionNotes = overrides?.notes ?? recurring.notes;
    const type = recurring.type;

    const transactions: Inserts<TableNames.Transactions>[] = [];
    const transactionId = GenerateUuid();
    const transferTransactionId = GenerateUuid();
    let transaction: Inserts<TableNames.Transactions> = {
      id: transactionId,
      name: recurring.name,
      description: executionDescription,
      amount: executionAmount,
      date: executionDate,
      accountid: recurring.sourceaccountid,
      payee: recurring.payeename,
      notes: executionNotes,
      type: type,
      categoryid: recurring.categoryid!,
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString(),
      updatedby: userId,
      updatedat: dayjs().toISOString(),
      isvoid: false,
      isdeleted: false,
    };
    let transferTransaction: Inserts<TableNames.Transactions> = {
      ...transaction,
      id: transferTransactionId,
      accountid: transaction.transferaccountid!,
      transferaccountid: transaction.accountid,
      amount: -(transaction.amount ?? 0),
      transferid: transaction.id,
      date: dayjs(transaction.date).add(-1, "second").toISOString(),
    };

    if (recurring.recurringtype === RecurringType.Transfer && transaction.transferaccountid) {
      transaction.transferid = transferTransactionId;
      transaction.transferaccountid = recurring.transferaccountid;
      transactions.push(transferTransaction);
    }
    //TODO: Handle CreditCardPayment
    //else if (recurring.recurringtype === RecurringType.CreditCardPayment) {
    // const liabilityAccount = await accountRepo.findById(recurring.transferaccountid!, tenantId);
    // const currentBalance = liabilityAccount.balance || 0;
    // const paymentAmount = overrideAmount ?? Math.abs(Math.min(currentBalance, 0));

    // if (currentBalance >= 0) {
    //   console.log(`Credit card payment skipped - account has positive balance: ${currentBalance}`);
    //   return { transactions: [], paymentAmount: 0 };
    //}
    transactions.push(transaction);

    await transactionRepo.createMultipleTransactions(transactions, tenantId);
    await accountRepo.updateAccountBalance(recurring.sourceaccountid, transaction.amount, tenantId);
    if (recurring.recurringtype === RecurringType.Transfer) {
      await accountRepo.updateAccountBalance(recurring.transferaccountid!, transferTransaction.amount, tenantId);
    }

    let updateData: any = {
      lastexecutedat: executionDate,
      lastautoappliedat: dayjs().utc().toISOString(),
      failedattempts: 0,
      updatedby: userId,
      updatedat: dayjs().utc().toISOString(),
    };

    if (!recurring.isdateflexible && recurring.nextoccurrencedate && recurring.recurrencerule) {
      updateData.nextoccurrencedate = getNextOccurrence(
        recurring.nextoccurrencedate,
        recurring.recurrencerule,
      ).toISOString();
    }

    recurring = await recurringRepo.update(recurring.id, updateData, tenantId);

    return {
      success: true,
      transactionId: transactions[0].id,
      recurring,
    };
  } catch (error) {
    // Increment failed attempts on error
    recurring = await recurringRepo.update(
      recurring.id,
      {
        failedattempts: recurring.failedattempts ? recurring.failedattempts + 1 : 1,
      },
      tenantId,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      recurring,
    };
  }
};

const getNextOccurrence = (date: string, rule: string) => {
  const { freq, interval } = parseRecurrenceRule(rule);
  let next = dayjs(date);

  switch (freq) {
    case "DAILY":
      next = next.add(interval, "day");
      break;

    case "WEEKLY":
      next = next.add(interval, "week"); // same weekday
      break;

    case "MONTHLY":
      {
        const day = next.date();
        next = next.add(interval, "month");
        next = next.date(Math.min(day, next.daysInMonth()));
      }
      break;

    case "YEARLY":
      {
        const day = next.date();
        const month = next.month();
        next = next.add(interval, "year").month(month);
        next = next.date(Math.min(day, next.daysInMonth()));
      }
      break;

    default:
      throw new Error(`Unsupported frequency: ${freq}`);
  }

  return next.toDate();
};
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export const parseRecurrenceRule = (rule: string): { freq: RecurrenceFrequency; interval: number } => {
  const parts = rule.split(";");
  const freq = parts.find(p => p.startsWith("FREQ="))?.split("=")[1] || "MONTHLY";
  const interval = parseInt(parts.find(p => p.startsWith("INTERVAL="))?.split("=")[1] || "1", 10);
  return { freq: freq as RecurrenceFrequency, interval };
};
