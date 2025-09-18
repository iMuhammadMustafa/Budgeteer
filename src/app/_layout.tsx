import "@/global.css";
import ThemeProvider from "@/src/providers/ThemeProvider";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppInitializer from "../providers/AppInitalizer";
import AuthProvider from "../providers/AuthProvider";
import StorageModeProvider from "../providers/StorageModeProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StorageModeProvider>
          <AuthProvider>
            <AppInitializer>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              </Stack>
            </AppInitializer>
          </AuthProvider>
        </StorageModeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
