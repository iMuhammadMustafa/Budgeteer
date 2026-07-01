import { TableNames } from "@/src/types/database/TableNames";

const TABLE_ICONS: Record<TableNames, string> = {
  [TableNames.AccountCategories]: "FolderOpen",
  [TableNames.Accounts]: "Landmark",
  [TableNames.TransactionGroups]: "Layers",
  [TableNames.TransactionCategories]: "Tag",
  [TableNames.Configurations]: "Settings",
  [TableNames.Recurrings]: "Repeat",
  [TableNames.SavingsBuckets]: "PiggyBank",
  [TableNames.Transactions]: "Receipt",
  [TableNames.TransactionItems]: "List",
};

export function getTableIcon(table: TableNames): string {
  return TABLE_ICONS[table] || "Database";
}

export function formatTableName(table: string): string {
  return table
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

export function formatViewName(view: string): string {
  return view
    .replace(/_/g, " ")
    .replace(/^./, str => str.toUpperCase())
    .replace(/stats /i, "Stats: ")
    .replace(/view /i, "");
}
