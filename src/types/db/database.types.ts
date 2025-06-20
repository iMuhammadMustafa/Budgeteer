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
      accountcategories: {
        Row: {
          color: string
          createdat: string
          createdby: string | null
          displayorder: number
          icon: string
          id: string
          isdeleted: boolean
          name: string
          tenantid: string
          type: Database["public"]["Enums"]["accounttypes"]
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          color?: string
          createdat?: string
          createdby?: string | null
          displayorder?: number
          icon?: string
          id?: string
          isdeleted?: boolean
          name: string
          tenantid?: string
          type?: Database["public"]["Enums"]["accounttypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          color?: string
          createdat?: string
          createdby?: string | null
          displayorder?: number
          icon?: string
          id?: string
          isdeleted?: boolean
          name?: string
          tenantid?: string
          type?: Database["public"]["Enums"]["accounttypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: []
      }
      accounts: {
        Row: {
          balance: number
          categoryid: string
          color: string
          createdat: string
          createdby: string | null
          currency: string
          description: string | null
          displayorder: number
          icon: string
          id: string
          isdeleted: boolean
          name: string
          notes: string | null
          owner: string | null
          tenantid: string
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          balance?: number
          categoryid: string
          color?: string
          createdat?: string
          createdby?: string | null
          currency?: string
          description?: string | null
          displayorder?: number
          icon?: string
          id?: string
          isdeleted?: boolean
          name: string
          notes?: string | null
          owner?: string | null
          tenantid?: string
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          balance?: number
          categoryid?: string
          color?: string
          createdat?: string
          createdby?: string | null
          currency?: string
          description?: string | null
          displayorder?: number
          icon?: string
          id?: string
          isdeleted?: boolean
          name?: string
          notes?: string | null
          owner?: string | null
          tenantid?: string
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "accountcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      configurations: {
        Row: {
          createdat: string
          createdby: string | null
          id: string
          isdeleted: boolean
          key: string
          table: string
          tenantid: string | null
          type: string
          updatedat: string | null
          updatedby: string | null
          value: string
        }
        Insert: {
          createdat?: string
          createdby?: string | null
          id?: string
          isdeleted?: boolean
          key: string
          table: string
          tenantid?: string | null
          type: string
          updatedat?: string | null
          updatedby?: string | null
          value: string
        }
        Update: {
          createdat?: string
          createdby?: string | null
          id?: string
          isdeleted?: boolean
          key?: string
          table?: string
          tenantid?: string | null
          type?: string
          updatedat?: string | null
          updatedby?: string | null
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          tenantid: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          tenantid?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          tenantid?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reminders: {
        Row: {
          amount: number
          categoryid: string | null
          createdat: string | null
          createdby: string | null
          currencycode: string
          description: string | null
          enddate: string | null
          id: string
          isactive: boolean | null
          isdeleted: boolean | null
          lastexecutedat: string | null
          name: string
          nextoccurrencedate: string
          notes: string | null
          payeename: string | null
          recurrencerule: string
          sourceaccountid: string
          tenantid: string
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          amount: number
          categoryid?: string | null
          createdat?: string | null
          createdby?: string | null
          currencycode?: string
          description?: string | null
          enddate?: string | null
          id?: string
          isactive?: boolean | null
          isdeleted?: boolean | null
          lastexecutedat?: string | null
          name: string
          nextoccurrencedate: string
          notes?: string | null
          payeename?: string | null
          recurrencerule: string
          sourceaccountid: string
          tenantid: string
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          amount?: number
          categoryid?: string | null
          createdat?: string | null
          createdby?: string | null
          currencycode?: string
          description?: string | null
          enddate?: string | null
          id?: string
          isactive?: boolean | null
          isdeleted?: boolean | null
          lastexecutedat?: string | null
          name?: string
          nextoccurrencedate?: string
          notes?: string | null
          payeename?: string | null
          recurrencerule?: string
          sourceaccountid?: string
          tenantid?: string
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_category_id_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "stats_monthlycategoriestransactions"
            referencedColumns: ["categoryid"]
          },
          {
            foreignKeyName: "reminders_category_id_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "transactioncategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_category_id_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["categoryid"]
          },
          {
            foreignKeyName: "reminders_source_account_id_fkey"
            columns: ["sourceaccountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_source_account_id_fkey"
            columns: ["sourceaccountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "reminders_source_account_id_fkey"
            columns: ["sourceaccountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      transactioncategories: {
        Row: {
          budgetamount: number
          budgetfrequency: string
          color: string
          createdat: string
          createdby: string | null
          description: string | null
          displayorder: number
          groupid: string
          icon: string
          id: string
          isdeleted: boolean
          name: string | null
          tenantid: string
          type: Database["public"]["Enums"]["transactiontypes"]
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          budgetamount?: number
          budgetfrequency?: string
          color?: string
          createdat?: string
          createdby?: string | null
          description?: string | null
          displayorder?: number
          groupid: string
          icon?: string
          id?: string
          isdeleted?: boolean
          name?: string | null
          tenantid: string
          type?: Database["public"]["Enums"]["transactiontypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          budgetamount?: number
          budgetfrequency?: string
          color?: string
          createdat?: string
          createdby?: string | null
          description?: string | null
          displayorder?: number
          groupid?: string
          icon?: string
          id?: string
          isdeleted?: boolean
          name?: string | null
          tenantid?: string
          type?: Database["public"]["Enums"]["transactiontypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactioncategories_groupid_fkey"
            columns: ["groupid"]
            isOneToOne: false
            referencedRelation: "stats_monthlycategoriestransactions"
            referencedColumns: ["groupid"]
          },
          {
            foreignKeyName: "transactioncategories_groupid_fkey"
            columns: ["groupid"]
            isOneToOne: false
            referencedRelation: "transactiongroups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactioncategories_groupid_fkey"
            columns: ["groupid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["groupid"]
          },
        ]
      }
      transactiongroups: {
        Row: {
          budgetamount: number
          budgetfrequency: string
          color: string
          createdat: string
          createdby: string | null
          description: string | null
          displayorder: number
          icon: string
          id: string
          isdeleted: boolean
          name: string
          tenantid: string
          type: Database["public"]["Enums"]["transactiontypes"]
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          budgetamount?: number
          budgetfrequency?: string
          color?: string
          createdat?: string
          createdby?: string | null
          description?: string | null
          displayorder?: number
          icon?: string
          id?: string
          isdeleted?: boolean
          name: string
          tenantid?: string
          type?: Database["public"]["Enums"]["transactiontypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          budgetamount?: number
          budgetfrequency?: string
          color?: string
          createdat?: string
          createdby?: string | null
          description?: string | null
          displayorder?: number
          icon?: string
          id?: string
          isdeleted?: boolean
          name?: string
          tenantid?: string
          type?: Database["public"]["Enums"]["transactiontypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          accountid: string
          amount: number
          categoryid: string
          createdat: string
          createdby: string | null
          date: string
          description: string | null
          id: string
          isdeleted: boolean
          isvoid: boolean
          name: string | null
          notes: string | null
          payee: string | null
          tags: string[] | null
          tenantid: string
          transferaccountid: string | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontypes"]
          updatedat: string | null
          updatedby: string | null
        }
        Insert: {
          accountid: string
          amount?: number
          categoryid: string
          createdat?: string
          createdby?: string | null
          date: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          isvoid?: boolean
          name?: string | null
          notes?: string | null
          payee?: string | null
          tags?: string[] | null
          tenantid?: string
          transferaccountid?: string | null
          transferid?: string | null
          type?: Database["public"]["Enums"]["transactiontypes"]
          updatedat?: string | null
          updatedby?: string | null
        }
        Update: {
          accountid?: string
          amount?: number
          categoryid?: string
          createdat?: string
          createdby?: string | null
          date?: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          isvoid?: boolean
          name?: string | null
          notes?: string | null
          payee?: string | null
          tags?: string[] | null
          tenantid?: string
          transferaccountid?: string | null
          transferid?: string | null
          type?: Database["public"]["Enums"]["transactiontypes"]
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
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "stats_monthlycategoriestransactions"
            referencedColumns: ["categoryid"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "transactioncategories"
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
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
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
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      search_distincttransactions: {
        Row: {
          accountid: string | null
          amount: number | null
          categoryid: string | null
          description: string | null
          isvoid: boolean | null
          name: string | null
          notes: string | null
          payee: string | null
          tenantid: string | null
          transferaccountid: string | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
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
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "stats_monthlycategoriestransactions"
            referencedColumns: ["categoryid"]
          },
          {
            foreignKeyName: "transactions_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "transactioncategories"
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
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
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
            referencedColumns: ["id"]
          },
        ]
      }
      stats_dailytransactions: {
        Row: {
          date: string | null
          sum: number | null
          tenantid: string | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
        }
        Relationships: []
      }
      stats_monthlyaccountstransactions: {
        Row: {
          account: string | null
          accountid: string | null
          date: string | null
          sum: number | null
          tenantid: string | null
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
            foreignKeyName: "transactions_accountid_fkey"
            columns: ["accountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      stats_monthlycategoriestransactions: {
        Row: {
          categorybudgetamount: number | null
          categorybudgetfrequency: string | null
          categorycolor: string | null
          categorydisplayorder: number | null
          categoryicon: string | null
          categoryid: string | null
          categoryname: string | null
          date: string | null
          groupbudgetamount: number | null
          groupbudgetfrequency: string | null
          groupcolor: string | null
          groupdisplayorder: number | null
          groupicon: string | null
          groupid: string | null
          groupname: string | null
          sum: number | null
          tenantid: string | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
        }
        Relationships: []
      }
      stats_monthlytransactionstypes: {
        Row: {
          date: string | null
          sum: number | null
          tenantid: string | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
        }
        Relationships: []
      }
      stats_networthgrowth: {
        Row: {
          month: string | null
          tenantid: string | null
          total_net_worth: number | null
        }
        Relationships: []
      }
      stats_totalaccountbalance: {
        Row: {
          tenantid: string | null
          totalbalance: number | null
        }
        Relationships: []
      }
      transactionsview: {
        Row: {
          accountid: string | null
          accountname: string | null
          amount: number | null
          balance: number | null
          categoryid: string | null
          categoryname: string | null
          createdat: string | null
          currency: string | null
          date: string | null
          groupicon: string | null
          groupid: string | null
          groupname: string | null
          icon: string | null
          id: string | null
          isvoid: boolean | null
          name: string | null
          payee: string | null
          runningbalance: number | null
          tenantid: string | null
          transferaccountid: string | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
          updatedat: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "transactionsview"
            referencedColumns: ["accountid"]
          },
          {
            foreignKeyName: "transactions_transferaccountid_fkey"
            columns: ["transferaccountid"]
            isOneToOne: false
            referencedRelation: "view_accounts_with_running_balance"
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
            referencedColumns: ["id"]
          },
        ]
      }
      view_accounts_with_running_balance: {
        Row: {
          balance: number | null
          categoryid: string | null
          color: string | null
          createdat: string | null
          createdby: string | null
          currency: string | null
          description: string | null
          displayorder: number | null
          icon: string | null
          id: string | null
          isdeleted: boolean | null
          name: string | null
          notes: string | null
          owner: string | null
          running_balance: number | null
          tenantid: string | null
          updatedat: string | null
          updatedby: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "accountcategories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_monthly_net_worth: {
        Args: { p_start_date: string; p_end_date: string }
        Returns: {
          month_label: string
          balance: number
        }[]
      }
      updateaccountbalance: {
        Args: { accountid: string; amount: number }
        Returns: number
      }
      uuid_generate_v7: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      accounttypes: "Asset" | "Liability"
      transactionstatuses: "Clear" | "Void"
      transactiontypes:
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accounttypes: ["Asset", "Liability"],
      transactionstatuses: ["Clear", "Void"],
      transactiontypes: [
        "Expense",
        "Income",
        "Transfer",
        "Adjustment",
        "Initial",
        "Refund",
      ],
    },
  },
} as const
