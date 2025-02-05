import { Stack } from "expo-router";
// import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/global.css";

import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";
import QueryProvider from "@/src/providers/QueryProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          {/* <SafeAreaProvider> */}
          <Stack>
            <Stack.Screen key="index" name="index" options={{ headerShown: false }} />
            <Stack.Screen key="auth" name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen key="drawer" name="(drawer)" options={{ headerShown: false }} />
          </Stack>
          {/* </SafeAreaProvider> */}
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
