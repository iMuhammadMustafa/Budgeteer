import "@/global.css";
import ThemeProvider from "@/src/providers/ThemeProvider";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppInitializer from "../providers/AppInitalizer";
import AuthProvider from "../providers/AuthProvider";
import StorageModeProvider from "../providers/StorageModeProvider";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Suspense } from "react";
import { ActivityIndicator, LogBox, Platform } from "react-native";
import QueryProvider from "../providers/QueryProvider";

// Suppress known third-party library warnings for web platform
if (Platform.OS === "web") {
  LogBox.ignoreLogs([
    "Unknown event handler property",
    "React does not recognize the `accessibilityHint` prop",
    "React does not recognize the `backgroundColor` prop",
  ]);

  // Suppress console warnings for web-specific React Native props
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("Unknown event handler property") ||
        message.includes("React does not recognize the") ||
        message.includes("accessibilityHint") ||
        message.includes("backgroundColor"))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator />}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          {/* <NotificationsProvider> */}
          <StorageModeProvider>
            <AuthProvider>
              <AppInitializer>
                <QueryProvider>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                  </Stack>
                </QueryProvider>
              </AppInitializer>
            </AuthProvider>
          </StorageModeProvider>
          {/* </NotificationsProvider> */}
        </ThemeProvider>
      </GestureHandlerRootView>
    </Suspense>
  );
}
