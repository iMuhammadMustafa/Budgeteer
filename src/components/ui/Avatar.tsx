/**
 * Avatar — circular initials or icon badge (e.g. Restore-screen rows).
 *
 *   <Avatar name="Cash Wallet" />
 *   <Avatar iconName="User" />
 *
 * className vs style: static layout (centering) is a NativeWind className, but
 * `size` is a runtime number (→ width/height/borderRadius) and `bg`/`color` are
 * dynamic hex values, so those must be inline `style`/props — Tailwind classes
 * can't take runtime values. That split is intentional, not an oversight.
 *
 * NOTE: the `fg = color ?? colors.inkMute` resolution is the same "reach into
 * useTheme().colors and thread a raw hex into style/prop" pattern repeated across
 * many primitives (Button, Chip, ProgressBar, Loader, ListRow…). It's hard to
 * follow at scale — see docs/redesign/NOTES-color-prop-pattern.md for the problem
 * statement and candidate replacements (to decide before Step 4).
 */
import { Text, View } from "react-native";

import MyIcon from "@/src/components/elements/MyIcon";
import { useTheme } from "@/src/providers/ThemeProvider";
import { cn } from "./utils/cn";

export interface AvatarProps {
  name?: string;
  iconName?: string;
  size?: number;
  color?: string;
  bg?: string;
  className?: string;
  testID?: string;
}

export function Avatar({ name, iconName, size = 40, color, bg, className, testID = "avatar" }: AvatarProps) {
  const { colors } = useTheme();
  const fg = color ?? colors.inkMute;
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(w => w[0]?.toUpperCase() ?? "")
        .join("")
    : "";

  return (
    <View
      testID={testID}
      className={cn("items-center justify-center", className)}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? colors.surfaceAlt }}
    >
      {iconName ? (
        <MyIcon name={iconName} size={size * 0.45} color={fg} />
      ) : (
        <Text style={{ color: fg, fontSize: size * 0.38 }} className="font-sans-bold">
          {initials}
        </Text>
      )}
    </View>
  );
}
