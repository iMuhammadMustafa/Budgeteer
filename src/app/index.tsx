import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "../components/Button";
import MyTab from "../components/MyTab";
import { useTheme } from "../providers/ThemeProvider";

export default function Index() {
  console.log("Rendering Index screen from src/app/index.tsx");
  const { toggleTheme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="text-red-500">Edit app/index.tsx to edit this screen.</Text>
      <Button
        label="Press Me"
        onPress={() => {
          router.push("/(drawer)/(tabs)/Dashboard");
          // toggleTheme();
        }}
      />
      {/* type BatchDeleteMutation = ReturnType<typeof useMutation<void, unknown, { items?: any[] }>>; */}

      <View className="w-full flex-1">
        <MyTab
          title="My Tab"
          queryKey={["myTab"]}
          onGet={() => ({
            data: [],
            isLoading: false,
            error: null,
          })}
          onBatchDelete={() => {
            return {} as BatchDeleteMutation;
          }}
          upsertUrl="/my-tab/upsert"
          groupBy="group.name"
        />
      </View>
    </View>
  );
}
