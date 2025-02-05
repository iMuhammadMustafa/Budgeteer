interface DropDownProps {
  options: Array<OptionItem>;
  onSelect: (item: OptionItem | null) => void;
  selectedValue?: string | null;
  label: string;
  isModal?: boolean;
  groupBy?: string;
  isWritable?: boolean;
}

interface OptionItem {
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
type RenderListProps = {
  groupedOptions: OptionItem[] | (string | undefined)[];
  isModal: boolean;
  options: OptionItem[];
  onItemPress: (item: OptionItem) => void;
};

type ListContainerProps = {
  isModal: boolean;
  children: React.ReactNode;
  buttonLayout: { height: number; width: number; top: number; y: number; x: number };
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
type RenderOptionProps = {
  isModal: boolean;
  option: OptionItem;
  onItemPress: (item: OptionItem) => void;
  isGrouped?: boolean;
};
