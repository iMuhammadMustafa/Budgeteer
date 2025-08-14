import { Stack } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/global.css";

import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { DemoModeProvider } from "@/src/providers/DemoModeProvider";
import { StorageModeProvider } from "@/src/providers/StorageModeProvider";
import { Suspense } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator />}>
      <ThemeProvider>
        <StorageModeProvider>
          <DemoModeProvider>
            <AuthProvider>
              <QueryProvider>
              {/* <SafeAreaProvider> */}
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                </Stack>
              </GestureHandlerRootView>
              {/* </SafeAreaProvider> */}
              </QueryProvider>
            </AuthProvider>
          </DemoModeProvider>
        </StorageModeProvider>
      </ThemeProvider>
    </Suspense>
  );
}
