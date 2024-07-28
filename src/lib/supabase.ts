import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store"; //TODO: Throwing a warning about size
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

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

const supabaseUrl = "https://syeltrexylnsbzfitxjp.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZWx0cmV4eWxuc2J6Zml0eGpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIwMDAzMzUsImV4cCI6MjAzNzU3NjMzNX0.Nx3p_HW6R07L-Fld9Dl3KgeEHZfGt6YlQOyYaF0UNCA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new SupabaseStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
