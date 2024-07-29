import { supabase } from "@/src/lib/supabase";
import { User } from "@/src/data/models/User";
import React, { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User>({
    email: "",
    password: "",
  });

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: user?.password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-2xl font-bold mb-6">Login</Text>
      <TextInput placeholder="Username" className=" p-4 mb-4 border border-teal-900 rounded-lg text-lg text-teal-900" />
      <TextInput placeholder="Password" secureTextEntry className=" p-4 mb-4 border  rounded-lg text-lg" />
      <TouchableOpacity className=" p-4 mb-4 bg-primary dark:bg-white rounded-lg items-center">
        <Text className=" text-white">Login</Text>
      </TouchableOpacity>
      <TouchableOpacity className=" p-4 mb-4 bg-gray-500 rounded-lg items-center">
        <Text className="text-white">Register</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text className="text-blue-500">Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}
