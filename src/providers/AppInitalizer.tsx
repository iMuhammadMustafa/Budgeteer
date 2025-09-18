import { ActivityIndicator } from "react-native";
import { useAuth } from "./AuthProvider";
import { useStorageMode } from "./StorageModeProvider";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading: isStorageLoading } = useStorageMode();
  const { isLoading: isAuthLoading } = useAuth();
  const isLoading = isStorageLoading || isAuthLoading;

  if (isLoading)
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />;

  return <>{children}</>;
}
