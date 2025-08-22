import { TransactionType } from "../db/Tables.Types";

export interface QueryFilters {
  startDate?: string;
  endDate?: string;

  startIndex?: number;
  endIndex?: number;
}

export interface TransactionFilters extends QueryFilters {
  name?: string;
  description?: string;

  amount?: number;

  accountid?: string;
  categoryid?: string;

  type?: TransactionType;
  isVoid?: string;
  tags?: string[];
}

export const initalTransactionSearchParams: TransactionFilters = {
  startIndex: 0,
  endIndex: 20,
};
