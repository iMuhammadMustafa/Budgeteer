import { useEffect, useState } from "react";
import { FlatList, Platform, Pressable, ScrollView, Text, View, Modal } from "react-native";

import MyIcon from "@/src/utils/Icons.Helper";
import { Account } from "../types/db/Tables.Types";
import {
  DropDownProps,
  ListContainerProps,
  OptionItem,
  RenderListProps,
  RenderOptionProps,
} from "../types/components/DropdownField.types";
import MyModal from "./MyModal";

function DropdownField({
  options,
  onSelect,
  selectedValue,
  label,
  isModal = Platform.OS !== "web",
  groupBy,
  isWritable = false,
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
      <View onLayout={onButtonLayout} className="my-1 flex-1 -z-10 relative">
        <Text className="text-foreground ">{label}</Text>
        {isWritable ? (
          <Text>Not Yet implemented</Text>
        ) : (
          <Pressable className="p-3 rounded border border-gray-300 bg-white items-center" onPress={toggleDropdown}>
            <Text selectable={false} className="-z-10">
              {selectedItem ? selectedItem.label : label}
            </Text>
          </Pressable>
        )}
      </View>

      {options && isOpen && (
        <ListContainer isModal={isModal} buttonLayout={buttonLayout} isOpen={isOpen} setIsOpen={setIsOpen}>
          <RenderList groupedOptions={groupedOptions} options={options} isModal={isModal} onItemPress={onItemPress} />
        </ListContainer>
      )}
    </>
  );
}

function ListContainer({ children, buttonLayout, isOpen, setIsOpen, isModal }: ListContainerProps) {
  return (
    <>
      {isModal ? (
        <MyModal isOpen={isOpen} setIsOpen={setIsOpen}>
          {children}
        </MyModal>
      ) : (
        <View
          style={{ width: buttonLayout.width, top: buttonLayout.y + buttonLayout.height, left: buttonLayout.x }}
          className="bg-card shadow-md rounded-md z-10 absolute"
        >
          {children}
        </View>
      )}
    </>
  );
}

function RenderList({ groupedOptions, isModal, options, onItemPress }: RenderListProps) {
  return (
    // <ScrollView className={`flex-1 ${isModal ? "bg-white " : ""} `}>
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
                    <RenderOption
                      key={option.id}
                      isModal={isModal}
                      option={option}
                      onItemPress={onItemPress}
                      isGrouped
                    />
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
    // </ScrollView>
  );
}

const RenderOption = ({ isModal, option, onItemPress, isGrouped }: RenderOptionProps) => (
  <Pressable
    key={option.id}
    className={`p-2 relative z-10 gap-2 items-center max-w-48   ${isModal ? "" : "flex-row items-center justify-center"} ${isGrouped ? "" : "border-b border-gray-300 m-auto"}`}
    disabled={option.disabled}
    onPress={() => onItemPress(option)}
  >
    {option.icon && (
      <MyIcon
        name={option.icon}
        className={`text-base ${option.iconColorClass ? option.iconColorClass : "text-black"}`}
      />
    )}
    <Text
      className={`text-base relative text-center z-10  ${option.disabled ? "text-muted" : option.textColorClass ? `text-${option.textColorClass}` : "text-dark"}`}
    >
      {option.label}
    </Text>
    {!isModal && option.details && (
      <Text className={`text-base relative z-10 ${option.disabled ? "text-muted" : "text-dark"}`}> - </Text>
    )}
    {option.details && (
      <Text className={`text-base relative text-center z-10 ${option.disabled ? "text-muted" : "text-dark"}`}>
        {option.details}
      </Text>
    )}
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
    <DropdownField
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
                ? "text-danger-500"
                : "text-info-500",
          group: category.group.name,
        })) ?? []
      }
      groupBy="group"
      onSelect={(value: any) => onSelect(value)}
    />
  );
};

export function MyTransactionTypesDropdown({
  selectedValue,
  onSelect,
  isModal,
  isEdit,
  isAdjustmentDisabled = true,
  isInitialDisabled = true,
  isRefundDisabled = true,
  isAdjustmentHidden = true,
  isInitialHidden = true,
  isRefundHidden = true,
}: {
  selectedValue: any;
  onSelect: (value: any) => any;
  isModal: boolean;
  isEdit: boolean;
  isAdjustmentDisabled?: boolean;
  isInitialDisabled?: boolean;
  isRefundDisabled?: boolean;
  isAdjustmentHidden?: boolean;
  isInitialHidden?: boolean;
  isRefundHidden?: boolean;
}) {
  return (
    <DropdownField
      isModal={isModal}
      label="Type"
      options={[
        { id: "Income", label: "Income", value: "Income", disabled: isEdit },
        { id: "Expense", label: "Expense", value: "Expense", disabled: isEdit },
        { id: "Transfer", label: "Transfer", value: "Transfer", disabled: isEdit },
        { id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: isEdit || isAdjustmentDisabled },
        { id: "Initial", label: "Initial", value: "Initial", disabled: isEdit || isInitialDisabled },
        { id: "Refund", label: "Refund", value: "Refund", disabled: isEdit || isRefundDisabled },
      ]}
      selectedValue={selectedValue}
      onSelect={onSelect}
    />
  );
}

export const ColorsPickerDropdown = ({
  selectedValue,
  handleSelect,
}: {
  selectedValue: any;
  handleSelect: (item: OptionItem | null) => void;
}) => {
  return (
    <DropdownField
      isModal={Platform.OS !== "web"}
      label="Color"
      options={[
        { id: "info-100", label: "Info", value: "info-100", textColorClass: "info-100" },
        { id: "success-100", label: "Success", value: "success-100", textColorClass: "success-100" },
        { id: "warning-100", label: "Warning", value: "warning-100", textColorClass: "warning-100" },
        { id: "danger-100", label: "Error", value: "danger-100", textColorClass: "danger-100" },
      ]}
      selectedValue={selectedValue}
      onSelect={handleSelect}
    />
  );
};

export const AccountSelecterDropdown = ({
  label = "Account",
  selectedValue,
  onSelect,
  accounts,
  isModal,
  groupBy,
}: {
  label?: string;
  selectedValue: any;
  onSelect: (item: OptionItem | null) => void;
  accounts: any;
  isModal: boolean;
  groupBy?: string;
}) => {
  return (
    <DropdownField
      isModal={isModal}
      label={label}
      selectedValue={selectedValue}
      options={
        accounts?.map((account: Account & { category: { name: string } }) => ({
          id: account.id,
          label: account.name,
          /*account.owner*/
          details: `| ${account.balance.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}`,
          value: account,
          icon: account.icon,
          iconColorClass: `text-${account.color.replace("100", "500") ?? "gray-500"}`,
          group: account.category?.name,
        })) ?? []
      }
      groupBy={groupBy ? "group" : undefined}
      onSelect={onSelect}
    />
  );
};

export default DropdownField;
