import { useRoute } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import DashboardSkeleton from "../components/Charts/DashboardSkeleton";
import { useAuth } from "./AuthProvider";
import { useStorageMode } from "./StorageModeProvider";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading: isStorageLoading } = useStorageMode();
  const { isLoading: isAuthLoading } = useAuth();
  const isLoading = isStorageLoading || isAuthLoading;

  const isOnDashboardPage = useRoute().name === "(drawer)/dashboard";

  if (isLoading) {
    if (isOnDashboardPage)
      return <DashboardSkeleton />;
    else
      return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />;
  }
  return <>{children}</>;
}
