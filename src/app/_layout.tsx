import "@/global.css";
import dayjs from "dayjs";
import quarterOfYear from "dayjs/plugin/quarterOfYear";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BrandSplash, useBudgeteerFonts } from "@/src/components/ui";
import AppInitializer from "@/src/providers/AppInitalizer";
import AuthProvider from "@/src/providers/AuthProvider";
import CloudSyncProvider from "@/src/providers/CloudSyncProvider";
import NotificationProvider from "@/src/providers/NotificationProvider";
import OverlayProvider from "@/src/providers/OverlayProvider";
import QueryProvider from "@/src/providers/QueryProvider";
import StorageModeProvider from "@/src/providers/StorageModeProvider";
import ThemeProvider from "@/src/providers/ThemeProvider";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(quarterOfYear);

// Keep the native splash up until the design-system fonts have loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Suppress known third-party library warnings for web platform
if (Platform.OS === "web") {
  const suppressedPatterns = [
    "Unknown event handler property",
    "React does not recognize the `accessibilityHint` prop",
    "React does not recognize the `backgroundColor` prop",
    "props.pointerEvents is deprecated. Use style.pointerEvents",
    "Image: style.tintColor is deprecated. Please use props.tintColor.",
    "TouchableMixin is deprecated. Please use Pressable.",
    "Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation. To resolve this, add `RCTAnimation` module to this app, or remove `useNativeDriver`. Make sure to run `bundle exec pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md",
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
  const fontsLoaded = useBudgeteerFonts();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  return (
    <Suspense fallback={<ActivityIndicator />}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <NotificationProvider>
          {fontsLoaded ? (
            <StorageModeProvider>
              <AuthProvider>
                <AppInitializer>
                  <QueryProvider>
                    <CloudSyncProvider>
                      <OverlayProvider>
                        <Stack>
                          <Stack.Screen name="index" options={{ headerShown: false }} />
                          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
                          <Stack.Screen name="(ui)" options={{ headerShown: false }} />
                        </Stack>
                      </OverlayProvider>
                    </CloudSyncProvider>
                  </QueryProvider>
                </AppInitializer>
              </AuthProvider>
            </StorageModeProvider>
          ) : (
            <BrandSplash />
          )}
          </NotificationProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </Suspense>
  );
}
