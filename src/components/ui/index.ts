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
export { SkeletonBlock, SkeletonRow, SkeletonGroup, type SkeletonBlockProps, type SkeletonGroupProps } from "./Skeleton";
export { Loader, type LoaderProps, type LoaderTone } from "./Loader";
export { EmptyState, type EmptyStateProps } from "./EmptyState";
export { ErrorState, type ErrorStateProps } from "./ErrorState";
export { triggerHaptic, type HapticType } from "./utils/haptic";
