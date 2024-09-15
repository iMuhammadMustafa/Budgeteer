export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          categoryid: string
          createdat: string
          createdby: string
          currency: string | null
          id: string
          isdeleted: boolean
          name: string
          notes: string | null
          tenantid: string | null
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          balance: number
          categoryid: string
          createdat?: string
          createdby: string
          currency?: string | null
          id?: string
          isdeleted?: boolean
          name: string
          notes?: string | null
          tenantid?: string | null
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          balance?: number
          categoryid?: string
          createdat?: string
          createdby?: string
          currency?: string | null
          id?: string
          isdeleted?: boolean
          name?: string
          notes?: string | null
          tenantid?: string | null
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "accountscategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_createdby_fkey"
            columns: ["createdby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      accountscategories: {
        Row: {
          createdat: string
          createdby: string
          id: string
          isdeleted: boolean
          name: string | null
          tenantid: string | null
          type: Database["public"]["Enums"]["accountcategorytype"] | null
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          createdat?: string
          createdby: string
          id?: string
          isdeleted?: boolean
          name?: string | null
          tenantid?: string | null
          type?: Database["public"]["Enums"]["accountcategorytype"] | null
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          createdat?: string
          createdby?: string
          id?: string
          isdeleted?: boolean
          name?: string | null
          tenantid?: string | null
          type?: Database["public"]["Enums"]["accountcategorytype"] | null
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accountcategory_createdby_fkey"
            columns: ["createdby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountcategory_updatedby_fkey"
            columns: ["updatedby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          createdat: string
          createdby: string
          description: string | null
          group: string
          icon: string | null
          id: string
          isdeleted: boolean
          name: string
          tenantid: string | null
          type: Database["public"]["Enums"]["transactiontype"]
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          createdat?: string
          createdby: string
          description?: string | null
          group: string
          icon?: string | null
          id?: string
          isdeleted?: boolean
          name: string
          tenantid?: string | null
          type?: Database["public"]["Enums"]["transactiontype"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          createdat?: string
          createdby?: string
          description?: string | null
          group?: string
          icon?: string | null
          id?: string
          isdeleted?: boolean
          name?: string
          tenantid?: string | null
          type?: Database["public"]["Enums"]["transactiontype"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_createdby_fkey"
            columns: ["createdby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations: {
        Row: {
          createdat: string
          createdby: string
          description: string | null
          id: string
          isdeleted: boolean
          tableelement: string
          tablename: string
          tenantid: string | null
          updatedat: string | null
          updatedby: string | null
          value: string
        }
        Insert: {
          createdat?: string
          createdby: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          tableelement: string
          tablename: string
          tenantid?: string | null
          updatedat?: string | null
          updatedby?: string | null
          value: string
        }
        Update: {
          createdat?: string
          createdby?: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          tableelement?: string
          tablename?: string
          tenantid?: string | null
          updatedat?: string | null
          updatedby?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "configurations_createdby_fkey"
            columns: ["createdby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          timezone: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          accountid: string
          amount: number
          categoryid: string | null
          createdat: string
          createdby: string
          date: string
          description: string | null
          id: string
          isdeleted: boolean
          notes: string | null
          status: Database["public"]["Enums"]["transactionstatuses"]
          tags: string[] | null
          tenantid: string | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontype"] | null
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          accountid: string
          amount: number
          categoryid?: string | null
          createdat?: string
          createdby: string
          date: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["transactionstatuses"]
          tags?: string[] | null
          tenantid?: string | null
          transferid?: string | null
          type?: Database["public"]["Enums"]["transactiontype"] | null
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          accountid?: string
          amount?: number
          categoryid?: string | null
          createdat?: string
          createdby?: string
          date?: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["transactionstatuses"]
          tags?: string[] | null
          tenantid?: string | null
          transferid?: string | null
          type?: Database["public"]["Enums"]["transactiontype"] | null
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "monthlycategorytransactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["categoryid"]
          },
          {
            foreignKeyName: "transactions_createdby_fkey"
            columns: ["createdby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferid_fkey"
            columns: ["transferid"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferid_fkey"
            columns: ["transferid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["transactionid"]
          },
        ]
      }
      useraccounts: {
        Row: {
          accesstype: string | null
          accountid: string
          createdat: string
          createdby: string
          id: string
          isdeleted: boolean
          tenantid: string | null
          updatedat: string | null
          updatedby: string | null
          userid: string
        }
        Insert: {
          accesstype?: string | null
          accountid: string
          createdat?: string
          createdby: string
          id?: string
          isdeleted?: boolean
          tenantid?: string | null
          updatedat?: string | null
          updatedby?: string | null
          userid: string
        }
        Update: {
          accesstype?: string | null
          accountid?: string
          createdat?: string
          createdby?: string
          id?: string
          isdeleted?: boolean
          tenantid?: string | null
          updatedat?: string | null
          updatedby?: string | null
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "useraccounts_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "useraccounts_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "useraccounts_createdby_fkey"
            columns: ["createdby"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "useraccounts_userid_fkey"
            columns: ["userid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dailytransactions: {
        Row: {
          date: string | null
          sum: number | null
          type: Database["public"]["Enums"]["transactiontype"] | null
        }
        Relationships: []
      }
      hypopg_hidden_indexes: {
        Row: {
          am_name: unknown | null
          index_name: unknown | null
          indexrelid: unknown | null
          is_hypo: boolean | null
          schema_name: unknown | null
          table_name: unknown | null
        }
        Relationships: []
      }
      hypopg_list_indexes: {
        Row: {
          am_name: unknown | null
          index_name: string | null
          indexrelid: unknown | null
          schema_name: unknown | null
          table_name: unknown | null
        }
        Relationships: []
      }
      monthlycategorytransactions: {
        Row: {
          categorytype: Database["public"]["Enums"]["transactiontype"] | null
          date: string | null
          group: string | null
          id: string | null
          name: string | null
          sum: number | null
          type: Database["public"]["Enums"]["transactiontype"] | null
        }
        Relationships: []
      }
      transactiondistinct: {
        Row: {
          accountid: string | null
          amount: number | null
          categoryid: string | null
          description: string | null
          notes: string | null
          status: Database["public"]["Enums"]["transactionstatuses"] | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontype"] | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "monthlycategorytransactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["categoryid"]
          },
          {
            foreignKeyName: "transactions_transferid_fkey"
            columns: ["transferid"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferid_fkey"
            columns: ["transferid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["transactionid"]
          },
        ]
      }
      transactionsview: {
        Row: {
          accountid: string | null
          accountname: string | null
          amount: number | null
          balance: number | null
          categorygroup: string | null
          categoryid: string | null
          categoryname: string | null
          categorytype: Database["public"]["Enums"]["transactiontype"] | null
          currency: string | null
          date: string | null
          description: string | null
          icon: string | null
          notes: string | null
          running_balance: number | null
          status: Database["public"]["Enums"]["transactionstatuses"] | null
          tags: string[] | null
          transactionid: string | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontype"] | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_transferid_fkey"
            columns: ["transferid"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferid_fkey"
            columns: ["transferid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["transactionid"]
          },
        ]
      }
    }
    Functions: {
      hypopg: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      hypopg_create_index: {
        Args: {
          sql_order: string
        }
        Returns: Record<string, unknown>[]
      }
      hypopg_drop_index: {
        Args: {
          indexid: unknown
        }
        Returns: boolean
      }
      hypopg_get_indexdef: {
        Args: {
          indexid: unknown
        }
        Returns: string
      }
      hypopg_hidden_indexes: {
        Args: Record<PropertyKey, never>
        Returns: {
          indexid: unknown
        }[]
      }
      hypopg_hide_index: {
        Args: {
          indexid: unknown
        }
        Returns: boolean
      }
      hypopg_relation_size: {
        Args: {
          indexid: unknown
        }
        Returns: number
      }
      hypopg_reset: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      hypopg_reset_index: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      hypopg_unhide_all_indexes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      hypopg_unhide_index: {
        Args: {
          indexid: unknown
        }
        Returns: boolean
      }
      index_advisor: {
        Args: {
          query: string
        }
        Returns: {
          startup_cost_before: Json
          startup_cost_after: Json
          total_cost_before: Json
          total_cost_after: Json
          index_statements: string[]
          errors: string[]
        }[]
      }
    }
    Enums: {
      accountcategorytype: "Asset" | "Liability"
      categoryconfigurations: "Other" | "Accounts"
      transactionstatuses: "None" | "Cleared" | "Reconciled" | "Void"
      transactiontype:
        | "Expense"
        | "Income"
        | "Transfer"
        | "Adjustment"
        | "Initial"
        | "Refund"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
