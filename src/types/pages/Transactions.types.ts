import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Account, TransactionCategory, TransactionsView } from "@/src/types/db/Tables.Types";

export type TransactionsPageHeaderProps = {
  selectedTransactions: TransactionsView[];
  selectedSum: number;
  deleteSelection: () => void;
  copyTransactions: () => void;
  clearSelection: () => void;
  refreshTransactions: () => void;
  showSearch: boolean;
  setShowSearch: (value: boolean) => void;
};

export type TransactionSearchFormProps = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  searchParams: TransactionFilters | null;
  accounts: Account[];
  categories: TransactionCategory[];
  onSubmit: (filters: TransactionFilters | null) => void;
  onClear: () => void;
};

export type GroupedData = {
  [date: string]: {
    amount: number;
    transactions: TransactionsView[];
  };
};
