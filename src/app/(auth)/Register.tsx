import supabase from "@/src/providers/Supabase";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, Text, TextInput } from "react-native";

const initailRegisterState = {
  id: GenerateUuid(),
  email: "",
  password: "",
  confirmPassword: "",
  tenantId: "",
};

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(initailRegisterState);
  const isValid = !!(
    !loading &&
    user.email &&
    user.password &&
    user.confirmPassword &&
    user.password === user.confirmPassword
  );
  const signUpWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: user?.email,
      password: user.password,
      options: {
        data: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          tenantid: user.tenantId || user.id,
        },
      },
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
    router.navigate("/Login");
  };

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
      <TextInput
        className="border rounded-lg bg-white my-2 p-4 text-lg"
        placeholder="Tenant Id"
        onChangeText={text => setUser({ ...user, tenantId: text })}
      />

      <Pressable
        className={`p-4 mb-4 bg-primary rounded-lg items-center ${isValid ? "" : "opacity-50"}`}
        onPress={signUpWithEmail}
        disabled={!isValid}
      >
        <Text className="text-foreground" selectable={false}>
          Register
        </Text>
      </Pressable>
      <Link className=" py-4 mb-4 bg-secondary rounded-lg items-center text-center" href="/Login">
        <Text className="text-foreground" selectable={false}>
          Login
        </Text>
      </Link>
    </SafeAreaView>
  );
}
