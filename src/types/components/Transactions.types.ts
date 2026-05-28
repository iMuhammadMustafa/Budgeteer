import { TransactionFilters } from "@/src/types/apis/TransactionFilters";
import { Account, TransactionCategory, TransactionsView } from "@/src/types/database/Tables.Types";

export type TransactionsPageHeaderProps = {
  selectedTransactions: TransactionsView[];
  selectedSum: number;
  openDeleteConfirm: () => void;
  openDuplicateConfirm: () => void;
  openBatchUpdate: () => void;
  onSplit: () => void;
  isActionLoading: boolean;
  clearSelection: () => void;
  refreshTransactions: () => void;
  setShowSearch: (value: boolean) => void;
};

export type TransactionSearchFormProps = {
  filters?: TransactionFilters | null;
  categories: TransactionCategory[];
  accounts: Account[];
  onClear: () => void;
  onSubmit: (filters: TransactionFilters | null) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export type GroupedData = {
  [date: string]: {
    amount: number;
    transactions: TransactionsView[];
  };
};
