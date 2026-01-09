import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
import { storage } from "../utils/storageUtils";
// import { Database } from "@/src/types/database/database.types";

const supaUrl = process.env.EXPO_PUBLIC_SUPA_URL as string;
const supaKey = process.env.EXPO_PUBLIC_SUPA_KEY as string;

const supabase = createClient(supaUrl, supaKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const getCloudClient = () => supabase;
export type SupabaseClient = typeof supabase;

export default supabase;
