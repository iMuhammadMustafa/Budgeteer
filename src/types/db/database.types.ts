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
      configruations: {
        Row: {
          createdat: string
          createdby: string | null
          id: string
          isdeleted: boolean
          key: string
          Table: string
          tenantid: string | null
          Type: string
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
          Table: string
          tenantid?: string | null
          Type: string
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
          Table?: string
          tenantid?: string | null
          Type?: string
          updatedat?: string | null
          updatedby?: string | null
          value?: string
        }
        Relationships: []
      }
      configurations: {
        Row: {
          createdat: string
          createdby: string | null
          id: string
          isdeleted: boolean
          key: string
          Table: string
          tenantid: string | null
          Type: string
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
          Table: string
          tenantid?: string | null
          Type: string
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
          Table?: string
          tenantid?: string | null
          Type?: string
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
          updatedat?: string | null
          updatedby?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactioncategories_groupid_fkey"
            columns: ["groupid"]
            isOneToOne: false
            referencedRelation: "transactiongroups"
            referencedColumns: ["id"]
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
          name: string
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
          date?: string
          description?: string | null
          id?: string
          isdeleted?: boolean
          isvoid?: boolean
          name: string
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
          name?: string
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
        ]
      }
      stats_monthlycategoriestransactions: {
        Row: {
          categorybudgetamount: number | null
          categorybudgetfrequency: string | null
          categorycolor: string | null
          categorydisplayorder: number | null
          categoryicon: string | null
          categoryname: string | null
          date: string | null
          groupbudgetamount: number | null
          groupbudgetfrequency: string | null
          groupcolor: string | null
          groupdisplayorder: number | null
          groupicon: string | null
          groupname: string | null
          sum: number | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
        }
        Relationships: []
      }
      stats_monthlytransactionstypes: {
        Row: {
          date: string | null
          sum: number | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
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
          currency: string | null
          date: string | null
          icon: string | null
          id: string | null
          isvoid: boolean | null
          name: string | null
          payee: string | null
          runningbalance: number | null
          transferaccountid: string | null
          transferid: string | null
          type: Database["public"]["Enums"]["transactiontypes"] | null
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
    Functions: {
      updateaccountbalance:
        | {
            Args: {
              accountid: number
              amount: number
            }
            Returns: number
          }
        | {
            Args: {
              accountid: string
              amount: number
            }
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
