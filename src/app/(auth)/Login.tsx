import Button from "@/src/components/elements/Button";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import supabase from "@/src/providers/Supabase";
import { StorageMode } from "@/src/types/StorageMode";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import ThemedText from "@/src/components/elements/ThemedText";
import ThemedInput from "@/src/components/elements/ThemedInput";

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
        <ThemedText className="text-2xl mr-3">☁️</ThemedText>
        <ThemedText variant="heading" className="text-2xl">Cloud Login</ThemedText>
      </View>

      <ThemedText className="opacity-70 mb-6">Sign in to access your cloud-synced data</ThemedText>

      <ThemedInput
        placeholder="Email"
        className="p-4 mb-4 border-primary text-lg"
        onChangeText={text => onTextChange("email", text)}
        value={user.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <ThemedInput
        placeholder="Password"
        secureTextEntry
        className="p-4 mb-4 border-primary text-lg"
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
        <ThemedText variant="subheading" selectable={false}>
          Create Account
        </ThemedText>
      </Link>

      <ThemedText className="text-blue-500 text-center cursor-pointer" selectable={false}>
        Forgot Password?
      </ThemedText>
    </View>
  );
}
