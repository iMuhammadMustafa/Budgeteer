import { Stack } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/global.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { DemoModeProvider } from "@/src/providers/DemoModeProvider";
import { Suspense } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StorageModeProvider } from "../providers/StorageModeProvider";
import NotificationsProvider from "../providers/NotificationsProvider";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator />}>
      <NotificationsProvider>
        <ThemeProvider>
          <StorageModeProvider>
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
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
              </QueryProvider>
            </AuthProvider>
          </StorageModeProvider>
        </ThemeProvider>
      </NotificationsProvider>
    </Suspense>
  );
}
