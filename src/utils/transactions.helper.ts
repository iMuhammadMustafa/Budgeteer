import dayjs from "dayjs";
import { TransactionFilters } from "../types/apis/TransactionFilters";
import { GroupedData } from "../types/components/Transactions.types";
import { TableNames } from "../types/database/TableNames";
import { Inserts, TransactionsView } from "../types/database/Tables.Types";

export const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "danger-soft", textColor: "ink", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "income-soft";
    transactionProp.textColor = "income";
  } else if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "expense-soft";
    transactionProp.textColor = "expense";
  } else if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "transfer-soft";
    transactionProp.textColor = "transfer";
  } else if (type === "Adjustment" || type === "Refund") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "warning-soft";
    transactionProp.textColor = "warning";
  } else if (type === "Initial") {
    transactionProp.iconName = "Wallet";
    transactionProp.color = "info-soft";
    transactionProp.textColor = "info";
  }
  return transactionProp;
};

export const groupTransactions = (transactions: TransactionsView[]) => {
  return transactions
    .sort((b, a) => dayjs(a.date).diff(dayjs(b.date)))
    .reduce((acc: GroupedData, curr) => {
      const date = dayjs(curr.date).format("ddd, DD MMM YYYY");
      if (!acc[date]) {
        acc[date] = {
          amount: 0,
          transactions: [],
        };
      }
      if (!curr.isvoid) {
        acc[date].amount += curr.amount ?? 0;
      }
      acc[date].transactions.push(curr);
      return acc;
    }, {});
};

export const duplicateTransaction = (item: TransactionsView) => {
  const newTransaction: Inserts<TableNames.Transactions> = {
    amount: item.amount ?? 0,
    type: item.type!,

    name: item.name as string,
    date: dayjs().format("YYYY-MM-DDTHH:mm:ss"),
    payee: item.payee,
    // description: "Duplicated Transaction",
    // notes: item.notes as string,
    isvoid: item.isvoid as boolean,
    // tags: item.tags,

    accountid: item.accountid!,
    categoryid: item.categoryid!,
    // Carry the transfer's destination so the create path recreates BOTH legs.
    // We intentionally do NOT copy `transferid`: createTransactionHelper mints a
    // fresh pair id for the duplicate (copying it would link the duplicate to the
    // original's mirror leg). Omitting `transferaccountid` here produced an
    // orphaned single-leg transfer.
    transferaccountid: item.transferaccountid,

    createdat: dayjs().format("YYYY-MM-DDTHH:mm:ssZ"),
    isdeleted: false,
    // tenantid: item.tenantid as string,
    // transferid: item.transferid
  };

  return newTransaction;
};

export const initialSearchFilters: TransactionFilters = {
  offset: 0,
  limit: 10,
};
