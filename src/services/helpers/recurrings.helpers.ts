import { Session } from "@supabase/supabase-js";
import dayjs from "dayjs";

import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Recurring } from "@/src/types/database/Tables.Types";
import { resolveTenantId } from "@/src/utils/tenant";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { IAccountRepository } from "@/src/repositories/interfaces/IAccountRepository";
import { IRecurringRepository } from "@/src/repositories/interfaces/IRecurringRepository";
import { ITransactionRepository } from "@/src/repositories/interfaces/ITransactionRepository";

export const executeRecurringHelper = async (
  recurring: Recurring,
  overrides: ExecutionOverrides | undefined,
  session: Session,
  recurringRepo: IRecurringRepository,
  transactionRepo: ITransactionRepository,
  accountRepo: IAccountRepository,
): Promise<ApplyResult> => {
  const userId = session.user.id;
  const tenantId = resolveTenantId(session);

  let updatedRecurring: Recurring | null = { ...recurring };
  try {
    const transactions: Inserts<TableNames.Transactions>[] = [];
    const transactionId = GenerateUuid();
    const transferTransactionId = GenerateUuid();

    const transaction: Inserts<TableNames.Transactions> = {
      id: transactionId,
      name: recurring.name,
      description: overrides?.description ?? recurring.description,
      amount: overrides?.amount ?? recurring.amount ?? 0,
      date: overrides?.date ?? recurring.nextoccurrencedate ?? dayjs().toISOString(),
      accountid: recurring.sourceaccountid,
      payee: recurring.payeename,
      notes: overrides?.notes ?? recurring.notes,
      type: recurring.type,
      categoryid: recurring.categoryid!,
      tenantid: tenantId,
      createdby: userId,
      createdat: dayjs().toISOString(),
      updatedby: userId,
      updatedat: dayjs().toISOString(),
      isvoid: false,
      isdeleted: false,
    };
    const transferTransaction: Inserts<TableNames.Transactions> = {
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
    transactions.push(transaction);

    await transactionRepo.createMultiple(transactions, tenantId);
    await accountRepo.updateAccountBalance(recurring.sourceaccountid, transaction.amount ?? 0, tenantId);
    if (recurring.recurringtype === RecurringType.Transfer && recurring.transferaccountid) {
      await accountRepo.updateAccountBalance(recurring.transferaccountid, transferTransaction.amount ?? 0, tenantId);
    }

    const updateData: any = {
      lastexecutedat: transaction.date,
      lastautoappliedat: dayjs().toISOString(),
      failedattempts: 0,
      updatedby: userId,
      updatedat: dayjs().toISOString(),
    };
    if (!recurring.isdateflexible && recurring.nextoccurrencedate && recurring.recurrencerule) {
      updateData.nextoccurrencedate = getNextOccurrence(
        recurring.nextoccurrencedate,
        recurring.recurrencerule,
      ).toISOString();
    }

    updatedRecurring = await recurringRepo.update(recurring.id, updateData, tenantId);
    return { success: true, transactionId: transactions[0].id, recurring: updatedRecurring! };
  } catch (error) {
    await recurringRepo.update(
      recurring.id,
      { failedattempts: recurring.failedattempts ? recurring.failedattempts + 1 : 1 },
      tenantId,
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      recurring,
    };
  }
};

export const getNextOccurrence = (date: string, rule: string) => {
  const { freq, interval } = parseRecurrenceRule(rule);
  // Recurrence dates are calendar dates, not instants. Repository updates may
  // round-trip them as ISO timestamps; parsing those in local time can shift a
  // midnight UTC month-end into the previous day and advance Jan 31 into March.
  const calendarDate = date.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? date;
  let next = dayjs(calendarDate);

  switch (freq) {
    case "DAILY":
      next = next.add(interval, "day");
      break;
    case "WEEKLY":
      next = next.add(interval, "week");
      break;
    case "MONTHLY": {
      const day = next.date();
      next = next.add(interval, "month");
      next = next.date(Math.min(day, next.daysInMonth()));
      break;
    }
    case "YEARLY": {
      const day = next.date();
      const month = next.month();
      next = next.add(interval, "year").month(month);
      next = next.date(Math.min(day, next.daysInMonth()));
      break;
    }
    default:
      throw new Error(`Unsupported frequency: ${freq}`);
  }

  return next.toDate();
};

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
