import { TransactionType } from "../db/Tables.Types";

export interface QueryFilters {
  startDate?: string;
  endDate?: string;

  offset?: number;
  limit?: number;
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
  offset: 0,
  limit: 20,
};
