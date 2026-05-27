import "@/global.css";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Stack } from "expo-router";
import { Suspense } from "react";
import { ActivityIndicator, LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import AppInitializer from "@/src/providers/AppInitalizer";
import AuthProvider from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import StorageModeProvider from "@/src/providers/StorageModeProvider";
import ThemeProvider from "@/src/providers/ThemeProvider";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(quarterOfYear);

// Suppress known third-party library warnings for web platform
if (Platform.OS === "web") {
  const suppressedPatterns = [
    "Unknown event handler property",
    "React does not recognize the `accessibilityHint` prop",
    "React does not recognize the `backgroundColor` prop",

    "backgroundColor",
  ];

  LogBox.ignoreLogs(suppressedPatterns);
  const shouldSuppress = (args: unknown[]) => {
    const message = args[0];
    if (typeof message !== "string") return false;
    return suppressedPatterns.some(pattern => message.includes(pattern));
  };

  // Suppress console warnings for web-specific React Native props
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (shouldSuppress(args)) return;
    originalWarn(...args);
  };

  // Suppress console errors for React Native Web responder props (onResponderGrant, etc.)
  const originalError = console.error;
  console.error = (...args) => {
    if (shouldSuppress(args)) return;
    originalError(...args);
  };
}

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
