export type TransactionFilters = {
  name?: string;
  description?: string;

  amount?: string;

  startDate?: string;
  endDate?: string;

  accountid?: string;
  categoryid?: string;

  type?: string;
  isVoid?: boolean;
  tags?: string[];

  startIndex?: number;
  endIndex?: number;
};

export const initalTransactionSearchParams: TransactionFilters = {
  startIndex: 0,
  endIndex: 20,
};
