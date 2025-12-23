import TabNavigation from "@/src/components/TabNavigation";
import { router, usePathname } from "expo-router";
import { useEffect } from "react";

const routes = [
  { name: "Accounts", path: "/Restore/Accounts" },
  { name: "Account Categories", path: "/Restore/AccountCategories" },
  { name: "Transactions", path: "/Restore/Transactions" },
  { name: "Transaction Categories", path: "/Restore/TransactionCategories" },
  { name: "Transaction Groups", path: "/Restore/TransactionGroups" },
  { name: "Recurrings", path: "/Restore/Recurrings" },
];

export default function RestoreLayout() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/Restore" || pathname === "/Restore/") {
      router.replace(routes[0].path as any);
    }
  }, [pathname]);

  return <TabNavigation routes={routes} currentRoute={pathname} />;
}
