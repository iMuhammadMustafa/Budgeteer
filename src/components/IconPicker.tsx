import { memo, useCallback, useEffect, useMemo, useState } from "react";
import TextInputField from "./TextInputField";
import { icons } from "lucide-react-native";
import { FlatList, Pressable, View, Text, TouchableOpacity, Dimensions } from "react-native";
import Icon from "../lib/IonIcons";
import Modal from "react-native-modal";

const iconNames = Object.keys(icons);

export function IconPickerMemo({ initialIcon, onSelect }: any) {
  const [icon, setIcon] = useState("CircleHelp");
  const [searchText, setSearchText] = useState(initialIcon);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const iconToSet = initialIcon.length > 0 ? initialIcon : "CircleHelp";
    setIcon(iconToSet);
    setSearchText(iconToSet);
    onSelect(iconToSet);
  }, []);
  useEffect(() => {
    const iconToSet = initialIcon.length > 0 ? initialIcon : "CircleHelp";
    setIcon(iconToSet);
    setSearchText(iconToSet);
    onSelect(iconToSet);
  }, [initialIcon]);

  const filteredIcons = useMemo(() => {
    return iconNames.filter(i => i.toLowerCase().includes(searchText.toLowerCase()));
  }, [searchText]);

  const handleTextChange = useCallback(
    (text: string) => {
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
      setIsVisible(false);
    },
    [onSelect],
  );

  const windowWidth = Dimensions.get("window").width; // Get the screen width
  const numColumns = 10; // Number of columns in the grid
  const itemSize = windowWidth / numColumns; // Calculate the width for each item

  return (
    <>
      <Text className="text-base mb-2">Icon</Text>
      <TouchableOpacity
        className="p-3 mb-2 rounded border border-gray-300 bg-white items-center"
        onPress={() => {
          setIsVisible(!isVisible);
          setSearchText("");
        }}
      >
        {icon && !isVisible ? <Icon name={icon} size={20} /> : <Icon name={"CircleHelp"} size={20} />}
      </TouchableOpacity>
      {isVisible && (
        <Modal
          isVisible={isVisible}
          onDismiss={() => setIsVisible(false)}
          onBackButtonPress={() => setIsVisible(false)}
          onBackdropPress={() => setIsVisible(false)}
        >
          <TextInputField
            label="Icon"
            value={icon ?? "CircleHelp"}
            onChange={handleTextChange}
            keyboardType="default"
          />

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
                style={{ width: "10%", overflow: "hidden", paddingVertical: "2px" }}
              >
                <View className="flex justify-center items-center ">
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
