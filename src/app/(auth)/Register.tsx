import { supabase } from "@/src/lib/supabase";
import { useState } from "react";
import { Alert, Button, SafeAreaView, TextInput, View } from "react-native";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  return (
    <SafeAreaView className="h-full w-full md:w-auto">
      <TextInput placeholder="Email" onChangeText={text => setUser({ ...user, email: text })} />
      <TextInput placeholder="Password" onChangeText={text => setUser({ ...user, password: text })} />
      <TextInput placeholder="Confirm Password" onChangeText={text => setUser({ ...user, confirmPassword: text })} />
      <Button title="Sign Up" onPress={signUpWithEmail} disabled={loading} />
    </SafeAreaView>
  );
}
