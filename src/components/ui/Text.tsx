/**
 * Text — typographic primitive. `variant` picks family + size + default color;
 * a passed `className` reliably overrides them (merged via cn / tailwind-merge).
 *
 *   <Text variant="h1">Dashboard</Text>
 *   <Text variant="money" className="text-success">+$5,348.98</Text>
 */
import { Text as RNText, type TextProps } from "react-native";

import { cn } from "./utils/cn";

export type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "bodyLg"
  | "body"
  | "label"
  | "caption"
  | "overline"
  | "money"
  | "moneyLg";

const VARIANTS: Record<TextVariant, string> = {
  display: "font-serif text-display text-ink",
  h1: "font-serif text-h1 text-ink",
  h2: "font-serif text-h2 text-ink",
  h3: "font-serif text-h3 text-ink",
  bodyLg: "font-sans text-body-lg text-ink",
  body: "font-sans text-body text-ink",
  label: "font-sans-semibold text-sm text-ink-mute",
  caption: "font-sans text-sm text-ink-mute",
  overline: "font-sans-semibold text-overline uppercase text-ink-faint",
  money: "font-mono text-body text-ink",
  moneyLg: "font-mono-semibold text-h1 text-ink",
};

export function Text({
  variant = "body",
  className = "",
  ...props
}: TextProps & { variant?: TextVariant; className?: string }) {
  return <RNText className={cn(VARIANTS[variant], className)} {...props} />;
}
