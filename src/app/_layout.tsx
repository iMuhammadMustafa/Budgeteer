import { SplashScreen, Stack } from "expo-router";
import AuthProvider from "../providers/AuthProvider";
import "./global.css";
import ThemeProvider from "../providers/ThemeProvider";
import QueryProvider from "../providers/QueryProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          </Stack>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";
