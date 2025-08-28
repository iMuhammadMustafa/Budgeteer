// // Enhanced database types that extend the base database types with new recurring transaction fields
// // This file provides type-safe access to enhanced recurring transaction fields

// import { RecurringType } from "../enums/recurring";
// import { Database } from "./database.types";

// // Enhanced Supabase types that include new recurring transaction fields
// export interface EnhancedDatabase extends Database {
//   public: Database["public"] & {
//     Tables: Database["public"]["Tables"] & {
//       recurrings: {
//         Row: Database["public"]["Tables"]["recurrings"]["Row"] & {
//           interval_months: number;
//           auto_apply_enabled: boolean;
//           transfer_account_id: string | null;
//           is_amount_flexible: boolean;
//           is_date_flexible: boolean;
//           recurring_type: RecurringType;
//           last_auto_applied_at: string | null;
//           failed_attempts: number;
//           max_failed_attempts: number;
//         };
//         Insert: Database["public"]["Tables"]["recurrings"]["Insert"] & {
//           interval_months?: number;
//           auto_apply_enabled?: boolean;
//           transfer_account_id?: string | null;
//           is_amount_flexible?: boolean;
//           is_date_flexible?: boolean;
//           recurring_type?: RecurringType;
//           last_auto_applied_at?: string | null;
//           failed_attempts?: number;
//           max_failed_attempts?: number;
//         };
//         Update: Database["public"]["Tables"]["recurrings"]["Update"] & {
//           interval_months?: number;
//           auto_apply_enabled?: boolean;
//           transfer_account_id?: string | null;
//           is_amount_flexible?: boolean;
//           is_date_flexible?: boolean;
//           recurring_type?: RecurringType;
//           last_auto_applied_at?: string | null;
//           failed_attempts?: number;
//           max_failed_attempts?: number;
//         };
//         Relationships: Database["public"]["Tables"]["recurrings"]["Relationships"] &
//           [
//             {
//               foreignKeyName: "recurrings_transfer_account_id_fkey";
//               columns: ["transfer_account_id"];
//               isOneToOne: false;
//               referencedRelation: "accounts";
//               referencedColumns: ["id"];
//             },
//           ];
//       };
//     };
//     Enums: Database["public"]["Enums"] & {
//       recurringtypes: RecurringType;
//     };
//   };
// }

// // Enhanced table type helpers
// export type EnhancedTables<T extends keyof EnhancedDatabase["public"]["Tables"]> =
//   EnhancedDatabase["public"]["Tables"][T]["Row"];

// export type EnhancedInserts<T extends keyof EnhancedDatabase["public"]["Tables"]> =
//   EnhancedDatabase["public"]["Tables"][T]["Insert"];

// export type EnhancedUpdates<T extends keyof EnhancedDatabase["public"]["Tables"]> =
//   EnhancedDatabase["public"]["Tables"][T]["Update"];

// export type EnhancedEnums<T extends keyof EnhancedDatabase["public"]["Enums"]> = EnhancedDatabase["public"]["Enums"][T];

// // Enhanced recurring transaction types
// export type EnhancedRecurringRow = EnhancedTables<"recurrings">;
// export type EnhancedRecurringInsert = EnhancedInserts<"recurrings">;
// export type EnhancedRecurringUpdate = EnhancedUpdates<"recurrings">;

// // Type guards for enhanced recurring transactions
// export const isEnhancedRecurring = (recurring: any): recurring is EnhancedRecurringRow => {
//   return (
//     recurring &&
//     typeof recurring.interval_months === "number" &&
//     typeof recurring.auto_apply_enabled === "boolean" &&
//     typeof recurring.is_amount_flexible === "boolean" &&
//     typeof recurring.is_date_flexible === "boolean" &&
//     typeof recurring.recurring_type === "string" &&
//     typeof recurring.failed_attempts === "number" &&
//     typeof recurring.max_failed_attempts === "number"
//   );
// };

// // Utility type to convert between SQLite and Supabase field naming conventions
// export type SQLiteToSupabaseRecurring = {
//   intervalmonths: "interval_months";
//   autoapplyenabled: "auto_apply_enabled";
//   transferaccountid: "transfer_account_id";
//   isamountflexible: "is_amount_flexible";
//   isdateflexible: "is_date_flexible";
//   recurringtype: "recurring_type";
//   lastautoappliedat: "last_auto_applied_at";
//   failedattempts: "failed_attempts";
//   maxfailedattempts: "max_failed_attempts";
// };

// // Field mapping for conversion between SQLite and Supabase naming
// export const RECURRING_FIELD_MAPPING: SQLiteToSupabaseRecurring = {
//   intervalmonths: "interval_months",
//   autoapplyenabled: "auto_apply_enabled",
//   transferaccountid: "transfer_account_id",
//   isamountflexible: "is_amount_flexible",
//   isdateflexible: "is_date_flexible",
//   recurringtype: "recurring_type",
//   lastautoappliedat: "last_auto_applied_at",
//   failedattempts: "failed_attempts",
//   maxfailedattempts: "max_failed_attempts",
// };

// // Helper function to convert SQLite recurring to Supabase format
// export const convertSQLiteToSupabaseRecurring = (sqliteRecurring: any): Partial<EnhancedRecurringRow> => {
//   const converted: any = { ...sqliteRecurring };

//   Object.entries(RECURRING_FIELD_MAPPING).forEach(([sqliteField, supabaseField]) => {
//     if (sqliteField in converted) {
//       converted[supabaseField] = converted[sqliteField];
//       delete converted[sqliteField];
//     }
//   });

//   return converted;
// };

// // Helper function to convert Supabase recurring to SQLite format
// export const convertSupabaseToSQLiteRecurring = (supabaseRecurring: Partial<EnhancedRecurringRow>): any => {
//   const converted: any = { ...supabaseRecurring };

//   Object.entries(RECURRING_FIELD_MAPPING).forEach(([sqliteField, supabaseField]) => {
//     if (supabaseField in converted) {
//       converted[sqliteField] = converted[supabaseField];
//       delete converted[supabaseField];
//     }
//   });

//   return converted;
// };
