/**
 * Budgeteer Design System (new) — public API barrel.
 *
 * Built from scratch for the redesign. Step 1 ships the theme foundation +
 * BrandSplash; component primitives (Text, Button, Card, …) are added per
 * sub-step in Step 3. Import from `@/src/components/ui`.
 */

// theme foundation
export * from "./theme/tokens";
export { useBudgeteerFonts } from "./theme/useBudgeteerFonts";

// splash
export { default as BrandSplash } from "./BrandSplash";

export { default as GridBackground } from "./GridBackground";

// primitives (Step 3)
export { Text, type TextVariant } from "./Text";
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
export { IconButton, type IconButtonProps, type IconButtonVariant, type IconButtonSize } from "./IconButton";
export { Badge, type BadgeProps, type BadgeTone } from "./Badge";
export { Card, type CardProps } from "./Card";
export { SegmentedControl, type Segment, type SegmentedControlProps } from "./SegmentedControl";
export { Divider, type DividerProps } from "./Divider";
export { Input, type InputProps } from "./Input";
export { ListRow, type ListRowProps, type AmountTone } from "./ListRow";
export { ExpandableRow, type ExpandableRowProps } from "./ExpandableRow";
export { ProgressBar, type ProgressBarProps } from "./ProgressBar";
export { Switch, type SwitchProps } from "./Switch";
export { Checkbox, type CheckboxProps } from "./Checkbox";
export { Radio, type RadioProps } from "./Radio";
export { Avatar, type AvatarProps } from "./Avatar";
export { Chip, type ChipProps } from "./Chip";
export { Pager, type PagerProps } from "./Pager";
export { SectionHeader, type SectionHeaderProps } from "./SectionHeader";
export { Pulse, type PulseProps } from "./Pulse";
export {
  SkeletonBlock,
  SkeletonRow,
  SkeletonGroup,
  type SkeletonBlockProps,
  type SkeletonGroupProps,
} from "./Skeleton";
export { Loader, type LoaderProps, type LoaderTone } from "./Loader";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { ErrorState, type ErrorStateProps } from "./ErrorState";
export { triggerHaptic, type HapticType } from "./utils/haptic";

// overlay core (Step 3 — Select + Modal): provider lives at src/providers/OverlayProvider
export { Dialog, type DialogProps } from "./overlay/Dialog";
export { Sheet, type SheetProps } from "./overlay/Sheet";
export { Popover, type PopoverProps } from "./overlay/Popover";
export { ResponsiveModal, type ResponsiveModalProps } from "./overlay/ResponsiveModal";
export { useConfirm, useAlert, type ConfirmOptions, type AlertOptions } from "./overlay/useConfirm";
export { useOverlayApi, type OverlayApi } from "./overlay/context";
export { type Anchor } from "./overlay/panels";
export { useNotify, type NotifyType, type NotifyOptions, type NotificationApi } from "./notifications/context";
export { ToastHost } from "./notifications/ToastHost";
export { Select, type SelectProps, type SelectOption, type SelectPresent } from "./Select";
export { ColorPicker, type ColorPickerProps } from "./ColorPicker";
export { IconPicker, FINANCE_ICONS, type IconPickerProps } from "./IconPicker";
export { QuickPills, type QuickPillsProps, type QuickPillOption } from "./QuickPills";
export {
  GroupedSelect,
  GroupedSelect as GroupedIconSelect,
  type GroupedSelectProps,
  type GroupedOption,
} from "./GroupedSelect";
export { SearchableSelect, type SearchableSelectProps, type SearchableSelectOption } from "./SearchableSelect";
export { DatePicker, type DatePickerProps } from "./DatePicker";
export { DateTimePicker, type DateTimePickerProps } from "./DateTimePicker";
export { GroupedInput, type GroupedInputProps } from "./GroupedInput";
export { TagInput, type TagInputProps } from "./TagInput";
export { NumericKeypad, type NumericKeypadProps, type NumericKeypadKey } from "./NumericKeypad";
export { AmountKeypadInput, type AmountKeypadInputProps, type AmountKeypadTone } from "./AmountKeypadInput";
export {
  MyCategoriesDropdown,
  AccountSelecterDropdown,
  ColorsPickerDropdown,
  MyTransactionTypesDropdown,
  type MyCategoriesDropdownProps,
  type AccountSelecterDropdownProps,
  type ColorsPickerDropdownProps,
  type MyTransactionTypesDropdownProps,
} from "./DomainSelects";

// secondary tabs + entity list (Step 3 — §9, replaces legacy MyTab/TabNavigation/TabRouting)
export {
  SecondaryTabBar,
  type SecondaryTabBarProps,
  type SecondaryTabVariant,
  type RouterTab,
  type InlineTab,
} from "./SecondaryTabBar";
export {
  useEntityList,
  EntityListItem,
  EntityListScreen,
  MyTab,
  type EntityListScreenProps,
  type MyTabProps,
  type EntityLike,
  type DependencyConfig,
  type EntityListState,
  type EntityListItemProps,
  type UseEntityListConfig,
} from "./entity-list";

// summary table (Step 3 — §10, rebuilt frozen-corner comparison matrix)
export {
  SummaryGrid,
  SummaryPeriodBar,
  type SummaryGridProps,
  type SummaryPeriodBarProps,
  type PeriodMeta,
  type SummaryRow,
  type TimePeriod,
} from "./SummaryTable";

// calculator (Step 3 — §10, safe-parser hook + combined component)
export {
  useCalculator,
  evaluateExpression,
  BUTTON_ROWS,
  Calculator,
  type UseCalculatorReturn,
  type CalculatorProps,
} from "./Calculator";

// charts (Step 3 — custom SVG/Views, themed; Donut + Bar first)
export { DonutChart, type DonutChartProps, type DonutDatum } from "./charts/DonutChart";
export { BarChart, type BarChartProps, type BarDatum } from "./charts/BarChart";
export { DoubleBarChart, type DoubleBarChartProps, type DoubleBarDatum } from "./charts/DoubleBarChart";
export { LineChart, type LineChartProps, type LineDatum } from "./charts/LineChart";
export { CalendarHeatmap, type CalendarHeatmapProps } from "./charts/CalendarHeatmap";
export { MiniBarChart, type MiniBarChartProps } from "./charts/MiniBarChart";
export { ChartLegend, type ChartLegendProps, type ChartLegendItem } from "./charts/ChartLegend";
export { ChartCard, type ChartCardProps, type ChartCardPeriod } from "./charts/ChartCard";
