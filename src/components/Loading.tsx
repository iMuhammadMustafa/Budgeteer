import { Spinner } from "@/components/ui/spinner";
import { SafeAreaView } from "react-native";

export default function Loading() {
  return (
    <SafeAreaView className="w-full h-full  flex justify-center items-center">
      <Spinner size={50} className="text-muted-foreground" />
    </SafeAreaView>
  );
}
