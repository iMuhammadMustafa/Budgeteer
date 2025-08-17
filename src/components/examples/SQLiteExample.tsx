import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import { tasks, lists, Task } from "@/sqllite/schema";
import { eq } from "drizzle-orm";
import { getSQLiteDB, isSQLiteReady, initializeSQLite } from "@/src/providers/SQLite";

export const SQLiteExample: React.FC = () => {
  const [db, setDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [listName, setListName] = useState("");
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [availableLists, setAvailableLists] = useState<any[]>([]);

  // Initialize SQLite database
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!isSQLiteReady()) {
          await initializeSQLite();
        }

        const database = getSQLiteDB();
        setDb(database);
        setIsReady(true);
        console.log("SQLite database initialized in example");
      } catch (err) {
        console.error("Failed to initialize SQLite database:", err);
        setError(err instanceof Error ? err.message : "Unknown database error");
      } finally {
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Load initial data
  useEffect(() => {
    if (isReady && db) {
      loadLists();
      loadTasks();
    }
  }, [isReady, db]);

  const loadLists = async () => {
    if (!db) return;

    try {
      const listsData = await db.select().from(lists);
      setAvailableLists(listsData);
      if (listsData.length > 0 && !selectedListId) {
        setSelectedListId(listsData[0].id);
      }
    } catch (err) {
      console.error("Error loading lists:", err);
      Alert.alert("Error", "Failed to load lists");
    }
  };

  const loadTasks = async () => {
    if (!db) return;

    try {
      const tasksData = await db.select().from(tasks);
      setTasksList(tasksData);
    } catch (err) {
      console.error("Error loading tasks:", err);
      Alert.alert("Error", "Failed to load tasks");
    }
  };

  const createList = async () => {
    if (!db || !listName.trim()) return;

    try {
      await db.insert(lists).values({
        name: listName.trim(),
      });

      setListName("");
      await loadLists();
      Alert.alert("Success", "List created successfully!");
    } catch (err) {
      console.error("Error creating list:", err);
      Alert.alert("Error", "Failed to create list");
    }
  };

  const createTask = async () => {
    if (!db || !taskName.trim() || !selectedListId) return;

    try {
      await db.insert(tasks).values({
        name: taskName.trim(),
        list_id: selectedListId,
      });

      setTaskName("");
      await loadTasks();
      Alert.alert("Success", "Task created successfully!");
    } catch (err) {
      console.error("Error creating task:", err);
      Alert.alert("Error", "Failed to create task");
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!db) return;

    try {
      await db.delete(tasks).where(eq(tasks.id, taskId));
      await loadTasks();
      Alert.alert("Success", "Task deleted successfully!");
    } catch (err) {
      console.error("Error deleting task:", err);
      Alert.alert("Error", "Failed to delete task");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg">Loading SQLite database...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg text-red-500">Database Error:</Text>
        <Text className="text-sm text-red-400 mt-2">{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-lg">Database not ready</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold mb-4">SQLite + Drizzle Example</Text>

      {/* Create List Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Create New List</Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Enter list name"
            value={listName}
            onChangeText={setListName}
          />
          <TouchableOpacity className="bg-blue-500 rounded-lg px-4 py-2 justify-center" onPress={createList}>
            <Text className="text-white font-medium">Add List</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Task Section */}
      <View className="mb-6">
        <Text className="text-lg font-semibold mb-2">Create New Task</Text>

        {/* List Selector */}
        <View className="mb-2">
          <Text className="text-sm text-gray-600 mb-1">Select List:</Text>
          <View className="flex-row flex-wrap gap-2">
            {availableLists.map(list => (
              <TouchableOpacity
                key={list.id}
                className={`px-3 py-1 rounded-full border ${
                  selectedListId === list.id ? "bg-blue-500 border-blue-500" : "bg-gray-100 border-gray-300"
                }`}
                onPress={() => setSelectedListId(list.id)}
              >
                <Text className={`text-sm ${selectedListId === list.id ? "text-white" : "text-gray-700"}`}>
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Enter task name"
            value={taskName}
            onChangeText={setTaskName}
          />
          <TouchableOpacity
            className="bg-green-500 rounded-lg px-4 py-2 justify-center"
            onPress={createTask}
            disabled={!selectedListId}
          >
            <Text className="text-white font-medium">Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tasks List */}
      <View className="flex-1">
        <Text className="text-lg font-semibold mb-2">Tasks ({tasksList.length})</Text>
        <FlatList
          data={tasksList}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => {
            const taskList = availableLists.find(list => list.id === item.list_id);
            return (
              <View className="flex-row justify-between items-center p-3 border-b border-gray-200">
                <View className="flex-1">
                  <Text className="text-base font-medium">{item.name}</Text>
                  <Text className="text-sm text-gray-500">List: {taskList?.name || "Unknown"}</Text>
                </View>
                <TouchableOpacity className="bg-red-500 rounded-lg px-3 py-1" onPress={() => deleteTask(item.id)}>
                  <Text className="text-white text-sm">Delete</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="py-8 items-center">
              <Text className="text-gray-500">No tasks yet. Create your first task!</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

export default SQLiteExample;
