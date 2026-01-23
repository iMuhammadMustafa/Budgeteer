import { StorageMode, StorageModeConfig } from "@/src/types/StorageMode";
import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { Text, View } from "react-native";
import Button from "../components/elements/Button";
import { useAuth } from "../providers/AuthProvider";
import { useStorageMode } from "../providers/StorageModeProvider";
import { useTheme } from "../providers/ThemeProvider";
import { WATERMELONDB_DEFAULTS, WATERMELONDB_DEMO } from "../types/database/watermelon/constants";

export default function Index() {
  const { storageMode, setStorageMode, isLoading: isStorageLoading } = useStorageMode();
  const { session, setSession, isLoading: isAuthLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLoading = isStorageLoading || isAuthLoading;

  useEffect(() => {
    if (!isLoading && storageMode && session) {
      router.push("/Dashboard");
    }
  }, [isLoading, storageMode, session]);

  const handleLogin = useCallback(
    async (mode: any) => {
      if (storageMode && session) {
        await logout();
      }

      if (mode.id === StorageMode.Cloud) {
        return router.push("/Login");
      }

      await setStorageMode(mode.id);
      if (mode.id === StorageMode.Local) {
        await setSession(
          {
            user: {
              id: WATERMELONDB_DEFAULTS.userId,
              email: WATERMELONDB_DEFAULTS.email,
              user_metadata: {
                tenantid: WATERMELONDB_DEFAULTS.tenantId,
                full_name: WATERMELONDB_DEFAULTS.name,
              },
              app_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            },
            access_token: "local-access-token",
            refresh_token: "local-refresh-token",
            expires_in: 3600,
            token_type: "bearer",
          },
          StorageMode.Local,
        );
      }
      if (mode.id === StorageMode.Demo) {
        await setSession(
          {
            user: {
              id: WATERMELONDB_DEMO.userId,
              email: WATERMELONDB_DEMO.email,
              user_metadata: {
                tenantid: WATERMELONDB_DEMO.tenantId,
                full_name: WATERMELONDB_DEMO.name,
              },
              app_metadata: {},
              aud: "authenticated",
              created_at: new Date().toISOString(),
            },
            access_token: "demo-access-token",
            refresh_token: "demo-refresh-token",
            expires_in: 3600,
            token_type: "bearer",
          },
          StorageMode.Demo,
        );
      }
      console.log("Navigating to Dashboard");
      return router.push("/Dashboard");
    },
    [session, setSession, storageMode, setStorageMode, logout],
  );

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <>
      {/* <StickyTable /> */}
      <View className="flex-1 items-center bg-background">
        <View className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
          <Text className="text-foreground text-3xl font-bold mb-4 text-center">Welcome to Budgeteer</Text>
          <Text className="text-foreground text-lg mb-8 text-center opacity-70">
            Choose how you would like to use the app
          </Text>

          <View className="space-y-4">
            {Object.values(StorageModeConfig).map(mode => (
              <Button
                key={mode.id}
                testID={`mode-${mode.id}`}
                className="p-6 border border-primary rounded-lg bg-card shadow-sm text-foreground"
                onPress={async () => await handleLogin(mode)}
                disabled={isLoading}
                label={`${mode.icon} ${mode.title}`}
                bottomDescription={mode.description}
                textContainerClasses="flex flex-col items-center"
                textClasses="text-foreground"
              />
            ))}
          </View>

          {isLoading && (
            <View className="mt-6 p-4 bg-blue-50 rounded-lg">
              <Text className="text-blue-600 text-center">Initializing storage mode...</Text>
            </View>
          )}
        </View>

        <View className="absolute top-10 right-5">
          <Button
            onPress={toggleTheme}
            label={theme === "light" ? "🌙" : "☀️"}
            accessibilityLabel="Go to Theme Settings"
            variant="ghost"
          />
        </View>
      </View>
    </>
  );
}
