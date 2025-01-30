import { supabase } from "@/src/lib/supabase";
import { useState } from "react";
import { Alert, TouchableOpacity, SafeAreaView, TextInput, View, Text } from "react-native";
import { router } from "expo-router";
import generateUuid from "@/src/lib/uuidHelper";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({
    id: generateUuid(),
    email: "",
    password: "",
    confirmPassword: "",
  });

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: user?.email,
      password: user.password,
      options: {
        data: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          tenantid: user.id,
        },
      },
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Text className="text-foreground text-2xl font-bold mb-10 text-center">Register</Text>
      <TextInput
        className="border rounded-lg bg-white my-2 p-4 text-lg"
        placeholder="Email"
        onChangeText={text => setUser({ ...user, email: text })}
      />
      <TextInput
        className="border rounded-lg bg-white my-2 p-4 text-lg"
        placeholder="Password"
        onChangeText={text => setUser({ ...user, password: text })}
      />
      <TextInput
        className="border rounded-lg bg-white my-2 p-4 text-lg"
        placeholder="Confirm Password"
        onChangeText={text => setUser({ ...user, confirmPassword: text })}
      />
      <TouchableOpacity
        className="py-4 my-2 mb-4 bg-primary rounded-lg items-center"
        onPress={signUpWithEmail}
        disabled={loading}
      >
        <Text className="text-foreground">Register</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className=" py-4 mb-4 bg-secondary rounded-lg items-center"
        onPress={() => router.push("/Login")}
      >
        <Text className="text-foreground">Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
