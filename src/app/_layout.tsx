import { SplashScreen, Stack } from "expo-router";
import React, { Suspense } from "react";
import { ActivityIndicator, LogBox, Text } from "react-native";
import Notification from "../components/Notification";
import AuthProvider from "../providers/AuthProvider";
import NotificationsProvider from "../providers/NotificationsProvider";
import QueryProvider from "../providers/QueryProvider";
import ThemeProvider from "../providers/ThemeProvider";
import "./global.css";

SplashScreen.preventAutoHideAsync();
const originalWarn = console.warn; // Save the original console.warn function

console.warn = (...args) => {
  const message = args.join(" "); // Combine all arguments into a single string

  // List of warnings to ignore
  const warningsToIgnore = [
    "React does not recognize the `accessibilityHint` prop on a DOM element",
    "Unknown event handler property `onStartShouldSetResponder`",
    "Unknown event handler property `onResponderTerminationRequest`",
    "Unknown event handler property `onResponderGrant`",
    "Unknown event handler property `onResponderMove`",
    "Unknown event handler property `onResponderTerminate`",
  ];

  // Check if the warning message contains any of the ignored warnings
  const shouldIgnore = warningsToIgnore.some(warning => message.includes(warning));

  // If the warning should be ignored, do nothing
  if (shouldIgnore) {
    return;
  }

  // Otherwise, log the warning as usual
  originalWarn(...args);
};

LogBox.ignoreLogs([
  "React does not recognize the `accessibilityHint` prop on a DOM element",
  "Warning: Unknown event handler property `onStartShouldSetResponder`. It will be ignored.",
  "Warning: Unknown event handler property `onResponderTerminationRequest`. It will be ignored.",
  "Warning: Unknown event handler property `onResponderGrant`. It will be ignored.",
  "Warning: Unknown event handler property `onResponderMove`. It will be ignored.",
  "Warning: Unknown event handler property `onResponderTerminate`. It will be ignored.",
]);

export default function RootLayout() {
  return (
    <Suspense fallback={<ActivityIndicator />}>
      <ThemeProvider>
        <AuthProvider>
          <QueryProvider>
            <NotificationsProvider>
              <Notification />
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
