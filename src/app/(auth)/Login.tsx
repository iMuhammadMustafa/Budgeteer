import { supabase } from "@/src/lib/supabase";
import { User } from "@/src/data/models/User";
import { useState } from "react";
import { Alert, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

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
      tenantid: "12345678"
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Text className="text-foreground text-2xl font-bold mb-10 text-center">Login</Text>
      <TextInput placeholder="Username" className="p-4 mb-4 border border-primary rounded-lg text-lg bg-white " onChangeText={text => setUser({ ...user, email: text })} />
      <TextInput placeholder="Password" secureTextEntry className=" p-4 mb-4 border border-primary rounded-lg text-lg bg-white" onChangeText={text => setUser({ ...user, password: text })}/>
      <TouchableOpacity className="p-4 mb-4 bg-primary rounded-lg items-center" onPress= {signInWithEmail} disabled={loading}>
        <Text className="text-foreground">Login</Text>
      </TouchableOpacity>
      <TouchableOpacity className=" p-4 mb-4 bg-secondary rounded-lg items-center" onPress={() =>router.push("/Register")}>
        <Text className="text-foreground">Register</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text className="text-blue-500">Forgot Password?</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
