import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { TableNames } from "@/src/types/database//TableNames";
import { Inserts, Recurring } from "@/src/types/database//Tables.Types";
import { Session } from "@supabase/supabase-js";
import { useMutation } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useAuth } from "../providers/AuthProvider";
import { queryClient } from "../providers/QueryProvider";
import GenerateUuid from "../utils/uuid.Helper";
import createServiceHooks from "./BaseService";
import { IService } from "./IService";

export interface IRecurringService extends IService<Recurring, TableNames.Recurrings> {
  useExecuteRecurring: () => ReturnType<
    typeof useMutation<ApplyResult, Error, { recurring: Recurring; overrides?: ExecutionOverrides }>
  >;
}

export function useRecurringService(): IRecurringService {
  const { session } = useAuth();
  if (!session) throw new Error("Session not found");

  const tenantId = session?.user?.user_metadata?.tenantid;
  if (!tenantId) throw new Error("Tenant ID not found in session");

  const { dbContext } = useStorageMode();
  const recurringRepo = dbContext.RecurringRepository();
  const transactionRepo = dbContext.TransactionRepository();
  const accountRepo = dbContext.AccountRepository();

  const useExecuteRecurring = () => {
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
    ...createServiceHooks<Recurring, TableNames.Recurrings>(TableNames.Recurrings, recurringRepo, tenantId, session),
    useExecuteRecurring,
  };
}

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
      accountid: recurring.transferaccountid!,
      transferaccountid: transaction.accountid,
      amount: -(transaction.amount ?? 0),
      transferid: transaction.id,
      date: dayjs(transaction.date).add(-1, "second").toISOString(),
    };

    if (recurring.recurringtype === RecurringType.Transfer && recurring.transferaccountid) {
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
    if (recurring.recurringtype === RecurringType.Transfer && recurring.transferaccountid) {
      await accountRepo.updateAccountBalance(recurring.transferaccountid, transferTransaction.amount, tenantId);
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

export function validateExecutionContext(recurring: Recurring, overrideAmount?: number): void {
  const errors: string[] = [];

  if (!recurring.isactive) {
    errors.push("Recurring transaction is not active");
  }

  if (recurring.isdeleted) {
    errors.push("Recurring transaction has been deleted");
  }

  if (!recurring.isamountflexible && !overrideAmount && !recurring.amount) {
    errors.push("Amount is required for execution");
  }

  if (
    recurring.failedattempts &&
    recurring.maxfailedattempts &&
    recurring.failedattempts >= recurring.maxfailedattempts
  ) {
    errors.push(
      `Recurring transaction has exceeded maximum failed attempts (${recurring.failedattempts}/${recurring.maxfailedattempts})`,
    );
  }

  if (recurring.enddate && dayjs().isAfter(dayjs(recurring.enddate))) {
    errors.push("Recurring transaction end date has passed");
  }

  if (errors.length !== 0) {
    throw new Error(`Execution validation failed: ${errors.join(", ")}`);
  }
}
export const parseRecurrenceRule = (rule: string): { freq: RecurrenceFrequency; interval: number } => {
  const parts = rule.split(";");
  const freq = parts.find(p => p.startsWith("FREQ="))?.split("=")[1] || "MONTHLY";
  const interval = parseInt(parts.find(p => p.startsWith("INTERVAL="))?.split("=")[1] || "1", 10);
  return { freq: freq as RecurrenceFrequency, interval };
};
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export enum RecurringType {
  Standard = "Standard",
  Transfer = "Transfer",
  CreditCardPayment = "CreditCardPayment",
}
export interface ApplyResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  recurring: Recurring;
}
export interface ExecutionOverrides {
  amount?: number;
  date?: string;
  description?: string;
  notes?: string;
}
