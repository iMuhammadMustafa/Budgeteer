export interface DropDownProps {
  options: OptionItem[];
  onSelect: (item: OptionItem | null) => void;
  selectedValue?: string | null;
  label: string;
  isModal?: boolean;
  groupBy?: string;
  isWritable?: boolean;
  nestedForm?: React.ReactNode;
  onNestedFormSuccess?: (newItem: any) => void;
}

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
export type RenderListProps = {
  groupedOptions: OptionItem[] | (string | undefined)[];
  isModal: boolean;
  options: OptionItem[];
  onItemPress: (item: OptionItem) => void;
};

export type ListContainerProps = {
  isModal: boolean;
  children: React.ReactNode;
  buttonLayout: { height: number; width: number; top: number; y: number; x: number };
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nestedForm?: React.ReactNode;
  isNestedFormOpen: boolean;
  setIsNestedFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onNestedFormSuccess?: (newItem: any) => void;
};
export type RenderOptionProps = {
  isModal: boolean;
  option: OptionItem;
  onItemPress: (item: OptionItem) => void;
  isGrouped?: boolean;
};

export type SearchableDropdownItem = {
  id?: string | null;
  label: string;
  item: any;
};
