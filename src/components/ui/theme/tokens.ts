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

/**
 * Categorical accent palette — the "proper palette" for charts, category chips,
 * and account/category color pickers. Ten distinct hues, each tuned per theme
 * with a foreground (`fg`: fills/icons/text) and a soft background (`soft`).
 * Replaces the old hardcoded `categoryColors` name→color dictionary.
 *
 * A label is mapped to a swatch in priority order (see `accentFor`):
 *   1. a semantic pin (income→green, expense→coral, …) so meaningful categories
 *      stay on-message, else
 *   2. a stable hash of the label, so any arbitrary category gets a consistent
 *      (if arbitrary) color — no dictionary upkeep.
 */
export const accentPalette = {
  light: [
    { fg: "#1F9E84", soft: "#DCEFE9" }, // 0 teal (primary)
    { fg: "#DD6B5E", soft: "#F6DAD5" }, // 1 coral (expense / danger)
    { fg: "#3B9DD6", soft: "#DCEDF7" }, // 2 blue (transfer / info)
    { fg: "#E4A24A", soft: "#F6E7CC" }, // 3 amber (bills / warning)
    { fg: "#9B85D6", soft: "#E7E0F6" }, // 4 violet (entertainment)
    { fg: "#2E9E6B", soft: "#D7EEDD" }, // 5 green (income / success)
    { fg: "#E8857B", soft: "#F6DAD5" }, // 6 salmon
    { fg: "#4FB0A0", soft: "#D9EEEA" }, // 7 seafoam
    { fg: "#C89A52", soft: "#F3E7CF" }, // 8 ochre
    { fg: "#7C8CD9", soft: "#E0E4F7" }, // 9 periwinkle
  ],
  dark: [
    { fg: "#2FBCA1", soft: "#15302B" },
    { fg: "#E87E70", soft: "#371F1C" },
    { fg: "#57AEE5", soft: "#13293A" },
    { fg: "#E6B450", soft: "#33291A" },
    { fg: "#A896E0", soft: "#241E3A" },
    { fg: "#36BB7F", soft: "#14301F" },
    { fg: "#EC9488", soft: "#3A211E" },
    { fg: "#5FC0B0", soft: "#163530" },
    { fg: "#D4AA66", soft: "#33291A" },
    { fg: "#90A0E6", soft: "#222742" },
  ],
} as const;

export type AccentSwatch = { fg: string; soft: string };

/** Semantic pins: well-known category labels → accent-palette index (kept on-message). */
const ACCENT_SEMANTIC: Record<string, number> = {
  income: 5,
  salary: 5,
  wage: 5,
  savings: 5,
  water: 5,
  expense: 1,
  rent: 1,
  groceries: 1,
  mortgage: 1,
  transfer: 2,
  car: 2,
  clothing: 2,
  transport: 2,
  bills: 3,
  electricity: 3,
  gas: 3,
  utilities: 3,
  hobbies: 3,
  entertainment: 4,
  dining: 4,
  "dining out": 4,
  subscriptions: 4,
  fuel: 8,
  other: 9,
};

/** Stable, order-independent FNV-1a hash of a label → palette index. */
const hashIndex = (label: string, len: number): number => {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % len;
};

/** Accent-palette index for a label: semantic pin → stable hash (always resolves). */
const accentIndexFor = (label: string): number => {
  const key = label.trim().toLowerCase();
  const pinned = ACCENT_SEMANTIC[key];
  return pinned ?? hashIndex(key, accentPalette.light.length);
};

/** Resolve a label's accent swatch (fg + soft) for a theme — for chips/tiles/pickers. */
export const accentFor = (label: string, theme: ThemeName): AccentSwatch => accentPalette[theme][accentIndexFor(label)];

/**
 * Find the accent swatch matching a hex color stored in the DB (picked via ColorPicker,
 * which defaults to `accentPalette.light.map(c => c.fg)`). Checks both light & dark fg
 * values so a color saved under one theme resolves under either. Returns `undefined` when
 * the hex doesn't match any palette entry — callers should fall back to `accentFor(name)`.
 */
export const swatchForHex = (hex: string, theme: ThemeName): AccentSwatch | undefined => {
  const n = hex.toLowerCase();
  for (let i = 0; i < accentPalette.light.length; i++) {
    if (accentPalette.light[i].fg.toLowerCase() === n || accentPalette.dark[i].fg.toLowerCase() === n) {
      return accentPalette[theme][i];
    }
  }
  return undefined;
};

/** Multi-series chart palette (theme-independent fg hues) — the accent fg ramp. */
export const chartPalette = accentPalette.light.map(s => s.fg);

/**
 * Default fg color for a *semantically-pinned* category label (theme-independent),
 * else undefined — so unpinned labels fall through to index cycling in `seriesColor`,
 * keeping in-chart colors distinct. (Use `accentFor` for an always-resolved swatch.)
 */
export const categoryColorFor = (label?: string): string | undefined => {
  if (!label) return undefined;
  const idx = ACCENT_SEMANTIC[label.trim().toLowerCase()];
  return idx === undefined ? undefined : accentPalette.light[idx].fg;
};

/**
 * Resolve a chart series color: explicit datum color → palette cycled by index.
 * Deliberately skips `categoryColorFor`/semantic pins here — those map several
 * distinct labels to the same swatch (e.g. "Rent" and "Groceries" both pin to
 * index 1), which is fine for a single standalone chip/icon but breaks the one
 * guarantee a multi-slice chart needs: every slice in view gets a different
 * color. Index-cycling is the only thing that actually guarantees that.
 */
export const seriesColor = (index: number, explicit?: string | null, _label?: string): string =>
  explicit ?? chartPalette[index % chartPalette.length];

export const radii = {
  chip: 999,
  control: 11,
  card: 16,
  cardLg: 20,
  tile: 12,
} as const;

/** 4pt spacing scale (matches Tailwind's default gap / padding rhythm). */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
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
  (Object.keys(colors) as ColorToken[]).forEach(key => {
    out[VAR_NAME[key]] = hexToRgbChannels(colors[key]);
  });
  return out;
};
