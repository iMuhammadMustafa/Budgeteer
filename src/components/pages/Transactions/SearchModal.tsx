import { useEffect } from "react";
import { BackHandler, Platform, View, Modal, Pressable } from "react-native";

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
  useEffect(() => {
    const myFunction = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (Platform.OS === "web") {
      window.addEventListener("keydown", myFunction);
    }

    if (Platform.OS === "android") {
      BackHandler.addEventListener("hardwareBackPress", () => {
        setIsOpen(false);
        return true;
      });
    }
    return () => {
      if (Platform.OS === "android") {
        BackHandler.removeEventListener("hardwareBackPress", () => {
          setIsOpen(false);
          return true;
        });
      }
      if (Platform.OS === "web") {
        window.removeEventListener("keydown", myFunction);
      }
    };
  }, [isOpen]);

  return isOpen ? (
    <MyModal isOpen={isOpen} setIsOpen={setIsOpen}>
      <TransactionSearchForm
        filters={searchParams}
        accounts={accounts}
        categories={categories}
        onSubmit={filters => {
          onSubmit(filters);
        }}
        onClear={onClear}
      />
    </MyModal>
  ) : (
    <></>
  );
}
