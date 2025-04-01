import { useEffect } from "react";
import { BackHandler, Platform, View } from "react-native";

import { TransactionSearchFormProps } from "@/src/types/pages/Transactions.types";
import TransactionSearchForm from "./SearchForm";
import MyModal from "../../MyModal";

export default function TransactionSearchModal({
  isOpen,
  setIsOpen,
  searchParams,
  accounts,
  categories,
  onSubmit,
  onClear,
}: TransactionSearchFormProps) {
  // Handle escape key and back button
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleBackButton = () => {
      if (isOpen) {
        setIsOpen(false);
        return true;
      }
      return false;
    };

    if (Platform.OS === "web") {
      window.addEventListener("keydown", handleEscKey);
    }

    const backHandler = Platform.OS === "android" 
      ? BackHandler.addEventListener("hardwareBackPress", handleBackButton)
      : undefined;

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
      
      if (Platform.OS === "web") {
        window.removeEventListener("keydown", handleEscKey);
      }
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <TransactionSearchForm
        filters={searchParams}
        accounts={accounts}
        categories={categories}
        onSubmit={filters => {
          onSubmit(filters);
        }}
        onClear={() => {
          onClear();
          setIsOpen(false);
        }}
      />
    </MyModal>
  );
}
