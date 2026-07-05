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
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
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

/**
 * Flattened row model for the single virtualized Transactions list.
 * `header` rows carry the day label + day total; `transaction` rows carry the
 * transaction and (for transfers) its pre-resolved paired counterpart.
 */
export type TransactionListRow =
  | { kind: "header"; key: string; day: string; amount: number } // key `d:${day}`
  | {
      kind: "transaction";
      key: string; // key `t:${id}`
      transaction: TransactionsView;
      transferTransaction?: TransactionsView;
    };
