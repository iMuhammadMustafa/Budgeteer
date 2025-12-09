import { TransactionType } from "../database/Tables.Types";
import { QueryFilters } from "./QueryFilters";

export interface TransactionFilters extends QueryFilters {
  name?: string;
  description?: string;

  amount?: number;

  accountid?: string;
  categoryid?: string;
  groupid?: string;

  type?: TransactionType;
  isVoid?: string;
  tags?: string[];
}

export const initialTransactionSearchParams: TransactionFilters = {
  offset: 0,
  limit: 20,
};
