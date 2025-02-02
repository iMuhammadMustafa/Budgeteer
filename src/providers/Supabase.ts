import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Database } from "@/src/types/database.types";

// TODO: Replace with your own Supabase URL and Anon Key
// const supaUrl = process.env.EXPO_PUBLIC_SUPA_URL as string;
// const supaKey = process.env.EXPO_PUBLIC_SUPA_ANON_KEY as string;
const supabaseUrl = "https://eqevunpprealeqzqpgbc.supabase.co";
const supabaseAnonKey = "qEW8Y9XZCmGifGZQMsu1v5Uhf2N8+rM1iIlL/yuwNjxToZaJ4ht+JEqx3L6ha/5loyF5rJxtBDeP9Xs9iosvBA==";

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
