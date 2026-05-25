export type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "AED", name: "UAE Dirham", symbol: "AED" },
  { code: "SAR", name: "Saudi Riyal", symbol: "SAR" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
];

const CURRENCY_BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

/**
 * Locale used to format each currency in its conventional position (prefix vs postfix).
 * USD/GBP/CAD/AUD etc. are prefix; EUR/PLN/SEK/NOK/DKK are postfix.
 * Falls back to en-US for unmapped codes.
 */
const CURRENCY_LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  JPY: "ja-JP",
  CNY: "zh-CN",
  CAD: "en-CA",
  AUD: "en-AU",
  CHF: "de-CH",
  INR: "en-IN",
  EGP: "ar-EG",
  AED: "ar-AE",
  SAR: "ar-SA",
  TRY: "tr-TR",
  BRL: "pt-BR",
  MXN: "es-MX",
  ZAR: "en-ZA",
  SGD: "en-SG",
  HKD: "zh-HK",
  KRW: "ko-KR",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  PLN: "pl-PL",
  NZD: "en-NZ",
};

export const DEFAULT_CURRENCY = "USD";

export function getCurrency(code: string | null | undefined): CurrencyOption {
  if (!code) return CURRENCY_BY_CODE.get(DEFAULT_CURRENCY)!;
  return CURRENCY_BY_CODE.get(code.toUpperCase()) ?? {
    code: code.toUpperCase(),
    name: code.toUpperCase(),
    symbol: code.toUpperCase(),
  };
}

export function getCurrencySymbol(code: string | null | undefined): string {
  return getCurrency(code).symbol;
}

export function formatMoney(
  amount: number | null | undefined,
  code: string | null | undefined,
  options?: { signed?: boolean; locale?: string },
): string {
  const value = Number(amount ?? 0);
  const currencyCode = (code || DEFAULT_CURRENCY).toUpperCase();
  const locale = options?.locale ?? CURRENCY_LOCALE[currencyCode] ?? "en-US";

  try {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value));
    if (options?.signed && value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    const fixed = Math.abs(value).toFixed(2);
    const sign = value < 0 ? "-" : options?.signed && value > 0 ? "+" : "";
    return `${sign}${symbol}${fixed}`;
  }
}

export const currencyDropdownOptions = CURRENCIES.map((c) => ({
  id: c.code,
  label: `${c.code} — ${c.name}`,
  value: c.code,
}));
