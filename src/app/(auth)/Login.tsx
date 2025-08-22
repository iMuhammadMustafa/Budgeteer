import { useState } from "react";
import { Alert, SafeAreaView, Text, TextInput, Pressable, View } from "react-native";
import { Link, router } from "expo-router";
import supabase from "@/src/providers/Supabase";
import { useDemoMode } from "@/src/providers/DemoModeProvider";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { StorageMode } from "@/src/types/StorageMode";
import { WATERMELONDB_DEFAULTS } from "@/src/database/constants";

type LoginMode = {
  id: StorageMode;
  title: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
};

const LOGIN_MODES: LoginMode[] = [
  {
    id: StorageMode.Cloud,
    title: "Login with Username and Password",
    description: "Connect to cloud database with full sync",
    icon: "☁️",
    requiresAuth: true,
  },
  {
    id: StorageMode.Demo,
    title: "Demo Mode",
    description: "Try the app with sample data",
    icon: "🎮",
    requiresAuth: false,
  },
  {
    id: StorageMode.Local,
    title: "Local Mode",
    description: "Store data locally on your device",
    icon: "💾",
    requiresAuth: false,
  },
];

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(initialUserState);
  const [selectedMode, setSelectedMode] = useState<StorageMode | null>(null);
  // const { setDemo } = useDemoMode();
  const { setSession } = useAuth();
  const { setStorageMode } = useStorageMode();

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

  const handleModeSelection = async (mode: StorageMode) => {
    if (mode === StorageMode.Cloud) {
      setSelectedMode(StorageMode.Cloud);
      return;
    }

    setLoading(true);

    try {
      console.log(`Initializing ${mode} mode...`);

      // Set the storage mode with proper error handling
      await setStorageMode(mode);

      if (mode === StorageMode.Demo) {
        // Create demo session
        if (setSession) {
          await setSession({
            user: {
              id: WATERMELONDB_DEFAULTS.userId,
              email: "demo@demo.com",
              user_metadata: {
                tenantid: WATERMELONDB_DEFAULTS.tenantId,
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
        }
      } else if (mode === StorageMode.Local) {
        // Create local session
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

  const handleBackToModeSelection = () => {
    setSelectedMode(null);
    setUser(initialUserState);
  };

  const isValid = !!(user.email && user.password && !loading);

  // Show mode selection screen
  if (!selectedMode) {
    return (
      <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
        <Text className="text-foreground text-3xl font-bold mb-4 text-center">Welcome to Budgeteer</Text>
        <Text className="text-foreground text-lg mb-8 text-center opacity-70">
          Choose how you'd like to use the app
        </Text>

        <View className="space-y-4">
          {LOGIN_MODES.map(mode => (
            <Pressable
              key={mode.id}
              className="p-6 border border-primary rounded-lg bg-white shadow-sm"
              onPress={() => handleModeSelection(mode.id)}
              disabled={loading}
            >
              <View className="flex-row items-center mb-2">
                <Text className="text-2xl mr-3">{mode.icon}</Text>
                <Text className="text-foreground text-xl font-semibold flex-1">{mode.title}</Text>
              </View>
              <Text className="text-foreground opacity-70 ml-8">{mode.description}</Text>
            </Pressable>
          ))}
        </View>

        {loading && (
          <View className="mt-6 p-4 bg-blue-50 rounded-lg">
            <Text className="text-blue-600 text-center">Initializing storage mode...</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // Show cloud login form
  return (
    <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Pressable onPress={handleBackToModeSelection} className="mb-4">
        <Text className="text-blue-500 text-lg">← Back to mode selection</Text>
      </Pressable>

      <View className="flex-row items-center mb-6">
        <Text className="text-2xl mr-3">☁️</Text>
        <Text className="text-foreground text-2xl font-bold">Cloud Login</Text>
      </View>

      <Text className="text-foreground opacity-70 mb-6">Sign in to access your cloud-synced data</Text>

      <TextInput
        placeholder="Email"
        className="p-4 mb-4 border border-primary rounded-lg text-lg bg-white"
        onChangeText={text => setUser({ ...user, email: text })}
        value={user.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        className="p-4 mb-4 border border-primary rounded-lg text-lg bg-white"
        onChangeText={text => setUser({ ...user, password: text })}
        value={user.password}
      />
      <Pressable
        className={`p-4 mb-4 bg-primary rounded-lg items-center ${isValid ? "" : "opacity-50"}`}
        onPress={signInWithEmail}
        disabled={!isValid}
      >
        <Text className="text-foreground font-semibold" selectable={false}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </Pressable>

      <Link href="/Register" className="p-4 mb-4 bg-secondary rounded-lg items-center text-center">
        <Text className="text-foreground font-semibold" selectable={false}>
          Create Account
        </Text>
      </Link>

      <Pressable className="mt-2">
        <Text className="text-blue-500 text-center" selectable={false}>
          Forgot Password?
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
const initialUserState = {
  email: "",
  password: "",
};
