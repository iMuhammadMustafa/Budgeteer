import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View, Text, Dimensions, Modal, ScrollView } from "react-native";

import { icons } from "lucide-react-native";
import MyIcon from "@/src/utils/Icons.Helper";
import TextInputField from "./TextInputField";

const iconNames = Object.keys(icons);

function IconPickerMemo({ label, initialIcon, onSelect }: any) {
  const [icon, setIcon] = useState("CircleHelp");
  const [searchText, setSearchText] = useState(initialIcon);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const iconToSet = initialIcon.length > 0 ? initialIcon : "CircleHelp";
    setIcon(iconToSet);
    setSearchText("");
    onSelect(iconToSet);
  }, []);
  useEffect(() => {
    const iconToSet = initialIcon.length > 0 ? initialIcon : "CircleHelp";
    setIcon(iconToSet);
    setSearchText(iconToSet);
    onSelect(iconToSet);
  }, [initialIcon]);

  const filteredIcons = useMemo(() => {
    if (!searchText || searchText.length === 0) return iconNames;
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
      <Text className="text-base mb-2 -z-10">{label}</Text>
      <Pressable
        className="p-3 mb-2 rounded border border-gray-300 bg-white items-center -z-10"
        onPress={() => {
          setIsVisible(!isVisible);
          setSearchText("");
        }}
      >
        {icon && !isVisible ? <MyIcon name={icon} size={20} /> : <MyIcon name={"CircleHelp"} size={20} />}
      </Pressable>
      {isVisible && (
        <Modal
          visible={isVisible}
          onDismiss={() => setIsVisible(false)}
          // onBackButtonPress={() => setIsVisible(false)}
          // onBackdropPress={() => setIsVisible(false)}
          transparent={true}
          animationType="fade"
          className="flex-1 justify-center items-center"
        >
          <Pressable onPressOut={() => setIsVisible(false)} className="bg-black/50 flex-1 justify-center items-center">
            <TextInputField label={label ?? "Icon"} value={icon} onChange={handleTextChange} keyboardType="default" />
            {/* <ScrollView className="m-auto flex-grow-0 max-w-3xl p-4 rounded-md border border-muted bg-card custom-scrollbar"> */}
            <FlatList
              data={filteredIcons}
              contentContainerClassName="p-5 gap-5 bg-white rounded-md flex flex-grow-0 max-w-3xl custom-scrollbar"
              columnWrapperClassName="flex-row justify-around custom-scrollbar"
              className="custom-scrollbar"
              numColumns={10}
              initialNumToRender={5}
              windowSize={5}
              renderItem={({ item }) => (
                <Pressable
                  key={item}
                  onPress={() => {
                    handleIconSelect(item);
                  }}
                  className="py-2 w-[10%] flex justify-center items-center text-clip "
                >
                  <View className="flex justify-center items-center  ">
                    <MyIcon name={item} size={20} />
                    <Text selectable={false}>{item}</Text>
                  </View>
                </Pressable>
              )}
            />
            {/* </ScrollView> */}
          </Pressable>
        </Modal>
      )}
    </>
  );
}
const IconPicker = memo(IconPickerMemo);
export default IconPicker;
