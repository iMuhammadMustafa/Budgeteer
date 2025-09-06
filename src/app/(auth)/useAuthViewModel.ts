import { router } from "expo-router";

import { useAuth } from "@/src/providers/AuthProvider";
import { WATERMELONDB_DEFAULTS } from "@/src/database/constants";
import { DEMO_TENANT_ID, DEMO_USER_ID, seedDemoData } from "@/src/database/demoSeed";
import { StorageMode } from "@/src/types/StorageMode";
import { useState } from "react";
import { Alert } from "react-native";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import supabase from "@/src/providers/Supabase";

export const initialUserState = {
  email: "",
  password: "",
};

export default function useAuthViewModel() {
  const { setSession, setIsDemoLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(initialUserState);
  const [selectedMode, setSelectedMode] = useState<StorageMode | null>(null);
  const { setStorageMode } = useStorageMode();

  // const { setDemo } = useDemoMode();

  const handleModeSelection = async (mode: StorageMode) => {
    if (mode === StorageMode.Cloud) {
      setSelectedMode(StorageMode.Cloud);
      return;
    }

    setLoading(true);

    try {
      console.log(`Initializing ${mode} mode...`);

      await setStorageMode(mode);

      if (mode === StorageMode.Demo) {
        await handleDemoSession();
      } else if (mode === StorageMode.Local) {
        await handleLocalSession();
      }

      console.log(`Successfully initialized ${mode} mode`);
      router.replace("/(drawer)/(tabs)/Dashboard");
    } catch (error) {
      console.error(`Failed to initialize ${mode} mode:`, error);

      let errorMessage = `Failed to initialize ${mode} mode`;

      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes("IndexedDB")) {
          errorMessage =
            "Local storage is not supported in this browser. Please try a different browser or use demo mode.";
        } else if (error.message.includes("SQLite")) {
          errorMessage = "Local storage is not available on this device. Please try demo mode instead.";
        } else if (error.message.includes("Network")) {
          errorMessage =
            "Network connection required for cloud mode. Please check your connection or try local/demo mode.";
        } else {
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      }

      Alert.alert("Storage Initialization Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSession = async () => {
    try {
      // Set demo session with demo tenant ID
      await setSession({
        user: {
          id: DEMO_USER_ID,
          email: "demo@demo.com",
          user_metadata: {
            tenantid: DEMO_TENANT_ID,
            full_name: "Demo User",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        },
        access_token: "demo-access-token",
        refresh_token: "demo-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
      });

      // Seed demo data
      const timestamp = new Date().toISOString();
      console.log(`[AUTH ${timestamp}] Demo mode activation initiated - seeding demo data...`);
      await seedDemoData();
      console.log(`[AUTH ${timestamp}] Demo data seeded successfully`);

      // Set demo loaded flag
      setIsDemoLoaded(true);
      console.log(`[AUTH ${timestamp}] Demo mode activated successfully`);
    } catch (error) {
      console.error("Failed to initialize demo session:", error);
      throw new Error(`Demo seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  const handleLocalSession = async () => {
    await setSession({
      user: {
        id: WATERMELONDB_DEFAULTS.userId,
        email: "local@local.com",
        user_metadata: {
          tenantid: WATERMELONDB_DEFAULTS.tenantId,
          full_name: "Local User",
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      },
      access_token: "local-access-token",
      refresh_token: "local-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
    });
  };

  const handleBackToModeSelection = () => {
    setSelectedMode(null);
    setUser(initialUserState);
  };
  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: user?.password,
    });

    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }

    // Set cloud mode and navigate
    await setStorageMode(StorageMode.Cloud);
    // setDemo(false);
    setLoading(false);
    router.replace("/(drawer)/Accounts");
  };
  const isValid = !!(user.email && user.password && !loading);

  const onTextChange = (field: "email" | "password", value: string) => {
    setUser((u: any) => ({ ...u, [field]: value }));
  };

  return {
    handleModeSelection,
    handleBackToModeSelection,
    signInWithEmail,
    loading,
    user,
    selectedMode,
    onTextChange,
    isValid,
  };
}
