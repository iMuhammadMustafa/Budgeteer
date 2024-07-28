import { supabase } from "@/src/lib/supabase";
import { User } from "@/src/models/User";
import { useEffect, useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";

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
    <View>
      <TextInput placeholder="Email" onChangeText={text => setUser({ ...user, email: text })} />
      <TextInput placeholder="Password" onChangeText={text => setUser({ ...user, password: text })} />
      <Button title="Sign In" onPress={signInWithEmail} disabled={loading} />
    </View>
  );
}
