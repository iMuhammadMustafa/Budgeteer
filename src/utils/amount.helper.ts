export type AmountMode = "plus" | "minus" | "transfer";

export interface ParsedAmount {
  amount: number;
  mode: AmountMode;
  /** Raw cleaned string – useful when the caller wants to preserve trailing decimals while typing */
  rawString: string;
}

/** Round to 2 decimal places. Use everywhere we persist or display a money value to avoid float drift. */
export function roundToCents(n: number | null | undefined): number {
  if (n === null || n === undefined || !Number.isFinite(n)) return 0;
  const rounded = Math.round(n * 100) / 100;
  return Object.is(n, -0) && rounded === 0 ? -0 : rounded;
}

/** Derive the visual mode for an amount value. `-0` counts as minus to preserve user intent. */
export function getAmountMode(amount: number | null | undefined): "plus" | "minus" {
  if (amount === null || amount === undefined) return "minus";
  if (amount < 0 || Object.is(amount, -0)) return "minus";
  return "plus";
}

/** Format an amount for display in a TextInput. Treats `-0` as the user having chosen minus with no digits yet. */
export function formatAmountForInput(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  if (amount === 0 && !Object.is(amount, -0)) return "";
  return String(Math.abs(amount));
}

/**
 * Parse a free-form amount input string into a signed number plus the implied mode.
 *
 * Rules:
 * - Strips non-numeric characters except `.` and a single leading `-`
 * - A leading `-` flips the mode to `"minus"` unless `allowNegativeFlip` is false
 *   (e.g. for Income or Transfer where the sign is fixed by type)
 * - Caps decimal places to 2
 * - Returns `mode` so callers can update their own mode state without re-reading the value
 */
export function parseAmountInput(
  value: string,
  currentMode: AmountMode,
  options: { allowNegativeFlip?: boolean } = {},
): ParsedAmount {
  const { allowNegativeFlip = true } = options;

  let cleanValue = value
    .replace(/[^0-9.-]/g, "")
    .replace(/(?!^)-/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^0+(?=\d)/, "");

  let nextMode: AmountMode = currentMode;
  if (cleanValue.startsWith("-")) {
    if (allowNegativeFlip) nextMode = "minus";
    cleanValue = cleanValue.replace("-", "");
  }

  if (cleanValue.includes(".")) {
    const parts = cleanValue.split(".");
    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + "." + parts[1].substring(0, 2);
    }
  }

  const parsed = parseFloat(cleanValue) || 0;
  const signed = nextMode === "minus" ? (parsed === 0 ? -0 : -parsed) : parsed;

  return { amount: signed, mode: nextMode, rawString: cleanValue };
}
