import { router } from "expo-router";
import { useCallback } from "react";
import { Text, View } from "react-native";
import Button from "../components/Button";
import { useAuth } from "../providers/AuthProvider";
import { StorageMode, StorageModeConfig, useStorageMode } from "../providers/StorageModeProvider";
import { WATERMELONDB_DEFAULTS } from "../types/database/watermelon/constants";

export default function Index() {
  console.log("Rendering Index screen from src/app/index.tsx");
  const { storageMode, setStorageMode, isLoading: isStorageLoading } = useStorageMode();
  const { session, setSession, isLoading: isAuthLoading } = useAuth();
  const isLoading = isStorageLoading || isAuthLoading;

  const handleLocalLogin = useCallback(
    async (mode: any) => {
      if (storageMode && session) return router.push("/Dashboard");

      if (mode.id === StorageMode.Cloud) {
        console.log("Navigating to Login screen for Cloud storage mode");
        return router.push("/Login");
      }

      await setStorageMode(mode.id);
      if (mode.id === StorageMode.Local) {
        await setSession(
          {
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
          },
          StorageMode.Local,
        );
      }
    },
    [session, setSession, storageMode, setStorageMode],
  );

  if (isLoading) return <Text>Loading...</Text>;
  return (
    <View className="flex-1 items-center bg-background">
      <Text className="text-red-500">Edit app/index.tsx to edit this screen.</Text>
      <Button label="Login" onPress={() => router.push("/Login")} />
      <Button label="Go to Dashboard" onPress={() => router.push("/(drawer)/(tabs)/Dashboard")} />
      <Text>session: {JSON.stringify(session)}</Text>

      <Button
        label="Logout"
        onPress={async () => {
          await setSession(null, null);
          await setStorageMode(null);
        }}
      />

      <View className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
        <Text className="text-foreground text-3xl font-bold mb-4 text-center">Welcome to Budgeteer</Text>
        <Text className="text-foreground text-lg mb-8 text-center opacity-70">
          Choose how you would like to use the app
        </Text>

        <View className="space-y-4">
          {Object.values(StorageModeConfig).map(mode => (
            <Button
              key={mode.id}
              className="p-6 border border-primary rounded-lg bg-white shadow-sm"
              onPress={async () => await handleLocalLogin(mode)}
              disabled={isLoading}
              label={`${mode.icon} ${mode.title}`}
              bottomDescription={mode.description}
              textContainerClasses="flex flex-col items-center"
            />
          ))}
        </View>

        {isLoading && (
          <View className="mt-6 p-4 bg-blue-50 rounded-lg">
            <Text className="text-blue-600 text-center">Initializing storage mode...</Text>
          </View>
        )}
      </View>
    </View>
  );
}
