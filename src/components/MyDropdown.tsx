import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, ScrollView, Text, View } from "react-native";
import Icon from "../lib/IonIcons";
import Modal from "react-native-modal";

interface OptionItem {
  id: string;
  label: string;
  value: any;
  icon?: any;
  iconColorClass?: string;
  disabled?: boolean;
  group?: string;
}
interface DropDownProps {
  options: Array<OptionItem>;
  onSelect: (item: OptionItem | null) => void;
  selectedValue?: string | null;
  label: string;
  isModal?: boolean;
  groupBy?: string;
}

export default function MyDropDown({
  options,
  onSelect,
  selectedValue,
  label,
  isModal = Platform.OS !== "web",
  groupBy,
}: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OptionItem | null>(null);
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0, y: 0, x: 0 });

  const groupedOptions = groupBy ? [...new Set(options.map(option => option.group))] : options;

  useEffect(() => {
    if (options) {
      const item = options.find(i => i.id === selectedValue) ?? null;
      setSelectedItem(item);
    }
  }, [selectedValue, options]);

  useEffect(() => {
    if (selectedItem) {
      onSelect(selectedItem);
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: any) => {
      setIsOpen(false);
    };

    if (isOpen) {
      if (Platform.OS === "web") {
        document.addEventListener("click", handleOutsideClick);
      }
    }

    return () => {
      if (Platform.OS === "web") {
        document.removeEventListener("click", handleOutsideClick);
      }
    };
  }, [isOpen]);

  const toggleDropdown = (): void => {
    setIsOpen(!isOpen);
  };

  const onItemPress = (item: OptionItem): void => {
    setSelectedItem(item);
    onSelect(item);
    setIsOpen(false);
  };

  const onButtonLayout = (event: any) => {
    const { height, width, y, top, x } = event.nativeEvent.layout;
    setButtonLayout({ height, width, top, y, x });
  };

  return (
    <>
      <View onLayout={onButtonLayout} className="my-1 flex-1">
        <Text className="text-foreground ">{label}</Text>
        <Pressable className="p-3 rounded border border-gray-300 bg-white items-center" onPress={toggleDropdown}>
          <Text selectable={false} className="-z-10">
            {selectedItem ? selectedItem.label : label}
          </Text>
        </Pressable>
      </View>

      {options && isOpen && (
        <ListContainer isModal={isModal} buttonLayout={buttonLayout} isOpen={isOpen} setIsOpen={setIsOpen}>
          <RenderList groupedOptions={groupedOptions} options={options} isModal={isModal} onItemPress={onItemPress} />
        </ListContainer>
      )}
    </>
  );
}

type ListContainerProps = {
  isModal: boolean;
  children: any;
  buttonLayout: { height: number; width: number; top: number; y: number; x: number };
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ListContainer = ({ children, buttonLayout, isOpen, setIsOpen, isModal }: ListContainerProps) => {
  return (
    <>
      {isOpen && isModal ? (
        <Modal
          isVisible={isOpen}
          onDismiss={() => setIsOpen(false)}
          onBackButtonPress={() => setIsOpen(false)}
          // onRequestClose={() => setIsOpen(false)}
          onBackdropPress={() => setIsOpen(false)}
          className="rounded-md z-50 bg-white"
          // transparent
          // presentationClassName="bg-transparent"
        >
          {children}
        </Modal>
      ) : (
        <View
          style={{ width: buttonLayout.width, top: buttonLayout.y + buttonLayout.height, left: buttonLayout.x }}
          className="bg-white shadow-md rounded-md z-10 absolute"
        >
          {children}
        </View>
      )}
    </>
  );
};

type RenderListProps = {
  groupedOptions: any[];
  options: OptionItem[];
  isModal: boolean;
  onItemPress: (item: OptionItem) => void;
};

const RenderList = ({ groupedOptions, isModal, options, onItemPress }: RenderListProps) => {
  return (
    <ScrollView className={`${isModal ? "bg-white m-auto custom-scrollbar rounded-md flex-grow-0" : ""} `}>
      <FlatList
        data={groupedOptions}
        keyExtractor={(item, index) => index.toString() + (item ? (typeof item === "string" ? item : item.id) : "")}
        renderItem={({ item }: { item: OptionItem | string | undefined }) => (
          <>
            {typeof item === "string" ? (
              <>
                <Text className="p-2 bg-gray-100 text-dark text-sm  text-center">{item}</Text>
                {/* <ScrollView horizontal className="flex-row custom-scrollbar"> */}
                <View
                  className={`flex-row flex-wrap  border-b border-gray-300 w-full my-1 ${Platform.OS === "web" ? "items-center justify-center" : ""}`}
                >
                  {options
                    .filter(option => option.group === item)
                    .map(option => (
                      <RenderOption isModal={isModal} option={option} onItemPress={onItemPress} isGrouped />
                    ))}
                </View>
              </>
            ) : (
              item && <RenderOption isModal={isModal} option={item} onItemPress={onItemPress} />
            )}
          </>
        )}
        className={`rounded-md custom-scrollbar ${isModal ? "flex-grow-0 m-auto" : "max-h-40 border border-gray-300  relative z-10 "}`}
        contentContainerClassName={`bg-white ${isModal ? "items-center justify-center bg-white rounded-md p-1" : "relative z-10"}`}
      />
    </ScrollView>
  );
};

type RenderOptionProps = {
  isModal: boolean;
  option: OptionItem;
  onItemPress: (item: OptionItem) => void;
  isGrouped?: boolean;
};

const RenderOption = ({ isModal, option, onItemPress, isGrouped }: RenderOptionProps) => (
  <Pressable
    key={option.id}
    className={`p-2 relative z-10 gap-2 items-center ${isModal ? "" : "flex-row"} ${isGrouped ? "" : "border-b border-gray-300"}`}
    disabled={option.disabled}
    onPress={() => onItemPress(option)}
  >
    {option.icon && (
      <Icon
        name={option.icon}
        className={`text-base ${option.iconColorClass ? option.iconColorClass : "text-black"}`}
      />
    )}
    <Text className={`text-base relative z-10 ${option.disabled ? "text-muted" : "text-dark"}`}>{option.label}</Text>
  </Pressable>
);

export const MyCategoriesDropdown = ({
  selectedValue,
  categories,
  onSelect,
  isModal,
}: {
  selectedValue: any;
  categories: any;
  onSelect: (value: any) => any;
  isModal: boolean;
}) => {
  return (
    <MyDropDown
      isModal={isModal}
      label="Category"
      selectedValue={selectedValue}
      options={
        categories?.map((category: any) => ({
          id: category.id,
          label: category.name,
          value: category,
          icon: category.icon,
          iconColorClass:
            category.type === "Income"
              ? "text-success-500"
              : category.type === "Expense"
                ? "text-error-500"
                : "text-info-500",
          group: category.group,
        })) ?? []
      }
      groupBy="group"
      onSelect={(value: any) => onSelect(value)}
    />
  );
};
