import { Button, Input, Text as ThemedText } from "@/src/components/ui";
import { useAuth } from "@/src/providers/AuthProvider";
import { useStorageMode } from "@/src/providers/StorageModeProvider";
import supabase from "@/src/providers/Supabase";
import { StorageMode } from "@/src/types/StorageMode";
import { Link, router } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";

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
        leadingIcon="ArrowLeft"
        className="self-start text-blue-600 text-center px-0"
      />

      <View className="flex-row items-center mb-2">
        <ThemedText className="text-2xl mr-3">☁️</ThemedText>
        <ThemedText variant="h3" className="text-2xl">
          Cloud Login
        </ThemedText>
      </View>

      <ThemedText className="opacity-70 mb-6">Sign in to access your cloud-synced data</ThemedText>

      <Input
        placeholder="Email"
        containerClassName="mb-4"
        onChangeText={text => onTextChange("email", text)}
        value={user.email}
        keyboardType="email-address"
        autoCapitalize="none"
        testID="input-login-email"
      />
      <Input
        placeholder="Password"
        secureTextEntry
        containerClassName="mb-4"
        onChangeText={text => onTextChange("password", text)}
        value={user.password}
        testID="input-login-password"
      />

      <Button
        label={loading ? "Signing in..." : "Sign In"}
        onPress={signInWithEmail}
        disabled={!isValid}
        variant="primary"
        className="mb-4 bg"
      />
      {/* TODO: Create a Link Button that either wraps a button or take the styles of the button is in button component */}
      <Link className="py-2 mb-4 bg-secondary rounded-lg items-center text-center" href="/Register">
        <ThemedText selectable={false}>Register</ThemedText>
      </Link>

      <ThemedText className="text-blue-500 text-center cursor-pointer" selectable={false}>
        Forgot Password?
      </ThemedText>
    </View>
  );
}
