import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ViewStyle, TextStyle } from "react-native";
import OutsidePressHandler from "react-native-outside-press";

interface DropdownProps {
  data: Array<{ label: string; value: any }>;
  onSelect: (item: { label: string; value: any }) => void;
  defaultButtonText?: string;
  buttonTextAfterSelection?: (selectedItem: { label: string; value: any }) => string;
  rowTextForSelection?: (item: { label: string; value: any }) => string;
  buttonStyle?: ViewStyle;
  buttonTextStyle?: TextStyle;
  rowStyle?: ViewStyle;
  rowTextStyle?: TextStyle;
}

const VDropdown: React.FC<DropdownProps> = ({
  data,
  onSelect,
  defaultButtonText = "Select an option",
  buttonTextAfterSelection = selectedItem => selectedItem.label,
  rowTextForSelection = item => item.label,
  buttonStyle = {},
  buttonTextStyle = {},
  rowStyle = {},
  rowTextStyle = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ label: string; value: any } | null>(null);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const onItemPress = (item: { label: string; value: any }) => {
    setSelectedItem(item);
    onSelect(item);
    setIsOpen(false);
  };

  const dropdownRef = React.useRef<View>(null);
  // React.useEffect(() => {
  //   document.addEventListener("mousedown", handlePressOutside);
  //   return () => document.removeEventListener("mousedown", handlePressOutside);
  // }, []);

  // const handlePressOutside = (e: GestureResponderEvent) => {
  //   console.log(e);
  //   if (dropdownRef.current && !dropdownRef.current.isFocused()) {
  //     setIsOpen(false);
  //   }
  // };

  const renderItem = ({ item }: { item: { label: string; value: any } }) => (
    <TouchableOpacity style={[styles.rowStyle, rowStyle]} onPress={() => onItemPress(item)}>
      <Text style={[styles.rowTextStyle, rowTextStyle]}>{rowTextForSelection(item)}</Text>
    </TouchableOpacity>
  );

  return (
    // <OutsidePressHandler
    //   onOutsidePress={() => {
    //     console.log("Pressed outside the box!");
    //   }}
    // >
    <View style={styles.container} ref={dropdownRef}>
      <TouchableOpacity style={[styles.button, buttonStyle]} onPress={toggleDropdown}>
        <Text style={[styles.buttonText, buttonTextStyle]}>
          {selectedItem ? buttonTextAfterSelection(selectedItem) : defaultButtonText}
        </Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.dropdown}>
          <FlatList data={data} renderItem={renderItem} keyExtractor={(item, index) => index.toString()} />
        </View>
      )}
    </View>
    // </OutsidePressHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1,
  },
  button: {
    padding: 10,
    backgroundColor: "#efefef",
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 16,
  },
  dropdown: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    maxHeight: 150,
  },
  rowStyle: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  rowTextStyle: {
    fontSize: 16,
  },
});

export default VDropdown;
