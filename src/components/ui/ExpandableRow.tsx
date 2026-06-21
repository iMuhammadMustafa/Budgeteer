/**
 * ExpandableRow — a ListRow header with a chevron toggle that reveals children
 * (e.g. a savings account expanding to its buckets). Composes ListRow (`bare`)
 * so it stays one card; controlled or uncontrolled.
 *
 *   <ExpandableRow iconName="PiggyBank" iconShape="circle" title="CapitalOne Savings"
 *     subtitle={<Text className="font-mono text-sm text-ink-mute">Balance: $40,675.77</Text>}
 *     actions={<IconButton icon="Pencil" … />}>
 *     …buckets…
 *   </ExpandableRow>
 */
import { type ReactNode, useState } from "react";
import { View } from "react-native";

import { Divider } from "./Divider";
import { IconButton } from "./IconButton";
import { ListRow } from "./ListRow";
import { cn } from "./utils/cn";

export interface ExpandableRowProps {
  title: string;
  subtitle?: ReactNode;
  iconName?: string;
  iconShape?: "tile" | "circle";
  iconColor?: string;
  iconBg?: string;
  /** Non-chevron actions shown after the chevron (refresh / edit / delete …). */
  actions?: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  children?: ReactNode;
  className?: string;
  testID?: string;
}

export function ExpandableRow({
  title,
  subtitle,
  iconName,
  iconShape,
  iconColor,
  iconBg,
  actions,
  expanded: controlled,
  defaultExpanded = false,
  onToggle,
  children,
  className,
  testID = "expandable-row",
}: ExpandableRowProps) {
  const [internal, setInternal] = useState(defaultExpanded);
  const isControlled = controlled !== undefined;
  const expanded = isControlled ? controlled : internal;

  const toggle = () => {
    const next = !expanded;
    if (!isControlled) setInternal(next);
    onToggle?.(next);
  };

  return (
    <View className={cn("overflow-hidden rounded-xl border border-border bg-surface", className)} testID={testID}>
      <ListRow
        bare
        title={title}
        subtitle={subtitle}
        iconName={iconName}
        iconShape={iconShape}
        iconColor={iconColor}
        iconBg={iconBg}
        right={
          <View className="flex-row items-center gap-1">
            <IconButton
              icon={expanded ? "ChevronDown" : "ChevronRight"}
              variant="ghost"
              size="xs"
              accessibilityLabel={expanded ? "Collapse" : "Expand"}
              onPress={toggle}
            />
            {actions}
          </View>
        }
      />
      {expanded ? (
        <View>
          <Divider />
          <View className="p-3">{children}</View>
        </View>
      ) : null}
    </View>
  );
}
