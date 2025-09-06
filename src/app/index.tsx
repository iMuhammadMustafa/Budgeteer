import { Text, View } from "react-native";

export default function Index() {
  console.log("Rendering Index screen from src/app/index.tsx");
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text className="text-red-500">Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
}
