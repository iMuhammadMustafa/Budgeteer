import { TransactionType } from "../db/Tables.Types";

export type TransactionFilters = {
  name?: string;
  description?: string;

  amount?: number;

  startDate?: string;
  endDate?: string;

  accountid?: string;
  categoryid?: string;

  type?: TransactionType;
  isVoid?: string;
  tags?: string[];

  startIndex?: number;
  endIndex?: number;
};

export const initalTransactionSearchParams: TransactionFilters = {
  startIndex: 0,
  endIndex: 20,
};
