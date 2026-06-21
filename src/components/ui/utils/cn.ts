/**
 * cn — class merge for the design system, backed by tailwind-merge.
 *
 * Resolves conflicting utilities so a passed `className` reliably wins over a
 * component's base classes (last-wins). This fixes NativeWind not honoring
 * source order for same-property conflicts (e.g. a variant's `text-ink` beating
 * a passed `text-danger`).
 *
 * Our custom font-size tokens are registered so tailwind-merge treats them as
 * sizes (not text colors), and our semantic radii are registered so they merge
 * with the standard `rounded-*` scale.
 */
import { extendTailwindMerge } from "tailwind-merge";

export const cn = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "body-lg", "body", "overline", "2xs"] }],
    },
  },
});
