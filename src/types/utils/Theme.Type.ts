export type ThemeMode = "dark" | "light";

export type ThemeContextType = {
  theme: ThemeMode;
  isDarkMode: boolean;
  toggleTheme: () => void;
};
