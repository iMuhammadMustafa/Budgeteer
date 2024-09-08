import { router } from "expo-router";
import { SafeAreaView, Text, View, Image, ScrollView, LogBox } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";

import cards from "@/assets/images/cards.png";
import { useTheme } from "../providers/ThemeProvider";

import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import Icon from "../lib/IonIcons";
import { useNotifications } from "../providers/NotificationsProvider";
import Notification from "../components/Notification";
import dayjs from "dayjs";
import React, { useState } from "react";
import CalculatorModal from "../components/CalculatorModal";
import GptCalculator from "../components/GptCalculator";
import VCalc from "../components/VCalc";
import AutocompleteInput from "../components/VSearch";
import SearchableDropdown, { SearchableDropdownItem } from "../components/SearchableDropdown";
import { supabase, Transaction } from "../lib/supabase";
import { VictoryBar, VictoryChart, VictoryPie, VictoryTheme } from "victory-native";

export default function Index() {
  // const { toggleColorScheme, colorScheme, setColorScheme } = useColorScheme();
  const { notifications, addNotification, removeNotification, clearNotifications } = useNotifications();

  const { isDarkMode, toggleTheme } = useTheme();

  const { session } = useAuth();

  const [date, setDate] = useState(dayjs());

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
  ]);

  const [country, setCountry] = useState();
  const [selectedItem, setSelectedItem] = useState(null);

  // const fetchSuggestions = (text: string): string[] => {
  //   // In a real app, this would be an API call
  //   // await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  //   return ["Apple", "Banana", "Cherry", "Date", "Elderberry"]
  //     .filter(item => item.toLowerCase().includes(text.toLowerCase()))
  //     .map(item => ({ id: item, value: item }));
  // };

  const fetchTransactionsByDescription = async (text: string): Promise<SearchableDropdownItem[]> => {
    const { data, error } = await supabase
      .from("transactions")
      .select()
      .ilike("description", `%${text}%`)
      .order("date")
      .limit(7);

    if (error) throw error;

    return data.map(transaction => ({ id: transaction.id, label: transaction.description, item: transaction })) ?? [];
  };

  const onSelectSearch = (item: any) => {
    console.log(item);
  };
  const testData = [
    { name: "Category 1", sum: 50, color: "#ff0000" },
    { name: "Category 2", sum: 30, color: "#00ff00" },
    { name: "Category 3", sum: 20, color: "#0000ff" },
  ];

  const thisdata = [
    { x: 1, y: 13, label: "one" },
    { x: 2, y: 16, label: "two" },
    { x: 3, y: 14, label: "three" },
    { x: 4, y: 19, label: "four" },
  ];

  const handleClick = index => {
    setClickedIndex(clickedIndex === index ? null : index);
  };

  LogBox.ignoreLogs(["Require cycle: node_modules/victory"]);

  return (
    <SafeAreaView className="w-full h-full">
      <ScrollView>
        <View className="flex-col justify-center items-center">
          <Image source={cards} className="max-w-[250px] max-h-[250px]" resizeMode="contain" />

          <View>
            <Text className=" color-primary-100">Welcome! {session?.user.email}</Text>
            {notifications.length > 0 && <Text>{JSON.stringify(notifications)}</Text>}
          </View>

          <Notification />

          <View className="max-w-full ">
            {/* <VictoryChart width={350} theme={VictoryTheme.material}>
              <VictoryBar data={thisdata} x="quarter" y="earnings" />
            </VictoryChart> */}
          </View>
          {/* <SearchableDropdown
            searchAction={val => fetchTransactionsByDescription(val)}
            // initalValue={"Apple"}
            onSelectItem={onSelectSearch}
            onChange={val => console.log(val)}
          /> */}

          <AutocompleteInput />

          {/* <CalculatorModal />
          <GptCalculator /> */}

          <View className="mt-5 ">
            {/* <DateTimePicker
              mode="single"
              date={date}
              displayFullDays
              timePicker
              onChange={(params: any) => setDate(params.date)}
            /> */}
            {/* <View className="my-5">
          <Dropdown
            label="Country"
            placeholder="Select an option..."
            options={[
              { label: "Nigeria", value: "NG" },
              { label: "Åland Islands", value: "AX" },
              { label: "Algeria", value: "DZ" },
              { label: "American Samoa", value: "AS" },
              { label: "Andorra", value: "AD" },
            ]}
            isMultiple
            isSearchable
            autoCloseOnSelect
            selectedValue={country}
            onValueChange={value => setCountry(value)}
            primaryColor={"green"}
          />
        </View> */}
            {/* 
          <KeyboardAvoidingView style={{ margin: 50 }}>
            <AutocompleteDropdownContextProvider>
              <AutocompleteDropdown
                clearOnFocus={false}
                closeOnBlur={true}
                closeOnSubmit={false}
                initialValue={{ id: "2" }} // or just '2'
                onSelectItem={setSelectedItem}
                dataSet={[
                  { id: "1", title: "Alpha" },
                  { id: "2", title: "Beta" },
                  { id: "3", title: "Gamma" },
                ]}
              />
            </AutocompleteDropdownContextProvider>
          </KeyboardAvoidingView> */}

            {/* <DropDownPicker
          open={open}
          value={value}
          items={items}
          closeAfterSelecting
          // min={0}
          // max={5}
          multiple={true}
          searchable={true}
          // disableLocalSearch={true}
          mode="BADGE"
          searchPlaceholder="Search..."
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItems}
        /> */}
            <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Login")}>
              <ButtonText>Login!</ButtonText>
            </Button>
            <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Accounts")}>
              <ButtonText>Register!</ButtonText>
            </Button>
            <Button variant="solid" className="p-2 my-1" action="primary" onPress={() => router.push("/Dashboard")}>
              <ButtonText>Dashboard!</ButtonText>
            </Button>
            <Button variant="solid" className="p-2 my-1" action="primary" onPress={toggleTheme}>
              <ButtonIcon as={Icon} name={isDarkMode ? "Moon" : "Sun"} />
            </Button>
            <Button
              variant="solid"
              className="p-2 my-1"
              action="primary"
              onPress={() => addNotification({ message: "Hello", type: "success" })}
            >
              <ButtonText>Add Notification</ButtonText>
            </Button>
            <Button
              variant="solid"
              className="p-2 my-1"
              action="primary"
              onPress={() => removeNotification(notifications[0].id)}
            >
              <ButtonText>Remove Notification</ButtonText>
            </Button>
            <Button variant="solid" className="p-2 my-1" action="primary" onPress={clearNotifications}>
              <ButtonText>Clear Notifications</ButtonText>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
