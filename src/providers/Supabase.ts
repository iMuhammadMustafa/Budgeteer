import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
// import { Database } from "@/src/types/db/database.types";

const supaUrl = process.env.EXPO_PUBLIC_SUPA_URL as string;
const supaKey = process.env.EXPO_PUBLIC_SUPA_KEY as string;

const supabase = createClient(supaUrl, supaKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
