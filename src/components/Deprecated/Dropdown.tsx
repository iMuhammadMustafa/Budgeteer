import { useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import Modal from "react-native-modal";
import Icon from "../../lib/IonIcons";

interface OptionItem {
  id: string;
  label: string;
  value: any;
  icon?: any;
  disabled?: boolean;
}
interface DropDownModalProps {
  options: Array<OptionItem>;
  selectedValue?: string | null;
  onSelect: (item: OptionItem | null) => void;
  label: string;
}

export default function DropdownModal({ options, selectedValue, onSelect, label }: DropDownModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = value => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <>
      <Text className="text-base mb-2">{label}</Text>
      <TouchableOpacity
        className="p-3 rounded border border-gray-300 bg-white items-center"
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text className="text-base">
          {selectedValue ? options.find(option => option.id === selectedValue)?.label : "Select an option"}
        </Text>
      </TouchableOpacity>
      {isOpen && (
        <Modal
          isVisible={isOpen}
          onDismiss={() => setIsOpen(false)}
          onBackButtonPress={() => setIsOpen(false)}
          onBackdropPress={() => setIsOpen(false)}
          className="rounded-md"
        >
          <FlatList
            data={options}
            className="flex-grow-0 m-auto rounded-md"
            contentContainerClassName="items-start justify-center bg-white rounded-md p-1"
            keyExtractor={option => option.id}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  key={item.id}
                  className="p-3 flex-row border-b border-b-gray-300  rounded-md"
                  disabled={item.disabled}
                  onPress={() => handleSelect(item)}
                >
                  <View className="w-full flex-row justify-start items-center gap-2">
                    {item.icon && <Icon name={item.icon} className="text-black" />}
                    <Text className={`${item.disabled ? "text-muted" : "text-dark"}`}>{item.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </Modal>
      )}
    </>
  );
}
