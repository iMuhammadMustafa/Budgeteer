import dayjs from "dayjs";
import { Inserts, TransactionsView } from "../types/db/Tables.Types";
import { GroupedData } from "../types/pages/Transactions.types";
import { TableNames } from "../types/db/TableNames";
import { TransactionFilters } from "../types/apis/TransactionFilters";

export const getTransactionProp = (type: string | null) => {
  const transactionProp = { iconName: "CircleHelp", color: "error-100", textColor: "foreground", size: 20 };
  if (type === "Income") {
    transactionProp.iconName = "Plus";
    transactionProp.color = "success-100";
    transactionProp.textColor = "success-500";
  } else if (type === "Expense") {
    transactionProp.iconName = "Minus";
    transactionProp.color = "error-100";
    transactionProp.textColor = "error-500";
  } else if (type === "Transfer") {
    transactionProp.iconName = "ArrowLeftRight";
    transactionProp.color = "info-100";
    transactionProp.textColor = "info-500";
  } else if (type === "Adjustment" || type === "Refund") {
    transactionProp.iconName = "Wrench";
    transactionProp.color = "warning-100";
    transactionProp.textColor = "warning-500";
  } else if (type === "Initial") {
    transactionProp.iconName = "Wallet";
    transactionProp.color = "info-100";
    transactionProp.textColor = "info-500";
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
      acc[date].amount += curr.amount ?? 0;
      acc[date].transactions.push(curr);
      return acc;
    }, {});
};

export const duplicateTransaction = (item: TransactionsView) => {
  const newTransaction: Inserts<TableNames.Transactions> = {
    amount: item.amount ?? 0,
    type: item.type!,

    name: item.name as string,
    date: new Date().toISOString(),
    payee: item.payee,
    // description: "Duplicated Transaction",
    // notes: item.notes as string,
    isvoid: item.isvoid as boolean,
    // tags: item.tags,

    accountid: item.accountid!,
    categoryid: item.categoryid!,

    createdat: new Date().toISOString(),
    isdeleted: false,
    // tenantid: item.tenantid as string,
    // transferaccountid: item.transferaccountid
    // transferid: item.transferid
  };

  return newTransaction;
};

export const initialSearchFilters: TransactionFilters = {
  startIndex: 0,
  endIndex: 10,
};
