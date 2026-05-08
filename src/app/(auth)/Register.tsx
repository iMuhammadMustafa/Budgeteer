import supabase from "@/src/providers/Supabase";
import GenerateUuid from "@/src/utils/uuid.Helper";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import ThemedText from "@/src/components/elements/ThemedText";
import ThemedInput from "@/src/components/elements/ThemedInput";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/src/components/elements/Button";

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
      <ThemedText variant="heading" className="text-2xl mb-10 text-center">Register</ThemedText>
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Email"
        onChangeText={text => setUser({ ...user, email: text })}
      />
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Password"
        onChangeText={text => setUser({ ...user, password: text })}
      />
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Confirm Password"
        onChangeText={text => setUser({ ...user, confirmPassword: text })}
      />
      <ThemedInput
        className="my-2 p-4 text-lg"
        placeholder="Tenant Id"
        onChangeText={text => setUser({ ...user, tenantId: text })}
      />

      <Button
        variant="primary"
        size="lg"
        hapticFeedback="success"
        className="p-4 mb-4 bg-primary rounded-lg items-center"
        onPress={signUpWithEmail}
        disabled={!isValid}
        label="Register"
        testID="btn-register"
      />
      <Link className=" py-4 mb-4 bg-secondary rounded-lg items-center text-center" href="/Login">
        <ThemedText selectable={false}>
          Login
        </ThemedText>
      </Link>
    </SafeAreaView>
  );
}
