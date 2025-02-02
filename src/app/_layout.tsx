import { Stack } from "expo-router";

import "@/global.css";

import ThemeProvider from "@/src/providers/ThemeProvider";
import AuthProvider from "@/src/providers/AuthProvider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack />
      </AuthProvider>
    </ThemeProvider>
  );
}
