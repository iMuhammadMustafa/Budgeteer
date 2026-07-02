import { useRoute } from "expo-router/react-navigation";
import { ActivityIndicator, View } from "react-native";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import { useAuth } from "./AuthProvider";
import { useStorageMode } from "./StorageModeProvider";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading: isStorageLoading } = useStorageMode();
  const { isLoading: isAuthLoading } = useAuth();
  const isLoading = isStorageLoading || isAuthLoading;

  const isOnDashboardPage = useRoute().name === "(drawer)/dashboard";

  // Readiness sentinels (Phase 5.2): on web, `testID` renders as `data-testid`,
  // giving E2E a deterministic "app is loading" / "app is ready" signal that
  // replaces time-based waits. The flex:1 wrapper matches the parent layout.
  if (isLoading) {
    return (
      <View testID="app-loading" style={{ flex: 1 }}>
        {isOnDashboardPage ? (
          <DashboardSkeleton />
        ) : (
          <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />
        )}
      </View>
    );
  }
  return (
    <View testID="app-ready" style={{ flex: 1 }}>
      {children}
    </View>
  );
}
