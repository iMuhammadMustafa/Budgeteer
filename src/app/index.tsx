import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import CalculatorComponent from "../components/Calculator";
import MyDateTimePicker from "../components/MyDateTimePicker";
import dayjs from "dayjs";

export default function Index() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  if (!session || !session?.user) {
    router.replace("/Login");
  }

  return (
    <SafeAreaView className="justify-center items-center w-full">
      <ScrollView>
        <View>
          <Text className="color-primary-100">Welcome! {session?.user.email}</Text>
        </View>
        <Pressable className="p-2 my-1 bg-primary" onPress={() => router.replace("/Dashboard")}>
          <Text className="text-primary-foreground">Dashboard!</Text>
        </Pressable>

        <CalculatorComponent
          onSubmit={values => {
            console.log(values);
          }}
          currentValue={50}
        />

        <MyDateTimePicker
          label="Date"
          date={dayjs()}
          onChange={date => {
            console.log(date);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
