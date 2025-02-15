import { Stack } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/global.css";

import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import { Suspense } from "react";
import { ActivityIndicator } from "react-native";

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator />}>
      <ThemeProvider>
        <AuthProvider>
          <QueryProvider>
            {/* <SafeAreaProvider> */}
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
            </Stack>
            {/* </SafeAreaProvider> */}
          </QueryProvider>
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  );
}
