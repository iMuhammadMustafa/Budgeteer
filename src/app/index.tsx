import { SafeAreaView, ScrollView, View } from "react-native";

import BudgeteerLanding from "@/src/components/pages/VLanding";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-background-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center">
          <BudgeteerLanding />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
