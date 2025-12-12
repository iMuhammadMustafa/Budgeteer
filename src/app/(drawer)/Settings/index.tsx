import ImportExportSection from "@/src/components/Settings/ImportExportSection";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsIndex() {
  return (
    <SafeAreaView className="flex-1">
      <ImportExportSection />
    </SafeAreaView>
  );
}
