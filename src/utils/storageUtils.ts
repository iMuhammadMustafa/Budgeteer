import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage utility that works on both web and mobile
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};

// Storage keys
export const STORAGE_KEYS = {
  LOCAL_SESSION: "budgeteer-local-session",
  STORAGE_MODE: "budgeteer-storage-mode",
} as const;