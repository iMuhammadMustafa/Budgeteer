import { useState } from "react";
import { Alert, SafeAreaView, Text, TextInput, Pressable } from "react-native";
import { Link } from "expo-router";
import supabase from "@/src/providers/Supabase";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(initialUserState);

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: user?.password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  };

  const isValid = !!(user.email && user.password && !loading);

  return (
    <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Text className="text-foreground text-2xl font-bold mb-10 text-center">Login</Text>
      <TextInput
        placeholder="Username"
        className="p-4 mb-4 border border-primary rounded-lg text-lg bg-white "
        onChangeText={text => setUser({ ...user, email: text })}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        className=" p-4 mb-4 border border-primary rounded-lg text-lg bg-white"
        onChangeText={text => setUser({ ...user, password: text })}
      />
      <Pressable
        className={`p-4 mb-4 bg-primary rounded-lg items-center ${isValid ? "" : "opacity-50"}`}
        onPress={signInWithEmail}
        disabled={!isValid}
      >
        <Text className="text-foreground" selectable={false}>
          Login
        </Text>
      </Pressable>
      <Link href="/Register" className="p-4 mb-4 bg-secondary rounded-lg items-center text-center">
        <Text className="text-foreground" selectable={false}>
          Register
        </Text>
      </Link>
      <Pressable>
        <Text className="text-blue-500" selectable={false}>
          Forgot Password?
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
const initialUserState = {
  email: "",
  password: "",
};
