/**
 * Pure transaction mutation helpers extracted from Transactions.Service so they
 * can be unit-tested without the React Query / provider graph. Behavior is
 * identical to the originals; repositories are injected as parameters.
 */
import { Session } from "@supabase/supabase-js";
import { resolveTenantId } from "@/src/utils/tenant";
import dayjs from "dayjs";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { TableNames } from "@/src/types/database/TableNames";
import { Inserts, Transaction, Updates } from "@/src/types/database/Tables.Types";
import { IAccountRepository } from "@/src/repositories/interfaces/IAccountRepository";
import { ITransactionRepository } from "@/src/repositories/interfaces/ITransactionRepository";

export const createTransactionHelper = async (
  formTransaction: Inserts<TableNames.Transactions>,
  session: Session,
  repo: ITransactionRepository,
  accountRepo: IAccountRepository,
) => {
  let userId = session.user.id;
  let tenantid = resolveTenantId(session);
  const transactions: Inserts<TableNames.Transactions>[] = [];

  const id = GenerateUuid();
  const transferid = formTransaction.type === "Transfer" ? GenerateUuid() : undefined;

  formTransaction.id = id;
  // IMPORTANT:
  // For local SQLite, `transferid` has an immediate FK to `transactions(id)`.
  // If both transfer rows point to each other at insert time, the first insert can fail
  // because the referenced row does not yet exist.
  // So we insert source row first without transferid, then insert the paired row,
  // and finally link source -> paired via an update.
  formTransaction.transferid = undefined;
  formTransaction.createdat = new Date().toISOString();
  formTransaction.createdby = userId;
  formTransaction.tenantid = tenantid;
  formTransaction.updatedby = userId;

  transactions.push(formTransaction);

  if (transferid && formTransaction.transferaccountid) {
    const transferTransaction = {
      ...formTransaction,
      id: transferid,
      transferid: id,
      accountid: formTransaction.transferaccountid,
      transferaccountid: formTransaction.accountid,
      amount: -formTransaction.amount!,
      date: dayjs(formTransaction.date).add(1, "second").toISOString(),
    };
    transactions.push(transferTransaction);
  }

  const newTransactions = await repo.createMultiple!(transactions, tenantid);

  // TODO: This linking step is necessary due to the way SQLite handles FK constraints, but ideally we would handle this within a single transaction in the repository layer to ensure atomicity and avoid potential issues with concurrent operations.
  // Link source transaction to the paired transfer after both rows exist.
  if (transferid) {
    await repo.update(id, { transferid }, tenantid);
    if (newTransactions?.[0]) {
      (newTransactions[0] as any).transferid = transferid;
    }
  }

  if (newTransactions) {
    await accountRepo.updateAccountBalance(formTransaction.accountid, formTransaction.amount!, tenantid);

    if (formTransaction.transferaccountid) {
      await accountRepo.updateAccountBalance(formTransaction.transferaccountid, -formTransaction.amount!, tenantid);
    }
  }

  return newTransactions[0];
};

export const updateTransactionHelper = async (
  formTransaction: Updates<TableNames.Transactions>,
  originalData: Transaction,
  session: Session,
  transactionRepo: ITransactionRepository,
  accountRepo: IAccountRepository,
) => {
  const userId = session.user.id;
  const tenantId = resolveTenantId(session);
  const currentTimestamp = new Date().toISOString();
  const isTransfer = !!originalData.transferid;

  const isUnchanged = Object.keys(formTransaction).every(key => {
    if (key in formTransaction && key in originalData) {
      return formTransaction[key as keyof typeof formTransaction] === originalData[key as keyof typeof originalData];
    }
    return false;
  });
  if (isUnchanged) return; // Exit early if no changes

  // Build the update payload(s) for the edited row and, for transfers, its
  // mirrored pair. Fields shared between the pair (everything but the
  // account/amount legs, which are swapped/negated) are mirrored verbatim.
  const updatedTransaction: Updates<TableNames.Transactions> = {};
  const updatedTransferTransaction: Updates<TableNames.Transactions> = {};

  const mirrorField = <K extends keyof Updates<TableNames.Transactions>>(field: K, value: any) => {
    updatedTransaction[field] = value;
    if (isTransfer) updatedTransferTransaction[field] = value;
  };

  (["name", "date", "payee", "description", "tags", "notes", "categoryid"] as const).forEach(field => {
    if (formTransaction[field] !== undefined && formTransaction[field] !== originalData[field]) {
      mirrorField(field, formTransaction[field]);
    }
  });

  if (formTransaction.isvoid !== undefined && formTransaction.isvoid !== originalData.isvoid) {
    mirrorField("isvoid", formTransaction.isvoid);
  }
  if (formTransaction.amount !== undefined && formTransaction.amount !== originalData.amount) {
    updatedTransaction.amount = formTransaction.amount;
    if (isTransfer) updatedTransferTransaction.amount = -formTransaction.amount;
  }
  if (formTransaction.accountid !== undefined && formTransaction.accountid !== originalData.accountid) {
    updatedTransaction.accountid = formTransaction.accountid;
    if (isTransfer) updatedTransferTransaction.transferaccountid = formTransaction.accountid;
  }
  if (
    formTransaction.transferaccountid !== undefined &&
    formTransaction.transferaccountid !== originalData.transferaccountid
  ) {
    updatedTransaction.transferaccountid = formTransaction.transferaccountid;
    // `transferaccountid` is `string | null`; the mirror leg's `accountid` is
    // `string | undefined`. Coerce null→undefined (a transfer always has a
    // destination, so this branch never receives null in practice).
    if (isTransfer) updatedTransferTransaction.accountid = formTransaction.transferaccountid ?? undefined;
  }

  // Compute account-balance deltas.
  //
  // A (non-voided) transaction leg contributes its signed `amount` to
  // `accountid`'s balance, and — for transfers — the inverse amount to
  // `transferaccountid`'s balance. A voided leg contributes nothing. The
  // correct balance adjustment for any combination of field changes is
  // simply (new contribution - old contribution) per affected account,
  // so we compute both contribution sets and net them into a single delta
  // map rather than special-casing each field combination.
  const mergedIsVoid = formTransaction.isvoid ?? originalData.isvoid;
  const mergedAccountId = formTransaction.accountid ?? originalData.accountid;
  const mergedAmount = formTransaction.amount ?? originalData.amount;
  const mergedTransferAccountId = formTransaction.transferaccountid ?? originalData.transferaccountid;

  const deltas = new Map<string, number>();
  const addDelta = (accountId: string | null | undefined, amount: number | null | undefined) => {
    if (!accountId || !amount) return;
    deltas.set(accountId, (deltas.get(accountId) ?? 0) + amount);
  };

  if (!originalData.isvoid) {
    addDelta(originalData.accountid, -originalData.amount);
    if (isTransfer) addDelta(originalData.transferaccountid, originalData.amount);
  }
  if (!mergedIsVoid) {
    addDelta(mergedAccountId, mergedAmount);
    if (isTransfer) addDelta(mergedTransferAccountId, -mergedAmount!);
  }

  // Persist the row(s) first, then apply balance deltas.
  if (Object.keys(updatedTransaction).length > 0) {
    updatedTransaction.id = originalData.id;
    updatedTransaction.updatedat = currentTimestamp;
    updatedTransaction.updatedby = userId;
    await transactionRepo.update(updatedTransaction.id, updatedTransaction, tenantId);
  }
  if (isTransfer && Object.keys(updatedTransferTransaction).length > 0) {
    updatedTransferTransaction.id = originalData.transferid!;
    updatedTransferTransaction.updatedat = currentTimestamp;
    updatedTransferTransaction.updatedby = userId;
    await transactionRepo.update(updatedTransferTransaction.id, updatedTransferTransaction, tenantId);
  }

  for (const [accountId, delta] of deltas) {
    if (delta !== 0) {
      await accountRepo.updateAccountBalance(accountId, delta, tenantId);
    }
  }
};
