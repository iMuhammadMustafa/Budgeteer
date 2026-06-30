import { ActivityIndicator, Platform, View } from "react-native";
import * as Updates from "expo-updates";

import { useAuth } from "@/src/providers/AuthProvider";
import { queryClient } from "@/src/providers/QueryProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import { Button, IconButton, Text as ThemedText } from "@/src/components/ui";

export default function Footer() {
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();
  const { logout } = useAuth();
  const { setStorageMode } = useStorageMode();

  return (
    <>
      <View className="flex-row justify-around items-center py-2">
        <ThemedText
          className="text-center"
          onPress={async () => {
            if (Platform.OS !== "web") await Updates.checkForUpdateAsync();
          }}
        >
          {/* TODO: Better Version Handling */}
          Version 0.16.11
        </ThemedText>
        {isUpdatePending && !isDownloading && (
          <IconButton
            onPress={async () => await Updates.reloadAsync()}
            variant="outline"
            icon="Power"
            size="md"
            accessibilityLabel="Reload app"
          />
        )}
        {isDownloading && <ActivityIndicator size="small" color="black" />}
        {isUpdateAvailable && !isUpdatePending && !isDownloading && (
          <IconButton
            onPress={async () => await Updates.fetchUpdateAsync()}
            variant="outline"
            icon="CloudDownload"
            size="md"
            accessibilityLabel="Download update"
          />
        )}
      </View>
      <Button
        label="Logout"
        onPress={() => {
          logout();
          setStorageMode(null);
        }}
        variant="destructive"
        trailingIcon="LogOut"
        size="sm"
      />
      <Button
        label="Clear Cache"
        onPress={() => {
          queryClient.clear();
          queryClient.resetQueries();
        }}
        variant="ghost"
        size="sm"
        trailingIcon="Trash"
      />
    </>
  );
}
