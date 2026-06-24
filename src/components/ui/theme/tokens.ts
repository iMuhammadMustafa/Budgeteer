/**
 * Budgeteer Design System — token source of truth.
 *
 * This is the ONE place the new "Sage Paper" token values live. Two consumers
 * are derived from it:
 *   1. The runtime `vars()` channels merged into `lightVars`/`darkVars` in
 *      `src/utils/theme.config.js` (so NativeWind classes like `bg-surface`,
 *      `text-ink`, `text-income` resolve).
 *   2. The literal palette exposed by `useTheme().colors` for chart/SVG/icon
 *      props that can't use a className.
 *
 * Ported from `design-system/theme/tokens.ts` (the read-only handoff reference).
 * Values mirror `design-system/global.css` exactly.
 */

export const palette = {
  light: {
    bg: "#F4F1E9",
    grid: "#EAE6DB",
    surface: "#FBFAF5",
    surfaceAlt: "#F0ECE1",
    border: "#E4E0D4",
    borderStrong: "#D7D2C4",
    ink: "#211F1A",
    inkMute: "#6B6759",
    inkFaint: "#9A9588",
    primary: "#1F9E84",
    primaryDeep: "#1A7D68",
    primarySoft: "#DCEFE9",
    income: "#2E9E6B",
    incomeSoft: "#D7EEDD",
    expense: "#DD6B5E",
    expenseSoft: "#F6DAD5",
    transfer: "#3B9DD6",
    transferSoft: "#DCEDF7",
    // Status-semantic tokens (canonical, generic). income/expense/transfer above
    // are finance aliases of success/danger/info (same colors). `warning` is new.
    success: "#2E9E6B",
    successSoft: "#D7EEDD",
    danger: "#DD6B5E",
    dangerSoft: "#F6DAD5",
    warning: "#C7941F",
    warningSoft: "#F6E7CC",
    info: "#3B9DD6",
    infoSoft: "#DCEDF7",
  },
  dark: {
    bg: "#121315",
    grid: "#1B1D20",
    surface: "#1B1D20",
    surfaceAlt: "#212428",
    border: "#2B2E33",
    borderStrong: "#3A3E44",
    ink: "#ECEEEF",
    inkMute: "#9DA2A7",
    inkFaint: "#6C7176",
    primary: "#2FBCA1",
    primaryDeep: "#4FC9B0",
    primarySoft: "#15302B",
    income: "#36BB7F",
    incomeSoft: "#14301F",
    expense: "#E87E70",
    expenseSoft: "#371F1C",
    transfer: "#57AEE5",
    transferSoft: "#13293A",
    success: "#36BB7F",
    successSoft: "#14301F",
    danger: "#E87E70",
    dangerSoft: "#371F1C",
    warning: "#E6B450",
    warningSoft: "#33291A",
    info: "#57AEE5",
    infoSoft: "#13293A",
  },
} as const;

export type ThemeName = keyof typeof palette;
export type ColorToken = keyof typeof palette.light;

/** Category accent colors (theme-independent fg + per-theme soft bg). */
export const categoryColors = {
  Groceries: { fg: "#E8857B", softLight: "#F6DAD5", softDark: "#3A211E" },
  Clothing: { fg: "#4FA3D9", softLight: "#DCEDF7", softDark: "#12283A" },
  Salary: { fg: "#2E9E6B", softLight: "#D7EEDD", softDark: "#14301F" },
  Income: { fg: "#2E9E6B", softLight: "#D7EEDD", softDark: "#14301F" },
  Rent: { fg: "#E8857B", softLight: "#F6DAD5", softDark: "#3A211E" },
  Bills: { fg: "#E4A24A", softLight: "#F6E7CC", softDark: "#33291A" },
  Water: { fg: "#4FB07A", softLight: "#D7EEDD", softDark: "#14301F" },
  Fuel: { fg: "#C89A52", softLight: "#F3E7CF", softDark: "#33291A" },
  Car: { fg: "#3B9DD6", softLight: "#DCEDF7", softDark: "#12283A" },
  Electricity: { fg: "#E4A24A", softLight: "#F6E7CC", softDark: "#33291A" },
  Entertainment: { fg: "#9B85D6", softLight: "#E7E0F6", softDark: "#241E3A" },
  Hobbies: { fg: "#E4A24A", softLight: "#F6E7CC", softDark: "#33291A" },
  "Dining Out": { fg: "#9B85D6", softLight: "#E7E0F6", softDark: "#241E3A" },
  Other: { fg: "#9B85D6", softLight: "#E7E0F6", softDark: "#241E3A" },
} as const;

/** Multi-series chart palette (theme-independent; distinct hues readable on paper + charcoal). */
export const chartPalette = [
  "#1F9E84", "#DD6B5E", "#3B9DD6", "#E4A24A", "#9B85D6",
  "#2E9E6B", "#E8857B", "#4FB0A0", "#C89A52", "#7C8CD9",
] as const;

/** Look up a default color by category label (the legacy chart dictionary fallback). */
export const categoryColorFor = (label?: string): string | undefined =>
  label ? (categoryColors as Record<string, { fg: string }>)[label]?.fg : undefined;

/**
 * Resolve a chart series color, in priority order:
 *   explicit datum color → category-label dictionary → palette cycled by index.
 * So charts always get distinct colors even when the data carries none.
 */
export const seriesColor = (index: number, explicit?: string | null, label?: string): string =>
  explicit ?? categoryColorFor(label) ?? chartPalette[index % chartPalette.length];

export const radii = {
  chip: 999,
  control: 11,
  card: 16,
  cardLg: 20,
  tile: 12,
} as const;

/** 4pt spacing scale (matches Tailwind's default gap / padding rhythm). */
export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
} as const;

export const typography = {
  families: {
    serif: "Newsreader_600SemiBold",
    serifRegular: "Newsreader_400Regular",
    sans: "HankenGrotesk_400Regular",
    sansMedium: "HankenGrotesk_500Medium",
    sansSemibold: "HankenGrotesk_600SemiBold",
    sansBold: "HankenGrotesk_700Bold",
    mono: "JetBrainsMono_500Medium",
    monoSemibold: "JetBrainsMono_600SemiBold",
  },
  scale: {
    display: 46,
    h1: 30,
    h2: 23,
    h3: 19,
    bodyLg: 16,
    body: 14,
    sm: 12.5,
    xs: 11,
  },
} as const;

/** A theme's resolved colors with widened string values (light & dark share this shape). */
export type ThemeColors = Record<ColorToken, string>;

/** Convenience: resolve the palette for a theme name. */
export const getColors = (theme: ThemeName): ThemeColors => palette[theme];

/* ------------------------------------------------------------------ *
 * Derivation helpers — drive the runtime CSS-variable injection from   *
 * the same single source above (see src/utils/theme.config.js).        *
 * ------------------------------------------------------------------ */

/** "#1F9E84" -> "31 158 132" (space-separated channels for `rgb(var(--x) / a)`). */
export const hexToRgbChannels = (hex: string): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
};

/** Maps a palette key -> the CSS variable name used by the Tailwind preset. */
const VAR_NAME: Record<ColorToken, string> = {
  bg: "--bg",
  grid: "--grid",
  surface: "--surface",
  surfaceAlt: "--surface-alt",
  border: "--border",
  borderStrong: "--border-strong",
  ink: "--ink",
  inkMute: "--ink-mute",
  inkFaint: "--ink-faint",
  primary: "--primary",
  primaryDeep: "--primary-deep",
  primarySoft: "--primary-soft",
  income: "--income",
  incomeSoft: "--income-soft",
  expense: "--expense",
  expenseSoft: "--expense-soft",
  transfer: "--transfer",
  transferSoft: "--transfer-soft",
  success: "--success",
  successSoft: "--success-soft",
  danger: "--danger",
  dangerSoft: "--danger-soft",
  warning: "--warning",
  warningSoft: "--warning-soft",
  info: "--info",
  infoSoft: "--info-soft",
};

/**
 * The new design-system CSS-variable channels for a theme, e.g.
 * `{ "--bg": "244 241 233", "--ink": "33 31 26", ... }`. Merge these into the
 * app's existing `lightVars`/`darkVars`. Shared names (`--primary`,
 * `--surface`, `--border`, `--border-strong`) intentionally take the new
 * values during coexistence.
 */
export const themeVars = (theme: ThemeName): Record<string, string> => {
  const colors = palette[theme];
  const out: Record<string, string> = {};
  (Object.keys(colors) as ColorToken[]).forEach((key) => {
    out[VAR_NAME[key]] = hexToRgbChannels(colors[key]);
  });
  return out;
};
