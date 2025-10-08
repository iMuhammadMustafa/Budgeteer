import Button from "@/src/components/elements/Button";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import supabase from "@/src/providers/Supabase";
import { StorageMode } from "@/src/types/StorageMode";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";

export default function Login() {
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { setStorageMode } = useStorageMode();
  const { setSession } = useAuth();

  const isValid = !loading && user.email.length > 0 && user.password.length > 0;

  const onTextChange = (field: "email" | "password", text: string) => {
    setUser(prev => ({ ...prev, [field]: text }));
  };

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: user?.password,
    });

    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }

    await setStorageMode(StorageMode.Cloud);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setSession(session, StorageMode.Cloud);
    setLoading(false);
    router.navigate("/Dashboard");
  };

  return (
    <View className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Button
        variant="ghost"
        label="Back to mode selection"
        onPress={() => router.navigate("/")}
        leftIcon="ArrowLeft"
        className="self-start text-blue-600 text-center"
      />

      <View className="flex-row items-center mb-6">
        <Text className="text-2xl mr-3">☁️</Text>
        <Text className="text-foreground text-2xl font-bold">Cloud Login</Text>
      </View>

      <Text className="text-foreground opacity-70 mb-6">Sign in to access your cloud-synced data</Text>

      <TextInput
        placeholder="Email"
        className="p-4 mb-4 border border-primary rounded-lg text-lg bg-white"
        onChangeText={text => onTextChange("email", text)}
        value={user.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        className="p-4 mb-4 border border-primary rounded-lg text-lg bg-white"
        onChangeText={text => onTextChange("password", text)}
        value={user.password}
      />

      <Button
        label={loading ? "Signing in..." : "Sign In"}
        onPress={signInWithEmail}
        disabled={!isValid}
        variant="primary"
        className="mb-4 bg"
      />
      <Link href="/Register" className="p-4 mb-4 bg-secondary rounded-lg items-center text-center">
        <Text className="text-foreground font-semibold" selectable={false}>
          Create Account
        </Text>
      </Link>

      <Text className="text-blue-500 text-center cursor-pointer" selectable={false}>
        Forgot Password?
      </Text>
    </View>
  );
}
