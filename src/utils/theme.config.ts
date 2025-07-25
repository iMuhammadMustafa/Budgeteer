"use client";
import { vars } from "nativewind";
import { ThemeMode } from "../types/utils/Theme.Type";

export const lightVars = {
  "--background": "252 253 253",
  "--foreground": "2 9 9",
  "--muted": "229 235 235",
  "--muted-foreground": "84 100 100",
  "--popover": "248 251 251",
  "--popover-foreground": "1 4 4",
  "--card": "249 251 251",
  "--card-foreground": "1 4 4",
  "--border": "229 231 235",
  "--input": "229 231 235",
  "--primary": "94 200 201",
  "--primary-foreground": "8 32 33",
  "--secondary": "205 208 208",
  "--secondary-foreground": "51 56 56",
  "--accent": "205 208 208",
  "--accent-foreground": "51 56 56",
  "--destructive": "142 13 11",
  "--destructive-foreground": "251 208 208",
  "--ring": "124 222 223",
  "--radius": "0.5rem",

  "--color-primary-0": "179 179 179",
  "--color-primary-50": "153 153 153",
  "--color-primary-100": "128 128 128",
  "--color-primary-200": "115 115 115",
  "--color-primary-300": "102 102 102",
  "--color-primary-400": "82 82 82",
  "--color-primary-500": "51 51 51",
  "--color-primary-600": "41 41 41",
  "--color-primary-700": "31 31 31",
  "--color-primary-800": "13 13 13",
  "--color-primary-900": "10 10 10",
  "--color-primary-950": "8 8 8",

  /* Secondary  */
  "--color-secondary-0": "254 255 255",
  "--color-secondary-50": "241 242 242",
  "--color-secondary-100": "231 232 232",
  "--color-secondary-200": "219 219 219",
  "--color-secondary-300": "175 176 176",
  "--color-secondary-400": "114 115 115",
  "--color-secondary-500": "94 95 95",
  "--color-secondary-600": "81 82 82",
  "--color-secondary-700": "63 64 64",
  "--color-secondary-800": "39 38 38",
  "--color-secondary-900": "24 23 23",
  "--color-secondary-950": "11 12 12",

  /* Tertiary */
  "--color-tertiary-0": "255 250 245",
  "--color-tertiary-50": "255 242 229",
  "--color-tertiary-100": "255 233 213",
  "--color-tertiary-200": "254 209 170",
  "--color-tertiary-300": "253 180 116",
  "--color-tertiary-400": "251 157 75",
  "--color-tertiary-500": "231 129 40",
  "--color-tertiary-600": "215 117 31",
  "--color-tertiary-700": "180 98 26",
  "--color-tertiary-800": "130 73 23",
  "--color-tertiary-900": "108 61 19",
  "--color-tertiary-950": "84 49 18",

  /* Danger */
  "--color-danger-0": "254 233 233",
  "--color-danger-50": "254 226 226",
  "--color-danger-100": "254 202 202",
  "--color-danger-200": "252 165 165",
  "--color-danger-300": "248 113 113",
  "--color-danger-400": "239 68 68",
  "--color-danger-500": "230 53 53",
  "--color-danger-600": "220 38 38",
  "--color-danger-700": "185 28 28",
  "--color-danger-800": "153 27 27",
  "--color-danger-900": "127 29 29",
  "--color-danger-950": "83 19 19",

  /* Success */
  "--color-success-0": "228 255 244",
  "--color-success-50": "202 255 232",
  "--color-success-100": "162 241 192",
  "--color-success-200": "132 211 162",
  "--color-success-300": "102 181 132",
  "--color-success-400": "72 151 102",
  "--color-success-500": "52 131 82",
  "--color-success-600": "42 121 72",
  "--color-success-700": "32 111 62",
  "--color-success-800": "22 101 52",
  "--color-success-900": "20 83 45",
  "--color-success-950": "27 50 36",

  /* Warning */
  "--color-warning-0": "255 253 251",
  "--color-warning-50": "255 249 245",
  "--color-warning-100": "255 231 213",
  "--color-warning-200": "254 205 170",
  "--color-warning-300": "253 173 116",
  "--color-warning-400": "251 149 75",
  "--color-warning-500": "231 120 40",
  "--color-warning-600": "215 108 31",
  "--color-warning-700": "180 90 26",
  "--color-warning-800": "130 68 23",
  "--color-warning-900": "108 56 19",
  "--color-warning-950": "84 45 18",

  /* Info */
  "--color-info-0": "236 248 254",
  "--color-info-50": "199 235 252",
  "--color-info-100": "162 221 250",
  "--color-info-200": "124 207 248",
  "--color-info-300": "87 194 246",
  "--color-info-400": "50 180 244",
  "--color-info-500": "13 166 242",
  "--color-info-600": "11 141 205",
  "--color-info-700": "9 115 168",
  "--color-info-800": "7 90 131",
  "--color-info-900": "5 64 93",
  "--color-info-950": "3 38 56",

  /* Typography */
  "--color-typography-0": "254 254 255",
  "--color-typography-50": "245 245 245",
  "--color-typography-100": "229 229 229",
  "--color-typography-200": "219 219 220",
  "--color-typography-300": "212 212 212",
  "--color-typography-400": "163 163 163",
  "--color-typography-500": "140 140 140",
  "--color-typography-600": "115 115 115",
  "--color-typography-700": "82 82 82",
  "--color-typography-800": "64 64 64",
  "--color-typography-900": "38 38 39",
  "--color-typography-950": "23 23 23",

  /* Outline */
  "--color-outline-0": "253 254 254",
  "--color-outline-50": "243 243 243",
  "--color-outline-100": "230 230 230",
  "--color-outline-200": "221 220 219",
  "--color-outline-300": "211 211 211",
  "--color-outline-400": "165 163 163",
  "--color-outline-500": "140 141 141",
  "--color-outline-600": "115 116 116",
  "--color-outline-700": "83 82 82",
  "--color-outline-800": "65 65 65",
  "--color-outline-900": "39 38 36",
  "--color-outline-950": "26 23 23",

  /* Background */
  "--color-background-0": "255 255 255",
  "--color-background-50": "246 246 246",
  "--color-background-100": "242 241 241",
  "--color-background-200": "220 219 219",
  "--color-background-300": "213 212 212",
  "--color-background-400": "162 163 163",
  "--color-background-500": "142 142 142",
  "--color-background-600": "116 116 116",
  "--color-background-700": "83 82 82",
  "--color-background-800": "65 64 64",
  "--color-background-900": "39 38 37",
  "--color-background-950": "24 23 24",

  /* Background Special */
  "--color-background-danger": "254 241 241",
  "--color-background-warning": "255 244 235",
  "--color-background-success": "237 252 242",
  "--color-background-muted": "247 248 247",
  "--color-background-info": "235 248 254",

  /* Focus Ring Indicator  */
  "--color-indicator-primary": "55 55 55",
  "--color-indicator-info": "83 153 236",
  "--color-indicator-danger": "185 28 28",
};
export const darkVars = {
  "--background": "17 20 24" /* HSL(210 19% 8%) */,
  "--foreground": "255 255 255" /* HSL(0 0% 100%) */,
  "--muted": "34 38 43" /* HSL(210 12% 15%) */,
  "--muted-foreground": "155 166 176" /* HSL(210 12% 65%) */,
  "--popover": "10 13 15" /* HSL(210 19% 5%) */,
  "--popover-foreground": "255 255 255" /* HSL(0 0% 100%) */,
  "--card": "12 15 18" /* HSL(210 19% 6%) */,
  "--card-foreground": "255 255 255" /* HSL(0 0% 100%) */,
  "--border": "30 33 36" /* HSL(210 9% 13%) */,
  "--input": "37 41 44" /* HSL(210 9% 16%) */,
  "--primary": "18 110 90" /* HSL(167.37 71.99% 25.05%) */,
  "--primary-foreground": "255 255 255" /* HSL(0 0% 100%) */,
  "--secondary": "64 64 64" /* HSL(0 0% 25%) */,
  "--secondary-foreground": "217 217 217" /* HSL(0 0% 85%) */,
  "--accent": "48 59 70" /* HSL(210 19% 23%) */,
  "--accent-foreground": "203 212 220" /* HSL(210 19% 83%) */,
  "--destructive": "250 45 41" /* HSL(1 95% 57%) */,
  "--destructive-foreground": "255 255 255" /* HSL(0 0% 100%) */,
  "--ring": "255 255 255" /* HSL(0, 0%, 100%) */,

  "--color-primary-0": "130 130 130",
  "--color-primary-50": "148 148 148",
  "--color-primary-100": "158 158 158",
  "--color-primary-200": "179 179 179",
  "--color-primary-300": "199 199 199",
  "--color-primary-400": "230 230 230",
  "--color-primary-500": "240 240 240",
  "--color-primary-600": "250 250 250",
  "--color-primary-700": "252 252 252",
  "--color-primary-800": "253 253 253",
  "--color-primary-900": "253 252 252",
  "--color-primary-950": "253 252 252",

  /* Secondary  */
  "--color-secondary-0": "11 12 12",
  "--color-secondary-50": "24 23 23",
  "--color-secondary-100": "39 38 38",
  "--color-secondary-200": "63 64 64",
  "--color-secondary-300": "81 82 82",
  "--color-secondary-400": "94 95 95",
  "--color-secondary-500": "114 115 115",
  "--color-secondary-600": "175 176 176",
  "--color-secondary-700": "219 219 219",
  "--color-secondary-800": "231 232 232",
  "--color-secondary-900": "241 242 242",
  "--color-secondary-950": "254 255 255",

  /* Tertiary */
  "--color-tertiary-0": "84 49 18",
  "--color-tertiary-50": "108 61 19",
  "--color-tertiary-100": "130 73 23",
  "--color-tertiary-200": "180 98 26",
  "--color-tertiary-300": "215 117 31",
  "--color-tertiary-400": "231 129 40",
  "--color-tertiary-500": "251 157 75",
  "--color-tertiary-600": "253 180 116",
  "--color-tertiary-700": "254 209 170",
  "--color-tertiary-800": "255 233 213",
  "--color-tertiary-900": "255 242 229",
  "--color-tertiary-950": "255 250 245",

  /* danger */
  "--color-danger-0": "83 19 19",
  "--color-danger-50": "127 29 29",
  "--color-danger-100": "153 27 27",
  "--color-danger-200": "185 28 28",
  "--color-danger-300": "220 38 38",
  "--color-danger-400": "230 53 53",
  "--color-danger-500": "239 68 68",
  "--color-danger-600": "248 113 113",
  "--color-danger-700": "252 165 165",
  "--color-danger-800": "254 202 202",
  "--color-danger-900": "254 226 226",
  "--color-danger-950": "254 233 233",

  /* Success */
  "--color-success-0": "27 50 36",
  "--color-success-50": "20 83 45",
  "--color-success-100": "22 101 52",
  "--color-success-200": "32 111 62",
  "--color-success-300": "42 121 72",
  "--color-success-400": "52 131 82",
  "--color-success-500": "72 151 102",
  "--color-success-600": "102 181 132",
  "--color-success-700": "132 211 162",
  "--color-success-800": "162 241 192",
  "--color-success-900": "202 255 232",
  "--color-success-950": "228 255 244",

  /* Warning */
  "--color-warning-0": "84 45 18",
  "--color-warning-50": "108 56 19",
  "--color-warning-100": "130 68 23",
  "--color-warning-200": "180 90 26",
  "--color-warning-300": "215 108 31",
  "--color-warning-400": "231 120 40",
  "--color-warning-500": "251 149 75",
  "--color-warning-600": "253 173 116",
  "--color-warning-700": "254 205 170",
  "--color-warning-800": "255 231 213",
  "--color-warning-900": "255 249 245",
  "--color-warning-950": "255 253 251",

  /* Info */
  "--color-info-0": "3 38 56",
  "--color-info-50": "5 64 93",
  "--color-info-100": "7 90 131",
  "--color-info-200": "9 115 168",
  "--color-info-300": "11 141 205",
  "--color-info-400": "13 166 242",
  "--color-info-500": "50 180 244",
  "--color-info-600": "87 194 246",
  "--color-info-700": "124 207 248",
  "--color-info-800": "162 221 250",
  "--color-info-900": "199 235 252",
  "--color-info-950": "236 248 254",

  /* Typography */
  "--color-typography-0": "23 23 23",
  "--color-typography-50": "38 38 39",
  "--color-typography-100": "64 64 64",
  "--color-typography-200": "82 82 82",
  "--color-typography-300": "115 115 115",
  "--color-typography-400": "140 140 140",
  "--color-typography-500": "163 163 163",
  "--color-typography-600": "212 212 212",
  "--color-typography-700": "219 219 220",
  "--color-typography-800": "229 229 229",
  "--color-typography-900": "245 245 245",
  "--color-typography-950": "254 254 255",

  /* Outline */
  "--color-outline-0": "26 23 23",
  "--color-outline-50": "39 38 36",
  "--color-outline-100": "65 65 65",
  "--color-outline-200": "83 82 82",
  "--color-outline-300": "115 116 116",
  "--color-outline-400": "140 141 141",
  "--color-outline-500": "165 163 163",
  "--color-outline-600": "211 211 211",
  "--color-outline-700": "221 220 219",
  "--color-outline-800": "230 230 230",
  "--color-outline-900": "243 243 243",
  "--color-outline-950": "253 254 254",

  /* Background */
  "--color-background-0": "18 18 18",
  "--color-background-50": "39 38 37",
  "--color-background-100": "65 64 64",
  "--color-background-200": "83 82 82",
  "--color-background-300": "116 116 116",
  "--color-background-400": "142 142 142",
  "--color-background-500": "162 163 163",
  "--color-background-600": "213 212 212",
  "--color-background-700": "220 219 219",
  "--color-background-800": "242 241 241",
  "--color-background-900": "246 246 246",
  "--color-background-950": "254 254 254",

  /* Background Special */
  "--color-background-danger": "66 43 43",
  "--color-background-warning": "65 47 35",
  "--color-background-success": "28 43 33",
  "--color-background-muted": "51 51 51",
  "--color-background-info": "26 40 46",

  /* Focus Ring Indicator  */
  "--color-indicator-primary": "247 247 247",
  "--color-indicator-info": "161 199 245",
  "--color-indicator-danger": "232 70 69",
};

export const nativewindConfig = {
  light: vars(lightVars),
  dark: vars(darkVars),
};

export const convertThemeToReactNativeColors = (mode: ThemeMode) => {
  const styles = mode === "dark" ? darkVars : lightVars;

  const rgb = (color: string) => `rgb(${color.replace(/ /g, ",")})`;

  return {
    dark: mode === "dark",
    fonts: {
      body: "System", // Default system font for body
      heading: "System", // Default system font for headings
      monospace: "Courier", // Monospace font for code
      regular: { fontFamily: "System", fontWeight: "400" as const }, // Default system font
      medium: { fontFamily: "System", fontWeight: "500" as const }, // Medium weight
      bold: { fontFamily: "System", fontWeight: "700" as const }, // Bold weight
      heavy: { fontFamily: "System", fontWeight: "900" as const }, // Heavy weight
    },
    colors: {
      background: rgb(styles["--background"]),
      text: rgb(styles["--foreground"]),
      card: rgb(styles["--card"]),
      border: rgb(styles["--border"]),
      primary: rgb(styles["--primary"]),
      notification: rgb(styles["--destructive"]),
      // Add other React Native-specific colors here
      muted: rgb(styles["--muted"] || "128,128,128"),
      accent: rgb(styles["--accent"] || "0,123,255"),
    },
  };
};
export const convertThemeToRgb = (mode: ThemeMode) => {
  const styles = mode === "dark" ? darkVars : lightVars;
  const rgb = (color: string) => `rgb(${color.replace(/ /g, ",")})`;
  return Object.keys(styles).reduce((acc, key) => {
    acc[key] = rgb(styles[key]);
    return acc;
  }, {});
};

export const applyRootVariables = (mode: ThemeMode) => {
  const themeVars = mode === "dark" ? darkVars : lightVars;
  // const themeVars = convertThemeToRgb(mode);

  if (typeof document !== "undefined") {
    Object.keys(themeVars).forEach(key => {
      document.documentElement.style.setProperty(key, themeVars[key]);
    });
  }
};
