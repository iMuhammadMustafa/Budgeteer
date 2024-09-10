import { memo, useCallback, useEffect, useMemo, useState } from "react";
import TextInputField from "./TextInputField";
import { icons } from "lucide-react-native";
import { FlatList, Pressable, View, Text, TouchableOpacity } from "react-native";
import Icon from "../lib/IonIcons";
import Modal from "react-native-modal";

const iconNames = Object.keys(icons);

export function IconPickerMemo({ initialIcon, onSelect }: any) {
  const [icon, setIcon] = useState(initialIcon);
  const [searchText, setSearchText] = useState(initialIcon);
  const [isVisible, setIsVisible] = useState(false);

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
      <Text className="text-base mb-2">Icon</Text>
      <TouchableOpacity
        className="p-3 rounded border border-gray-300 bg-white items-center"
        onPress={() => setIsVisible(!isVisible)}
      >
        {/* <Icon name={icon} size={20} /> */}
      </TouchableOpacity>
      {isVisible && (
        <Modal
          isVisible={isVisible}
          onDismiss={() => setIsVisible(false)}
          onBackButtonPress={() => setIsVisible(false)}
          onBackdropPress={() => setIsVisible(false)}
        >
          <TextInputField label="Icon" value={icon} onChange={handleTextChange} keyboardType="default" />

          <FlatList
            data={filteredIcons}
            contentContainerClassName="p-5 gap-5 bg-white rounded-md flex"
            columnWrapperClassName="flex-row justify-around"
            numColumns={10}
            initialNumToRender={25}
            renderItem={({ item }) => (
              <Pressable
                key={item}
                onPress={() => {
                  handleIconSelect(item);
                }}
              >
                <View className="flex justify-center items-center overflow-hiddenmax-w-[10%]">
                  <Icon name={item} size={20} />
                  <Text className="">{item}</Text>
                </View>
              </Pressable>
            )}
          />
        </Modal>
      )}
    </>
  );
}
const IconPicker = memo(IconPickerMemo);
export default IconPicker;
