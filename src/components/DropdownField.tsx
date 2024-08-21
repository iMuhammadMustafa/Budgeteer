import { useEffect, useState } from "react";
import { FlatList, ScrollView, Text, TextInput, View } from "react-native";

export default function DropdownField({ label, list, onSelect }: any) {
  const [value, setValue] = useState<string>("");
  const [filteredList, setFilteredList] = useState<string[]>(list);

  const handleChange = (text: string) => {
    setValue(text);
    setFilteredList(list.filter(item => item.name.includes(text)));
  };
  const handlePress = item => {
    setValue(item.name);
    onSelect(item);
    setFilteredList([]);
  };

  return (
    <ScrollView className="mb-4">
      <Text className="text-foreground">{label}</Text>
      {/* <View>{JSON.stringify(list)}</View> */}

      <TextInput
        className="text-foreground dark:bg-muted border rounded-md p-2"
        value={value ?? ""}
        onChangeText={handleChange}
        keyboardType={"default"}
      />

      <FlatList
        data={filteredList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <Text onPress={() => handlePress(item)}>{item.name}</Text>}
      />
    </ScrollView>
  );
}
