import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, FlatList, LayoutChangeEvent, Platform, Pressable, Text, TextInput, View } from "react-native";

import { AddNewConfig, DropDownProps, OptionItem } from "@/src/types/components/DropdownField.Types";
import { Account, TransactionCategory } from "@/src/types/database/Tables.Types";
import MyIcon from "../MyIcon";
import MyModal, { ModalWrapper } from "../MyModal";

const SCREEN_HEIGHT = Dimensions.get("window").height;

function DropdownField({
  options,
  onSelect,
  selectedValue,
  label,
  isModal: forceModal,
  groupBy,
  addNew,
  showClear = false,
  onClear,
  error,
  touched,
  placeholder,
  className = "",
  disabled = false,
}: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [buttonLayout, setButtonLayout] = useState({ height: 0, width: 0, top: 0, y: 0, x: 0 });
  const dropdownIdRef = useRef<string>(`dropdown-${Date.now()}-${Math.random()}`);
  const addNewIdRef = useRef<string>(`addnew-${Date.now()}-${Math.random()}`);

  const useModalMode = forceModal ?? Platform.OS !== "web";

  const selectedItem = useMemo(() => {
    if (!selectedValue || !options) return null;
    return options.find(opt => opt.id === selectedValue) ?? null;
  }, [selectedValue, options]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(query) ||
        opt.details?.toLowerCase().includes(query) ||
        opt.group?.toLowerCase().includes(query),
    );
  }, [options, searchQuery]);

  const filteredGroupedData = useMemo(() => {
    if (!groupBy) return filteredOptions;
    return [...new Set(filteredOptions.map(option => option.group))];
  }, [filteredOptions, groupBy]);

  // Handle outside click on web (inline mode only)
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!isOpen || useModalMode) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(`[data-dropdown-id="${dropdownIdRef.current}"]`)) {
        return;
      }
      setIsOpen(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isOpen, useModalMode]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    setSearchQuery("");
  }, [disabled]);

  const handleSelect = useCallback(
    (item: OptionItem) => {
      onSelect(item);
      setIsOpen(false);
      setSearchQuery("");
    },
    [onSelect],
  );

  const handleClear = useCallback(() => {
    onSelect(null);
    onClear?.();
  }, [onSelect, onClear]);

  const handleAddNew = useCallback(() => setIsAddNewOpen(true), []);

  const handleAddNewSuccess = useCallback(
    (newItem: any) => {
      setIsAddNewOpen(false);
      setIsOpen(false);
      addNew?.onCreated?.(newItem);
    },
    [addNew],
  );

  const handleAddNewCancel = useCallback(() => setIsAddNewOpen(false), []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { height, width, y, x } = event.nativeEvent.layout;
    if (Platform.OS === "web") {
      const target = event.target as any;
      if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        setButtonLayout({ height, width, top: rect.top, y: rect.top, x: rect.left });
        return;
      }
    }
    setButtonLayout({ height, width, top: y, y, x });
  }, []);

  const showError = error && touched;

  return (
    <View className={`my-1 flex-1 relative ${className}`}>
      <View
        onLayout={handleLayout}
        // @ts-ignore
        dataSet={{ dropdownId: dropdownIdRef.current }}
      >
        <Pressable
          className={`flex-row items-center justify-between p-3 rounded border ${showError ? "border-red-500" : "border-gray-300"
            } ${disabled ? "bg-gray-100" : "bg-white"}`}
          onPress={handleToggle}
          disabled={disabled}
        >
          <View className="flex-row items-center flex-1 gap-2">
            {selectedItem?.icon && (
              <MyIcon name={selectedItem.icon} className={selectedItem.iconColorClass ?? "text-gray-600"} size={18} />
            )}
            <Text
              className={`flex-1 ${selectedItem ? "text-dark" : "text-gray-400"} ${disabled ? "text-gray-400" : ""}`}
              numberOfLines={1}
              selectable={false}
            >
              {selectedItem?.label ?? placeholder ?? label}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            {showClear && selectedItem && (
              <Pressable
                onPress={e => {
                  e.stopPropagation?.();
                  handleClear();
                }}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MyIcon name="X" size={16} className="text-gray-400" />
              </Pressable>
            )}
            {addNew && (
              <Pressable
                onPress={e => {
                  e.stopPropagation?.();
                  handleAddNew();
                }}
                className="p-1 ml-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MyIcon name="Plus" size={16} className="text-primary" />
              </Pressable>
            )}
            <MyIcon name={isOpen ? "ChevronUp" : "ChevronDown"} size={18} className="text-gray-400" />
          </View>
        </Pressable>
      </View>

      {/* Error Message */}
      {showError && <Text className="text-red-500 text-xs mt-1">{error}</Text>}

      {/* Dropdown List */}
      {isOpen && (
        <DropdownList
          isModal={useModalMode}
          options={filteredOptions}
          groupedData={filteredGroupedData}
          groupBy={groupBy}
          buttonLayout={buttonLayout}
          onSelect={handleSelect}
          onClose={() => setIsOpen(false)}
          selectedValue={selectedValue}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showSearch={options.length > 5}
          addNew={addNew}
          onAddNew={handleAddNew}
          title={label}
        />
      )}

      {isAddNewOpen && addNew && (
        <MyModal
          isOpen={isAddNewOpen}
          setIsOpen={setIsAddNewOpen}
          onClose={handleAddNewCancel}
          title={addNew.label ?? `Add New ${addNew.entityType ?? "Item"}`}
        >
          {addNew.renderForm({ onSuccess: handleAddNewSuccess, onCancel: handleAddNewCancel })}
        </MyModal>
      )}
    </View>
  );
}

interface DropdownListProps {
  isModal: boolean;
  options: OptionItem[];
  groupedData: OptionItem[] | (string | undefined)[];
  groupBy?: string;
  buttonLayout: { height: number; width: number; top: number; y: number; x: number };
  onSelect: (item: OptionItem) => void;
  onClose: () => void;
  selectedValue?: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showSearch: boolean;
  addNew?: AddNewConfig;
  onAddNew: () => void;
  title: string;
}

function DropdownList({
  isModal,
  options,
  groupedData,
  groupBy,
  buttonLayout,
  onSelect,
  onClose,
  selectedValue,
  searchQuery,
  onSearchChange,
  showSearch,
  addNew,
  onAddNew,
  title,
}: DropdownListProps) {
  const listContent = (
    <>
      {showSearch && (
        <Pressable onPress={e => e.stopPropagation?.()} className="p-2 border-b border-gray-200">
          <TextInput
            className="p-2 bg-gray-50 rounded border border-gray-200 text-black"
            placeholder="Search..."
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={isModal}
            placeholderTextColor="#9CA3AF"
            onFocus={e => e.stopPropagation?.()}
          />
        </Pressable>
      )}

      {addNew && (
        <Pressable onPress={onAddNew} className="flex-row items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
          <MyIcon name={addNew.icon ?? "Plus"} size={18} className="text-primary" />
          <Text className="text-primary font-medium" selectable={false}>
            {addNew.label ?? `Add New ${addNew.entityType}`}
          </Text>
        </Pressable>
      )}

      <FlatList<OptionItem | string | undefined>
        data={groupBy ? groupedData : options}
        keyExtractor={(item, index) =>
          typeof item === "string" ? `group-${item}-${index}` : (item?.id ?? `option-${index}`)
        }
        renderItem={({ item }) => {
          if (typeof item === "string") {
            return (
              <>
                <Text selectable={false} className="p-2 bg-gray-100 text-gray-600 text-sm font-medium">
                  {item ?? "Other"}
                </Text>
                <View className="flex-row flex-wrap justify-center">
                  {options
                    .filter(opt => opt.group === item)
                    .map(opt => (
                      <DropdownOption
                        key={opt.id}
                        option={opt}
                        isSelected={opt.id === selectedValue}
                        onPress={() => onSelect(opt)}
                        isGrouped
                      />
                    ))}
                </View>
              </>
            );
          }
          if (!item) return null;
          return <DropdownOption option={item} isSelected={item.id === selectedValue} onPress={() => onSelect(item)} />;
        }}
        className={isModal ? "max-h-[300px]" : "max-h-48"}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="p-4 items-center">
            <Text selectable={false} className="text-gray-400">
              No options found
            </Text>
          </View>
        }
      />
    </>
  );

  if (isModal) {
    return (
      <ModalWrapper visible onClose={onClose} title={title}>
        {listContent}
      </ModalWrapper>
    );
  }

  const maxHeight = Math.min(SCREEN_HEIGHT - buttonLayout.y - buttonLayout.height - 20, 250);

  return (
    <View
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
      style={{
        top: buttonLayout.height + 4,
        left: 0,
        right: 0,
        maxHeight,
        zIndex: 9999,
      }}
    >
      {listContent}
    </View>
  );
}

interface DropdownOptionProps {
  option: OptionItem;
  isSelected: boolean;
  onPress: () => void;
  isGrouped?: boolean;
}

function DropdownOption({ option, isSelected, onPress, isGrouped }: DropdownOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={option.disabled}
      className={`p-3 ${isSelected ? "bg-primary/10" : ""} ${option.disabled ? "opacity-50" : ""
        } ${isGrouped ? "w-1/3 min-w-[100px] items-center" : "border-b border-gray-100"}`}
    >
      <View className={`flex-row items-center ${isGrouped ? "justify-center" : ""} gap-2`}>
        {option.icon && (
          <View className="w-6 items-center">
            <MyIcon name={option.icon} size={18} className={option.iconColorClass ?? "text-gray-600"} />
          </View>
        )}
        <View className={isGrouped ? "" : "flex-1"}>
          <Text
            selectable={false}
            className={`${option.disabled ? "text-gray-400" : option.textColorClass ? `text-${option.textColorClass}` : "text-dark"
              } ${isSelected ? "font-medium" : ""}`}
            numberOfLines={1}
          >
            {option.label}
          </Text>
          {option.details && (
            <Text selectable={false} className="text-gray-500 text-xs" numberOfLines={1}>
              {option.details}
            </Text>
          )}
        </View>
        {isSelected && <MyIcon name="Check" size={16} className="text-primary" />}
      </View>
    </Pressable>
  );
}

export const MyCategoriesDropdown = ({
  selectedValue,
  categories,
  onSelect,
  isModal,
  label = "Category",
  showClearButton,
  onClear,
}: {
  selectedValue: string | null | undefined;
  categories: TransactionCategory[] | undefined;
  onSelect: (value: OptionItem | null) => any;
  isModal: boolean;
  label?: string;
  showClearButton?: boolean;
  onClear?: () => void;
}) => {
  return (
    <View className="flex-row items-end flex-grow">
      <DropdownField
        isModal={isModal}
        label={label}
        selectedValue={selectedValue}
        options={
          categories?.map(category => ({
            id: category.id,
            label: category.name ?? "Unnamed Category",
            value: category,
            icon: category.icon ?? undefined,
            iconColorClass: `text-${category.color}`,
            group: category.group?.name ?? "Uncategorized",
          })) ?? []
        }
        groupBy="group"
        onSelect={onSelect}
        showClear={showClearButton}
        onClear={onClear}
      />
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

/**
 * Account Category Dropdown
 */
export const AccountCategoryDropdown = ({
  label = "Category",
  selectedValue,
  onSelect,
  categories,
  isModal,
}: {
  label?: string;
  selectedValue: any;
  onSelect: (item: OptionItem | null) => void;
  categories: any[];
  isModal: boolean;
}) => {
  return (
    <DropdownField
      isModal={isModal}
      label={label}
      selectedValue={selectedValue}
      options={
        categories?.map(category => ({
          id: category.id,
          label: category.name,
          value: category,
          icon: category.icon,
          group: category.type,
        })) ?? []
      }
      groupBy="group"
      onSelect={onSelect}
    />
  );
};

/**
 * Transaction Group Dropdown
 */
export const TransactionGroupDropdown = ({
  label = "Group",
  selectedValue,
  onSelect,
  groups,
  isModal,
}: {
  label?: string;
  selectedValue: any;
  onSelect: (item: OptionItem | null) => void;
  groups: any[];
  isModal: boolean;
}) => {
  return (
    <DropdownField
      isModal={isModal}
      label={label}
      selectedValue={selectedValue}
      options={
        groups?.map(group => ({
          id: group.id,
          label: group.name,
          value: group,
          icon: group.icon,
          group: group.type,
        })) ?? []
      }
      groupBy="group"
      onSelect={onSelect}
    />
  );
};

export default DropdownField;
