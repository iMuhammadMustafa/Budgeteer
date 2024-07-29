export interface Transaction {
  id: string; // uuid
  name: string;
  date: string; // ISO timestamp string
  label?: string;
  notes?: string;
  currency?: string;
  account_id: string; // uuid
  category_id: string; // uuid
  amount: number;
  created_by: string; // uuid
  updated_by?: string; // uuid
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}
export interface TransactionTag {
  id: string; // uuid
  transaction_id: string; // uuid
  tag_id: string; // uuid
}
