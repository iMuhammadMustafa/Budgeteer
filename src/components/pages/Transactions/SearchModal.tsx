import { useEffect } from "react";
import { BackHandler, Platform, View } from "react-native";
import Modal from "react-native-modal";

import { TransactionSearchFormProps } from "@/src/types/pages/Transactions.types";
import TransactionSearchForm from "./SearchForm";

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
    <Modal
      isVisible={isOpen}
      onDismiss={() => setIsOpen(false)}
      onBackButtonPress={() => setIsOpen(false)}
      // onRequestClose={() => setIsOpen(false)}
      onBackdropPress={() => setIsOpen(false)}
      className="rounded-md z-50 bg-white"
      // transparent
      // presentationClassName="bg-transparent"
    >
      <View className="p-3 bg-white rounded-md">
        <TransactionSearchForm
          filters={searchParams}
          accounts={accounts}
          categories={categories}
          onSubmit={filters => {
            onSubmit(filters);
          }}
          onClear={onClear}
        />
      </View>
    </Modal>
  ) : (
    <></>
  );
}
