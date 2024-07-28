import { useAuth } from "@/src/providers/AuthProvider";
import { Redirect, Slot } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <ActivityIndicator />;
  }
  if (session) {
    return <Redirect href="/" />;
  }

  return <Slot />;
}
