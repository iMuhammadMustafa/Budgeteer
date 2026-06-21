/**
 * Single source for the app's navigation model — consumed by both the desktop
 * sidebar (drawer) and the mobile bottom tab bar.
 */
export type NavGroup = "MAIN" | "FINANCES" | "SYSTEM";

export type NavItem = {
  label: string;
  icon: string; // MyIcon (lucide) name
  path: string; // expo-router path
  matchSegment: string;
  isTabItem: boolean; // shown in the mobile bottom tab bar
  group: NavGroup;
};

export type NavSection = { title: NavGroup; items: NavItem[] };

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", icon: "House", path: "/Dashboard", matchSegment: "Dashboard", isTabItem: true, group: "MAIN" },
      { label: "Transactions", icon: "ArrowRightLeft", path: "/Transactions", matchSegment: "Transactions", isTabItem: true, group: "MAIN" },
      { label: "New Transaction", icon: "ListPlus", path: "/AddTransaction", matchSegment: "AddTransaction", isTabItem: true, group: "MAIN" },
      { label: "Recurrings", icon: "Clock10", path: "/Recurrings", matchSegment: "Recurrings", isTabItem: true, group: "MAIN" },
      { label: "Summary", icon: "Group", path: "/Summary", matchSegment: "Summary", isTabItem: true, group: "MAIN" },
    ],
  },
  {
    title: "FINANCES",
    items: [
      { label: "Accounts", icon: "Landmark", path: "/Accounts", matchSegment: "Accounts", isTabItem: false, group: "FINANCES" },
      { label: "Categories", icon: "ChartBarStacked", path: "/Categories", matchSegment: "Categories", isTabItem: false, group: "FINANCES" },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Settings", icon: "Settings", path: "/Settings", matchSegment: "Settings", isTabItem: false, group: "SYSTEM" },
      { label: "Restore", icon: "History", path: "/Restore", matchSegment: "Restore", isTabItem: false, group: "SYSTEM" },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(s => s.items);
export const TAB_ITEMS: NavItem[] = NAV_ITEMS.filter(i => i.isTabItem);
export const findNavItemBySegment = (segment?: string): NavItem | undefined =>
  segment ? NAV_ITEMS.find(i => i.matchSegment === segment) : undefined;
