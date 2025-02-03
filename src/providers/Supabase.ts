import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Database } from "@/src/types/db/database.types";

// TODO: Replace with your own Supabase URL and Anon Key
// const supaUrl = process.env.EXPO_PUBLIC_SUPA_URL as string;
// const supaKey = process.env.EXPO_PUBLIC_SUPA_ANON_KEY as string;
const supabaseUrl = "https://eqevunpprealeqzqpgbc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZXZ1bnBwcmVhbGVxenFwZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MDI1MzIsImV4cCI6MjA1Mzk3ODUzMn0.V8pG9SKCs0T9SGoTx_8Ynop2IQ_cQE3tK7Bj6xjCw30";

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
