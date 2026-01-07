import React from "react";

export interface OptionItem {
  id: string;
  label: string;
  value: any;
  icon?: string;
  iconColorClass?: string;
  textColorClass?: string;
  disabled?: boolean;
  group?: string;
  details?: string;
}

export interface AddNewConfig {
  /** Label for the "Add New" button */
  label?: string;
  /** Icon for the "Add New" button */
  icon?: string;
  /** The entity type - used for display purposes in modal title */
  entityType?: string;
  /** Callback when a new item is successfully created */
  onCreated?: (newItem: any) => void;
  /** Render function for the form to show when adding a new item. This is required. */
  renderForm: (props: { onSuccess: (item: any) => void; onCancel: () => void }) => React.ReactNode;
}

export interface DropDownProps {
  /** The list of options to display */
  options: OptionItem[];
  /** Callback when an option is selected */
  onSelect: (item: OptionItem | null) => void;
  /** The currently selected value (by id) */
  selectedValue?: string | null;
  /** Label displayed when no option is selected */
  label: string;
  /** Force modal mode (default: modal on mobile, inline on web) */
  isModal?: boolean;
  /** Group options by this field */
  groupBy?: string;
  /** Allow typing in the dropdown (not yet implemented) */
  isWritable?: boolean;
  /** Configuration for adding new items */
  addNew?: AddNewConfig;
  /** Show a clear button when an item is selected */
  showClear?: boolean;
  /** Callback when the clear button is pressed */
  onClear?: () => void;
  /** Error message to display */
  error?: string;
  /** Whether the field has been touched */
  touched?: boolean;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Custom class name for the container */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export type RenderListProps = {
  groupedOptions: OptionItem[] | (string | undefined)[];
  isModal: boolean;
  options: OptionItem[];
  onItemPress: (item: OptionItem) => void;
  searchQuery?: string;
};

export type ListContainerProps = {
  isModal: boolean;
  children: React.ReactNode;
  buttonLayout: { height: number; width: number; top: number; y: number; x: number };
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onClose?: () => void;
  title?: string;
  showAddNew?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
};

export type RenderOptionProps = {
  isModal: boolean;
  option: OptionItem;
  onItemPress: (item: OptionItem) => void;
  isGrouped?: boolean;
  isSelected?: boolean;
};

export type SearchableDropdownItem = {
  id?: string | null;
  label: string;
  item: any;
};

// Quick form props for creating new entities inline
export interface QuickFormProps {
  onSuccess: (createdItem: any) => void;
  onCancel: () => void;
}

export interface QuickAccountFormProps extends QuickFormProps { }
export interface QuickAccountCategoryFormProps extends QuickFormProps { }
export interface QuickTransactionCategoryFormProps extends QuickFormProps { }
export interface QuickTransactionGroupFormProps extends QuickFormProps { }
