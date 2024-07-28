export interface Account {
  id: string; // uuid
  name: string;
  currency: string;
  owner_id: string; // uuid
  type?: string;
  open_date?: string; // ISO date string
  open_balance?: number;
  current_balance?: number;
  created_by: string; // uuid
  updated_by?: string; // uuid
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}

export interface ProfileAccount {
  id: string; // uuid
  profile_id: string; // uuid
  account_id: string; // uuid
  access_type?: string;
}
