import { Stack } from "expo-router";

import "@/global.css";

import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack>
          <Stack.Screen key="index" name="index" options={{ headerShown: false }} />
          <Stack.Screen key="auth" name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen key="drawer" name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen key="tabs" name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
