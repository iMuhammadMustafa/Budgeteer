import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAuth } from "@/src/providers/AuthProvider";
import * as SQLite from "expo-sqlite";

import Landing from "@/src/components/pages/Landing";
import BudgeteerLanding from "@/src/components/pages/VLanding";
import { useEffect } from "react";

async function dbstuff() {
  const db = await SQLite.openDatabaseAsync("databaseName");

  // `execAsync()` is useful for bulk queries when you want to execute altogether.
  // Note that `execAsync()` does not escape parameters and may lead to SQL injection.
  await db.execAsync(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL, intValue INTEGER);
INSERT INTO test (value, intValue) VALUES ('test1', 123);
INSERT INTO test (value, intValue) VALUES ('test2', 456);
INSERT INTO test (value, intValue) VALUES ('test3', 789);
`);

  // `runAsync()` is useful when you want to execute some write operations.
  const result = await db.runAsync("INSERT INTO test (value, intValue) VALUES (?, ?)", "aaa", 100);
  console.log(result.lastInsertRowId, result.changes);
  await db.runAsync("UPDATE test SET intValue = ? WHERE value = ?", 999, "aaa"); // Binding unnamed parameters from variadic arguments
  await db.runAsync("UPDATE test SET intValue = ? WHERE value = ?", [999, "aaa"]); // Binding unnamed parameters from array
  await db.runAsync("DELETE FROM test WHERE value = $value", { $value: "aaa" }); // Binding named parameters from object
}

export default function Index() {
  const { session, isSessionLoading } = useAuth();

  if (isSessionLoading) return <ActivityIndicator />;

  useEffect(() => {
    dbstuff();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center items-center">
          {/* Landing Page */}
          {/* <Landing session={session} /> */}
          <BudgeteerLanding session={session} router={router} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
