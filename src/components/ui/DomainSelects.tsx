/**
 * DomainSelects — ui-backed replacements for the legacy domain dropdown wrappers
 * (`elements/dropdown/DropdownField` named exports). Same call signatures so the
 * 8 forms only swap their import; internally each is a thin `ui/Select`. onSelect
 * receives the legacy `OptionItem | null` shape (so the entity is on `.value`).
 *
 * Step 4 forms migration. The legacy wrappers stay until Step 5 cleanup.
 */
import type { OptionItem } from "@/src/types/components/forms.types";
import { usePrimaryCurrency } from "@/src/services/UserPreferences.Service";
import type { Account, TransactionCategory } from "@/src/types/database/Tables.Types";
import { useTheme } from "@/src/providers/ThemeProvider";
import { Select, type SelectOption } from "./Select";

/** Build an OptionItem from a SelectOption + its source list (legacy callback shape). */
function toOptionItem(options: OptionItem[], id: string | null): OptionItem | null {
  if (id == null) return null;
  return options.find(o => String(o.id) === id) ?? null;
}

/**
 * Resolve a stored color (a hex like "#2E9E6B" or a token fragment like "info-100"
 * / "success") to a literal hex for the swatch icon, or undefined when unknown.
 */
function useColorResolver() {
  const { colors } = useTheme();
  const byName: Record<string, string> = {
    info: colors.info,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    expense: colors.expense,
    income: colors.income,
    primary: colors.primary,
  };
  return (color?: string | null): string | undefined => {
    if (!color) return undefined;
    if (color.startsWith("#")) return color;
    const base = color.replace(/-\d+$/, "");
    return byName[base];
  };
}

function presentFor(isModal?: boolean) {
  return isModal ? ("sheet" as const) : undefined;
}

export interface MyCategoriesDropdownProps {
  selectedValue: string | null | undefined;
  categories: TransactionCategory[] | undefined;
  onSelect: (value: OptionItem | null) => any;
  isModal: boolean;
  label?: string;
  showClearButton?: boolean;
  onClear?: () => void;
}

export const MyCategoriesDropdown = ({
  selectedValue,
  categories,
  onSelect,
  isModal,
  label = "Category",
  showClearButton,
  onClear,
}: MyCategoriesDropdownProps) => {
  const resolveColor = useColorResolver();
  const items: OptionItem[] =
    categories?.map(category => ({
      id: category.id,
      label: category.name ?? "Unnamed Category",
      value: category,
      icon: category.icon ?? undefined,
      color: category.color ?? undefined,
      group: (category as { group?: { name?: string } }).group?.name ?? "Uncategorized",
    })) ?? [];

  const options: SelectOption[] = items.map(o => ({
    id: String(o.id),
    label: o.label,
    value: o.value,
    icon: o.icon,
    iconColor: resolveColor(o.color),
    group: (o as { group?: string }).group,
  }));

  return (
    <Select
      label={label}
      options={options}
      value={selectedValue ?? null}
      onChange={next => {
        if (next == null) {
          onClear?.();
          onSelect(null);
          return;
        }
        onSelect(toOptionItem(items, Array.isArray(next) ? next[0] : next));
      }}
      groupBy={o => o.group ?? ""}
      clearable={showClearButton}
      present={presentFor(isModal)}
      testID="dropdown-category"
    />
  );
};

export interface AccountSelecterDropdownProps {
  label?: string;
  selectedValue: any;
  onSelect: (item: OptionItem | null) => void;
  accounts: any;
  isModal: boolean;
  groupBy?: string;
  showClear?: boolean;
  onClear?: () => void;
}

export const AccountSelecterDropdown = ({
  label = "Account",
  selectedValue,
  onSelect,
  accounts,
  isModal,
  groupBy,
  showClear,
  onClear,
}: AccountSelecterDropdownProps) => {
  const { formatCurrency } = usePrimaryCurrency();
  const resolveColor = useColorResolver();
  const items: OptionItem[] =
    accounts?.map((account: Account & { category?: { name: string } }) => ({
      id: account.id,
      label: account.name,
      value: account,
      icon: account.icon ?? undefined,
      color: account.color ?? undefined,
      detail: formatCurrency(account.balance ?? 0, false),
      group: account.category?.name,
    })) ?? [];

  const options: SelectOption[] = items.map(o => ({
    id: String(o.id),
    label: o.label,
    value: o.value,
    icon: o.icon,
    iconColor: resolveColor(o.color),
    detail: (o as { detail?: string }).detail,
    group: (o as { group?: string }).group,
  }));

  return (
    <Select
      label={label}
      options={options}
      value={selectedValue ?? null}
      onChange={next => {
        if (next == null) {
          onClear?.();
          onSelect(null);
          return;
        }
        onSelect(toOptionItem(items, Array.isArray(next) ? next[0] : next));
      }}
      groupBy={groupBy ? o => o.group ?? "" : undefined}
      clearable={showClear}
      present={presentFor(isModal)}
      testID="dropdown-account"
    />
  );
};

export interface MyTransactionTypesDropdownProps {
  selectedValue: any;
  onSelect: (value: OptionItem | null) => any;
  isModal: boolean;
  isEdit: boolean;
  isAdjustmentDisabled?: boolean;
  isInitialDisabled?: boolean;
  isRefundDisabled?: boolean;
  isAdjustmentHidden?: boolean;
  isInitialHidden?: boolean;
  isRefundHidden?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}

export const MyTransactionTypesDropdown = ({
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
  showClear,
  onClear,
}: MyTransactionTypesDropdownProps) => {
  const items: OptionItem[] = [
    { id: "Income", label: "Income", value: "Income", disabled: isEdit },
    { id: "Expense", label: "Expense", value: "Expense", disabled: isEdit },
    { id: "Transfer", label: "Transfer", value: "Transfer", disabled: isEdit },
    ...(isAdjustmentHidden
      ? []
      : [{ id: "Adjustment", label: "Adjustment", value: "Adjustment", disabled: isEdit && isAdjustmentDisabled }]),
    ...(isInitialHidden
      ? []
      : [{ id: "Initial", label: "Initial", value: "Initial", disabled: isEdit && isInitialDisabled }]),
    ...(isRefundHidden
      ? []
      : [{ id: "Refund", label: "Refund", value: "Refund", disabled: isEdit && isRefundDisabled }]),
  ];

  const options: SelectOption[] = items.map(o => ({
    id: String(o.id),
    label: o.label,
    value: o.value,
    disabled: o.disabled,
  }));

  return (
    <Select
      label="Type"
      options={options}
      value={selectedValue ?? null}
      onChange={next => {
        if (next == null) {
          onClear?.();
          onSelect(null);
          return;
        }
        onSelect(toOptionItem(items, Array.isArray(next) ? next[0] : next));
      }}
      clearable={showClear}
      present={presentFor(isModal)}
      testID="dropdown-type"
    />
  );
};

const COLOR_OPTIONS: OptionItem[] = [
  { id: "info-100", label: "Info", value: "info-100", color: "info" },
  { id: "success-100", label: "Success", value: "success-100", color: "success" },
  { id: "warning-100", label: "Warning", value: "warning-100", color: "warning" },
  { id: "danger-100", label: "Error", value: "danger-100", color: "danger" },
];

export interface ColorsPickerDropdownProps {
  selectedValue: any;
  handleSelect: (item: OptionItem | null) => void;
}

export const ColorsPickerDropdown = ({ selectedValue, handleSelect }: ColorsPickerDropdownProps) => {
  const resolveColor = useColorResolver();
  return (
    <Select
      label="Color"
      options={COLOR_OPTIONS.map(o => ({
        id: String(o.id),
        label: o.label,
        value: o.value,
        icon: "Circle",
        iconColor: resolveColor(o.color),
      }))}
      value={selectedValue ?? null}
      onChange={next => handleSelect(toOptionItem(COLOR_OPTIONS, Array.isArray(next) ? next[0] : next))}
      testID="dropdown-color"
    />
  );
};
