import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store"; //TODO: Throwing a warning about size
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { Database } from "./database.types";

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Updates<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Inserts<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export type Transaction = Tables<"transactions">;

export type Account = Tables<"accounts">;
export type Category = Tables<"categories">;
export type UserAccount = Tables<"useraccounts">;
export type Profile = Tables<"profiles">;
export type AccountsCategory = Tables<"accountscategories">;
export type TransactionTypes = Enums<"transactiontype">;
export type AccountCategoryTypes = Enums<"accountcategorytype">;

class SupabaseStorage {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") {
        return null;
      }
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  }
  async removeItem(key: string) {
    if (Platform.OS === "web") {
      return localStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  }
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      return localStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  }
}

//TODO
export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPA_URL as string,
  process.env.EXPO_PUBLIC_SUPA_ANON_KEY as string,
  {
    auth: {
      storage: new SupabaseStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
