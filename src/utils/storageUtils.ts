import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

function isLocalStorageAvailable() {
  try {
    return (
      typeof localStorage !== "undefined" &&
      typeof localStorage.getItem === "function"
    );
  } catch {
    return false;
  }
}

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web" && isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
    if (Platform.OS === "web") {
      return null;
    }
    return await AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web" && isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web" && isLocalStorageAvailable()) {
      localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },
};
