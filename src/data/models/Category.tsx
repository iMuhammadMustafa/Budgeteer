export interface Category {
  id: string; // uuid
  name: string;
  icon?: string;
  created_by: string; // uuid
  updated_by?: string; // uuid
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}

export interface Tag {
  id: string; // uuid
  name: string;
  icon?: string;
  created_by: string; // uuid
  updated_by?: string; // uuid
  created_at?: string; // ISO timestamp string
  updated_at?: string; // ISO timestamp string
}
