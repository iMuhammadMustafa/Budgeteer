import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, Text, View } from "react-native";

import {
  DropDownProps,
  ListContainerProps,
  OptionItem,
  RenderListProps,
  RenderOptionProps,
} from "@/src/types/components/DropdownField.Types";
import { Account, TransactionCategory } from "@/src/types/database/Tables.Types";
import Button from "./Button";
import MyIcon from "./MyIcon";
import MyModal from "./MyModal";

function DropdownField({
  options,
  onSelect,
  selectedValue,
  label,
  isModal = Platform.OS !== "web",
  groupBy,
  isWritable = false,
  nestedForm,
  onNestedFormSuccess,
}: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isNestedFormOpen, setIsNestedFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OptionItem | null>(null);
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0, y: 0, x: 0 });

  const groupedOptions = useMemo(
    () => (groupBy ? [...new Set(options.map(option => option.group))] : options),
    [groupBy, options],
  );

  useEffect(() => {
    if (options && selectedValue) {
      const item = options.find(i => i.id === selectedValue) ?? null;
      setSelectedItem(item);
    }
  }, [selectedValue, options]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setIsOpen(false);
    };

    if (isOpen && Platform.OS === "web") {
      // Small timeout to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleOutsideClick);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleOutsideClick);
      };
    }
  }, [isOpen]);

  const toggleDropdown = useCallback((e?: any) => {
    if (e && Platform.OS === "web") {
      e.stopPropagation();
    }
    setIsOpen(prev => !prev);
  }, []);

  const onItemPress = useCallback(
    (item: OptionItem) => {
      setSelectedItem(item);
      onSelect(item);
      setIsOpen(false);
    },
    [onSelect],
  );

  const onButtonLayout = useCallback((event: any) => {
    const { height, width, y, top, x } = event.nativeEvent.layout;
    setButtonLayout({ height, width, top, y, x });
  }, []);

  const handleNestedFormClose = useCallback(
    (newItem?: any) => {
      setIsNestedFormOpen(false);
      if (newItem && onNestedFormSuccess) {
        onNestedFormSuccess(newItem);
        // Don't close the main dropdown immediately - let user see the new item
      }
    },
    [onNestedFormSuccess],
  );

  // Clone nested form with onSuccess prop if it exists
  const wrappedNestedForm = useMemo(() => {
    if (!nestedForm || !onNestedFormSuccess) return nestedForm;

    // Clone the React element and inject the onSuccess prop
    if (isValidElement(nestedForm)) {
      return cloneElement(nestedForm, {
        onSuccess: handleNestedFormClose,
      } as any);
    }

    return nestedForm;
  }, [nestedForm, onNestedFormSuccess, handleNestedFormClose]);

  return (
    <>
      <View onLayout={onButtonLayout} className="my-1 flex-1 relative">
        {isWritable ? (
          <Text>Not Yet implemented</Text>
        ) : (
          <Pressable
            className="p-3 rounded border border-gray-300 bg-white items-center"
            onPress={toggleDropdown}
            style={Platform.OS === "web" ? { zIndex: isOpen ? 1000 : 1 } : undefined}
          >
            <Text selectable={false}>{selectedItem ? selectedItem.label : label ? label : "Select"}</Text>
          </Pressable>
        )}
      </View>

      {options && isOpen && (
        <ListContainer
          isModal={isModal}
          buttonLayout={buttonLayout}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          nestedForm={wrappedNestedForm}
          isNestedFormOpen={isNestedFormOpen}
          setIsNestedFormOpen={setIsNestedFormOpen}
          onNestedFormSuccess={handleNestedFormClose}
        >
          <RenderList groupedOptions={groupedOptions} options={options} isModal={isModal} onItemPress={onItemPress} />
        </ListContainer>
      )}
    </>
  );
}

function ListContainer({
  children,
  buttonLayout,
  isOpen,
  setIsOpen,
  isModal,
  nestedForm,
  isNestedFormOpen,
  setIsNestedFormOpen,
  onNestedFormSuccess,
}: ListContainerProps) {
  const handleNestedFormClose = useCallback(() => {
    setIsNestedFormOpen(false);
  }, [setIsNestedFormOpen]);

  return (
    <>
      {isModal ? (
        <MyModal isOpen={isOpen} setIsOpen={setIsOpen}>
          <>
            {nestedForm && (
              <MyModal isOpen={isNestedFormOpen} setIsOpen={handleNestedFormClose}>
                {nestedForm}
              </MyModal>
            )}
            <>
              {nestedForm && <Button label="Add New" onPress={() => setIsNestedFormOpen(true)} className="mb-2" />}
              {children}
            </>
          </>
        </MyModal>
      ) : (
        <View
          style={{
            width: buttonLayout.width,
            top: buttonLayout.y + buttonLayout.height,
            left: buttonLayout.x,
            zIndex: 9999,
            position: "absolute",
          }}
          className="bg-card shadow-md rounded-md"
        >
          {children}
        </View>
      )}
    </>
  );
}

function RenderList({ groupedOptions, isModal, options, onItemPress }: RenderListProps) {
  const renderItem = useCallback(
    ({ item }: { item: OptionItem | string | undefined }) => {
      if (typeof item === "string") {
        return (
          <>
            <Text selectable={false} className="p-2 bg-gray-100 text-dark text-sm text-center">
              {item}
            </Text>
            <View
              className={`flex-row flex-wrap border-b border-gray-300 w-full my-1 ${Platform.OS === "web" ? "items-center justify-center" : ""}`}
            >
              {options
                .filter(option => option.group === item)
                .map(option => (
                  <RenderOption key={option.id} isModal={isModal} option={option} onItemPress={onItemPress} isGrouped />
                ))}
            </View>
          </>
        );
      }

      return item ? <RenderOption isModal={isModal} option={item} onItemPress={onItemPress} /> : null;
    },
    [isModal, options, onItemPress],
  );

  const keyExtractor = useCallback(
    (item: OptionItem | string | undefined, index: number) =>
      index.toString() + (item ? (typeof item === "string" ? item : item.id) : ""),
    [],
  );

  return (
    <FlatList
      data={groupedOptions}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      className={`rounded-md ${isModal ? "max-h-[300px]" : "max-h-40 border border-gray-300"}`}
      contentContainerStyle={{
        backgroundColor: "white",
        padding: isModal ? 8 : 0,
        borderRadius: 8,
      }}
      showsVerticalScrollIndicator={true}
      nestedScrollEnabled={true}
    />
  );
}

const RenderOption = ({ isModal, option, onItemPress, isGrouped }: RenderOptionProps) => {
  const handlePress = useCallback(() => {
    if (!option.disabled) {
      onItemPress(option);
    }
  }, [option, onItemPress]);

  return (
    <Pressable
      key={option.id}
      className={`p-2 gap-2 items-center max-w-48 ${isModal ? "" : "flex-row items-center justify-center"} ${isGrouped ? "" : "border-b border-gray-300 m-auto"} ${option.disabled ? "opacity-50" : ""}`}
      disabled={option.disabled}
      onPress={handlePress}
    >
      {option.icon && (
        <MyIcon
          name={option.icon}
          className={`text-base ${option.iconColorClass ? option.iconColorClass : "text-black"}`}
        />
      )}
      <Text
        selectable={false}
        className={`text-base text-center ${option.disabled ? "text-muted" : option.textColorClass ? `text-${option.textColorClass}` : "text-dark"}`}
      >
        {option.label}
      </Text>
      {!isModal && option.details && (
        <Text className={`text-base ${option.disabled ? "text-muted" : "text-dark"}`}> - </Text>
      )}
      {option.details && (
        <Text selectable={false} className={`text-base text-center ${option.disabled ? "text-muted" : "text-dark"}`}>
          {option.details}
        </Text>
      )}
    </Pressable>
  );
};

export const MyCategoriesDropdown = ({
  selectedValue,
  categories,
  onSelect,
  isModal,
  label = "Category", // Added default label
  showClearButton, // Added
  onClear, // Added
}: {
  selectedValue: string | null | undefined; // More specific type
  categories: TransactionCategory[] | undefined; // Use specific type
  onSelect: (value: OptionItem | null) => any; // onSelect provides OptionItem or null
  isModal: boolean;
  label?: string; // Added label prop
  showClearButton?: boolean; // Added
  onClear?: () => void; // Added
}) => {
  return (
    <View className="flex-row items-end flex-grow">
      <DropdownField
        isModal={isModal}
        label={label} // Use the passed label
        selectedValue={selectedValue}
        options={
          categories?.map(category => ({
            // category is now TransactionCategory
            id: category.id,
            label: category.name ?? "Unnamed Category", // Handle possible null name
            value: category, // The whole category object can be the value
            icon: category.icon ?? undefined, // Handle possible null icon
            iconColorClass: `text-${category.color}`,
            group: category.group?.name ?? "Uncategorized", // Handle possible null group or group.name
          })) ?? []
        }
        groupBy="group"
        onSelect={onSelect} // Pass onSelect directly
      />
      {showClearButton && onClear && selectedValue && (
        <Pressable onPress={onClear} className="p-2 mb-3 ml-1 bg-gray-200 rounded">
          <MyIcon name="X" size={18} className="text-gray-600" />
        </Pressable>
      )}
    </View>
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
        { id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: isEdit && isAdjustmentDisabled },
        { id: "Initial", label: "Initial", value: "Initial", disabled: isEdit && isInitialDisabled },
        { id: "Refund", label: "Refund", value: "Refund", disabled: isEdit && isRefundDisabled },
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
          details: `${account.balance.toLocaleString("en-US", {
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
