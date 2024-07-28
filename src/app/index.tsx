import { Link } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "../lib/supabase";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!session) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Text>Not logged in</Text>
        <Link href={"Register"}>
          <Text>Register</Text>
        </Link>
        <Link href={"Login"}>
          <Text>Login</Text>
        </Link>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}>
      <Text>Welcome {session.user.email}</Text>
      <Pressable onPress={() => supabase.auth.signOut()}>
        <Text>Sign Out</Text>
      </Pressable>
    </View>
  );
}
