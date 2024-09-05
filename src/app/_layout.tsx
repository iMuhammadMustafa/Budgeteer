import { SplashScreen, Stack } from "expo-router";
import AuthProvider from "../providers/AuthProvider";
import "./global.css";
import ThemeProvider from "../providers/ThemeProvider";
import QueryProvider from "../providers/QueryProvider";
import { Suspense } from "react";
import { SafeAreaView, Text } from "react-native";
import { DevToolsBubble } from "react-native-react-query-devtools";
import NotificationsProvider from "../providers/NotificationsProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <Suspense fallback={<Text>Load...</Text>}>
      <ThemeProvider>
        <AuthProvider>
          <QueryProvider>
            <NotificationsProvider>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
              </Stack>
            </NotificationsProvider>
            {/* <DevToolsBubble /> */}
          </QueryProvider>
        </AuthProvider>
      </ThemeProvider>
    </Suspense>
  );
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";
