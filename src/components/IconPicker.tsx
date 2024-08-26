import { memo, useCallback, useEffect, useMemo, useState } from "react";
import TextInputField from "./TextInputField";
import { icons } from "lucide-react-native";
import { FlatList, Pressable, View, Text } from "react-native";
import Icon from "../lib/IonIcons";

const iconNames = Object.keys(icons);

export function IconPickerMemo({ initialIcon, onSelect }: any) {
  const [icon, setIcon] = useState(initialIcon);
  const [searchText, setSearchText] = useState(initialIcon);

  useEffect(() => {
    setIcon(initialIcon);
    setSearchText(initialIcon);
  }, []);

  const filteredIcons = useMemo(() => {
    return iconNames.filter(i => i.toLowerCase().includes(searchText.toLowerCase()));
  }, [searchText]);

  useEffect(() => {
    setIcon(initialIcon);
  }, [initialIcon]);

  const handleTextChange = useCallback(
    (text: string) => {
      console.log("text", text);
      setIcon(text);
      onSelect(text);
      setSearchText(text);
    },
    [onSelect],
  );

  const handleIconSelect = useCallback(
    (selectedIcon: string) => {
      setIcon(selectedIcon);
      onSelect(selectedIcon);
      setSearchText(selectedIcon);
    },
    [onSelect],
  );

  return (
    <>
      <TextInputField label="Icon" value={icon} onChange={handleTextChange} keyboardType="default" />
      <FlatList
        data={filteredIcons}
        contentContainerClassName="p-5 gap-5"
        horizontal
        initialNumToRender={10}
        renderItem={({ item }) => (
          <Pressable
            key={item}
            onPress={() => {
              handleIconSelect(item);
            }}
          >
            <View className="flex justify-center items-center">
              <Icon name={item} size={20} />
              <Text>{item}</Text>
            </View>
          </Pressable>
        )}
      />
    </>
  );
}
const IconPicker = memo(IconPickerMemo);
export default IconPicker;
