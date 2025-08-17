import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import Landing from "@/src/components/pages/Landing";
import BudgeteerLanding from "@/src/components/pages/VLanding";
import { useEffect } from "react";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import migrations from "@/drizzle/migrations";
import SQLiteExample from "../components/examples/SQLiteExample";

export default function Index() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  return (
    <SafeAreaView className="flex-1 bg-background-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SQLiteExample />
        <View className="flex-1 justify-center items-center">
          {/* Landing Page */}
          {/* <Landing session={session} /> */}
          <BudgeteerLanding session={session} router={router} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
