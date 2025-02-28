import { useEffect } from "react";
import { BackHandler, Platform, View, Modal } from "react-native";

import { TransactionSearchFormProps } from "@/src/types/pages/Transactions.types";
import TransactionSearchForm from "./SearchForm";
import { Pressable } from "react-native-gesture-handler";

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
      visible={isOpen}
      onDismiss={() => setIsOpen(false)}
      transparent={true}
      // presentationStyle="pageSheet"
      // onBackButtonPress={() => setIsOpen(false)}
      // onRequestClose={() => setIsOpen(false)}
      // onBackdropPress={() => setIsOpen(false)}
      // className="rounded-md z-50 bg-white"
      // transparent
      // presentationClassName="bg-transparent"
    >
      <Pressable
        className="bg-black bg-opacity-50 flex-1 justify-center items-center"
        onPressOut={() => setIsOpen(false)}
        onPress={() => {}}
      >
        <View className="m-auto p-4 rounded-md border border-muted flex-grow-0 max-w-xs overflow-x-hidden bg-card">
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
      </Pressable>
    </Modal>
  ) : (
    <></>
  );
}
