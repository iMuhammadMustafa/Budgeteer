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
import { ActivityIndicator } from "react-native";
import QueryProvider from "../providers/QueryProvider";

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
            <QueryProvider>
              <AuthProvider>
                <AppInitializer>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                    <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                  </Stack>
                </AppInitializer>
              </AuthProvider>
            </QueryProvider>
          </StorageModeProvider>
          {/* </NotificationsProvider> */}
        </ThemeProvider>
      </GestureHandlerRootView>
    </Suspense>
  );
}
