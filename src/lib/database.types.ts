export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          category: string;
          createdat: string;
          createdby: string;
          currency: string | null;
          currentbalance: number;
          id: string;
          isdeleted: boolean;
          name: string;
          notes: string | null;
          openbalance: number;
          tenantid: string | null;
          type: string;
          updatedat: string | null;
          updatedby: string | null;
        };
        Insert: {
          category: string;
          createdat?: string;
          createdby: string;
          currency?: string | null;
          currentbalance: number;
          id: string;
          isdeleted?: boolean;
          name: string;
          notes?: string | null;
          openbalance: number;
          tenantid?: string | null;
          type: string;
          updatedat?: string | null;
          updatedby?: string | null;
        };
        Update: {
          category?: string;
          createdat?: string;
          createdby?: string;
          currency?: string | null;
          currentbalance?: number;
          id?: string;
          isdeleted?: boolean;
          name?: string;
          notes?: string | null;
          openbalance?: number;
          tenantid?: string | null;
          type?: string;
          updatedat?: string | null;
          updatedby?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_createdby_fkey";
            columns: ["createdby"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          createdat: string;
          createdby: string;
          description: string | null;
          id: string;
          isdeleted: boolean;
          name: string;
          tenantid: string | null;
          type: string;
          updatedat: string | null;
          updatedby: string | null;
        };
        Insert: {
          createdat?: string;
          createdby: string;
          description?: string | null;
          id: string;
          isdeleted?: boolean;
          name: string;
          tenantid?: string | null;
          type: string;
          updatedat?: string | null;
          updatedby?: string | null;
        };
        Update: {
          createdat?: string;
          createdby?: string;
          description?: string | null;
          id?: string;
          isdeleted?: boolean;
          name?: string;
          tenantid?: string | null;
          type?: string;
          updatedat?: string | null;
          updatedby?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_createdby_fkey";
            columns: ["createdby"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          full_name: string | null;
          id: string;
          updated_at: string | null;
          username: string | null;
          website: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          accountid: string;
          amount: number;
          categoryid: string;
          createdat: string;
          createdby: string;
          date: string;
          destinationid: string | null;
          id: string;
          isdeleted: boolean;
          notes: string | null;
          tags: string[] | null;
          tenantid: string | null;
          updatedat: string | null;
          updatedby: string | null;
        };
        Insert: {
          accountid: string;
          amount: number;
          categoryid: string;
          createdat?: string;
          createdby: string;
          date: string;
          destinationid?: string | null;
          id: string;
          isdeleted?: boolean;
          notes?: string | null;
          tags?: string[] | null;
          tenantid?: string | null;
          updatedat?: string | null;
          updatedby?: string | null;
        };
        Update: {
          accountid?: string;
          amount?: number;
          categoryid?: string;
          createdat?: string;
          createdby?: string;
          date?: string;
          destinationid?: string | null;
          id?: string;
          isdeleted?: boolean;
          notes?: string | null;
          tags?: string[] | null;
          tenantid?: string | null;
          updatedat?: string | null;
          updatedby?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_accountid_fkey";
            columns: ["accountid"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_createdby_fkey";
            columns: ["createdby"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_destinationid_fkey";
            columns: ["destinationid"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      useraccounts: {
        Row: {
          accesstype: string | null;
          accountid: string;
          createdat: string;
          createdby: string;
          id: string;
          isdeleted: boolean;
          tenantid: string | null;
          updatedat: string | null;
          updatedby: string | null;
          userid: string;
        };
        Insert: {
          accesstype?: string | null;
          accountid: string;
          createdat?: string;
          createdby: string;
          id: string;
          isdeleted?: boolean;
          tenantid?: string | null;
          updatedat?: string | null;
          updatedby?: string | null;
          userid: string;
        };
        Update: {
          accesstype?: string | null;
          accountid?: string;
          createdat?: string;
          createdby?: string;
          id?: string;
          isdeleted?: boolean;
          tenantid?: string | null;
          updatedat?: string | null;
          updatedby?: string | null;
          userid?: string;
        };
        Relationships: [
          {
            foreignKeyName: "useraccounts_accountid_fkey";
            columns: ["accountid"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "useraccounts_createdby_fkey";
            columns: ["createdby"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "useraccounts_userid_fkey";
            columns: ["userid"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;