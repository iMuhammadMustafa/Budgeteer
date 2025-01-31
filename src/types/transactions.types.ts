import { FunctionNames, TableNames, transactionsKeys, ViewNames } from "@/src/consts/TableNames";
import { MonthlyTransactions, TransactionsView } from "../lib/supabase";

export interface CategorizedTransactions {
  categories: {
    expenses: MonthlyTransactions[];
    income: MonthlyTransactions[];
  };
  groups: {
    expenses: Record<string, MonthlyTransactions[]>;
    income: Record<string, MonthlyTransactions[]>;
  };
}
export type TransactionFormType = TransactionsView & { amount: number };

export type TransactionsSearchParams = {
  startDate?: string;
  endDate?: string;
  accountid?: string;
  categoryid?: string;
  categoryName?: string;
  type?: string;
  status?: string;
  description?: string;
  tags?: string;
  amount?: string;
  startIndex: number;
  endIndex: number;
};
export const initalTransactionSearchParams: TransactionsSearchParams = {
  startIndex: 0,
  endIndex: 20,
};

export type GroupedData = {
  [date: string]: {
    amount: number;
    transactions: TransactionsView[];
  };
};
