import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, LayoutChangeEvent } from "react-native";
import Icon from "../lib/IonIcons";

interface OptionItem {
  label: string;
  value: any;
  icon?: any;
  disabled?: boolean;
}

interface DropdownProps {
  options?: Array<OptionItem>;
  onSelect: (item: { label: string; value: any }) => void;
  label?: string;
  buttonTextAfterSelection?: (selectedItem: { label: string; value: any }) => string;
  rowTextForSelection?: (item: { label: string; value: any }) => string;
  buttonStyle?: string;
  buttonTextStyle?: string;
  rowStyle?: string;
  rowTextStyle?: string;
  selectedValue?: string | null;
}

const VDropdown: React.FC<DropdownProps> = ({
  options,
  onSelect,
  label = "Select an option",
  buttonTextAfterSelection = selectedItem => selectedItem.label,
  rowTextForSelection = item => item.label,
  buttonStyle = "",
  buttonTextStyle = "",
  rowStyle = "",
  rowTextStyle = "",
  selectedValue = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ label: string; value: any } | null>(null);
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0 });
  const containerRef = useRef<View>(null);
  const dropdownRef = useRef<View>(null);

  useEffect(() => {
    if (options) {
      const item = options.find(i => i.value === selectedValue) ?? null;
      setSelectedItem(item);
    }
  }, [selectedValue, options]);

  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isOpen]);

  const toggleDropdown = (): void => {
    setIsOpen(!isOpen);
  };

  const onItemPress = (item: { label: string; value: any }): void => {
    setSelectedItem(item);
    onSelect(item.value);
    setIsOpen(false);
  };

  const onButtonLayout = (event: LayoutChangeEvent) => {
    const { height, width, y } = event.nativeEvent.layout;
    setButtonLayout({ height, width, top: y });
  };

  return (
    <>
      <Text className="text-foreground">{label}</Text>
      <TouchableOpacity
        className={`p-3 my-1 border border-gray-300 bg-white rounded-md -z-10 ${buttonStyle}`}
        onPress={toggleDropdown}
        onLayout={onButtonLayout}
        ref={containerRef}
      >
        <Text className={`text-base ${buttonTextStyle} -z-10`}>
          {selectedItem ? buttonTextAfterSelection(selectedItem) : label}
        </Text>
      </TouchableOpacity>

      {isOpen && options && (
        <View
          ref={dropdownRef}
          style={{ width: buttonLayout.width, top: buttonLayout.top + buttonLayout.height }}
          className="bg-white shadow-md rounded-md z-10 absolute"
        >
          <FlatList
            data={options}
            renderItem={({ item }: { item: OptionItem }) => (
              <TouchableOpacity
                className={`p-2 border-b border-gray-300 ${rowStyle} relative z-10 flex-row gap-2`}
                disabled={item.disabled}
                onPress={() => onItemPress(item)}
              >
                {item.icon && <Icon name={item.icon} className="text-base" />}
                <Text
                  className={`text-base ${rowTextStyle} relative z-10 ${item.disabled ? "text-muted" : "text-dark"}`}
                >
                  {rowTextForSelection(item)}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerClassName="relative z-10"
            className="max-h-40 border border-gray-300 rounded-md relative z-10"
          />
        </View>
      )}
    </>
  );
};

export default VDropdown;
