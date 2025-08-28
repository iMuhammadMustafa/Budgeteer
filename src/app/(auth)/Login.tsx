import { SafeAreaView, Text, TextInput, Pressable, View } from "react-native";
import { Link } from "expo-router";
import { StorageMode } from "@/src/types/StorageMode";
import useAuthViewModel from "./useAuthViewModel";

export default function Login() {
  const {
    handleModeSelection,
    handleBackToModeSelection,
    signInWithEmail,
    loading,
    user,
    selectedMode,
    onTextChange,
    isValid,
  } = useAuthViewModel();

  if (!selectedMode) {
    return <ModeSelectionComponent loading={loading} handleModeSelection={handleModeSelection} />;
  }

  return (
    <LoginForm
      loading={loading}
      user={user}
      onTextChange={onTextChange}
      handleBackToModeSelection={handleBackToModeSelection}
      signInWithEmail={signInWithEmail}
      isValid={isValid}
    />
  );
}

function ModeSelectionComponent({
  loading,
  handleModeSelection,
}: {
  loading: boolean;
  handleModeSelection: (mode: StorageMode) => void;
}) {
  const LOGIN_MODES = [
    {
      id: StorageMode.Cloud,
      title: "Login with Username and Password",
      description: "Connect to cloud database with full sync",
      icon: "☁️",
    },
    {
      id: StorageMode.Demo,
      title: "Demo Mode",
      description: "Try the app with sample data",
      icon: "🎮",
    },
    {
      id: StorageMode.Local,
      title: "Local Mode",
      description: "Store data locally on your device",
      icon: "💾",
    },
  ];

  return (
    <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Text className="text-foreground text-3xl font-bold mb-4 text-center">Welcome to Budgeteer</Text>
      <Text className="text-foreground text-lg mb-8 text-center opacity-70">Choose how you'd like to use the app</Text>

      <View className="space-y-4">
        {LOGIN_MODES.map(mode => (
          <Pressable
            key={mode.id}
            className="p-6 border border-primary rounded-lg bg-white shadow-sm"
            onPress={() => handleModeSelection(mode.id)}
            disabled={loading}
          >
            <View className="flex-row items-center mb-2">
              <Text className="text-2xl mr-3">{mode.icon}</Text>
              <Text className="text-foreground text-xl font-semibold flex-1">{mode.title}</Text>
            </View>
            <Text className="text-foreground opacity-70 ml-8">{mode.description}</Text>
          </Pressable>
        ))}
      </View>

      {loading && (
        <View className="mt-6 p-4 bg-blue-50 rounded-lg">
          <Text className="text-blue-600 text-center">Initializing storage mode...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function LoginForm({
  loading,
  user,
  onTextChange,

  handleBackToModeSelection,
  signInWithEmail,
  isValid,
}: {
  loading: boolean;
  user: { email: string; password: string };
  onTextChange: (field: "email" | "password", value: string) => void;
  handleBackToModeSelection: () => void;
  signInWithEmail: () => void;
  isValid: boolean;
}) {
  return (
    <SafeAreaView className="flex-col justify-center m-auto p-4 h-full w-full md:w-[50%]">
      <Pressable onPress={handleBackToModeSelection} className="mb-4">
        <Text className="text-blue-500 text-lg">← Back to mode selection</Text>
      </Pressable>

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
      <Pressable
        className={`p-4 mb-4 bg-primary rounded-lg items-center ${isValid ? "" : "opacity-50"}`}
        onPress={signInWithEmail}
        disabled={!isValid}
      >
        <Text className="text-foreground font-semibold" selectable={false}>
          {loading ? "Signing in..." : "Sign In"}
        </Text>
      </Pressable>

      <Link href="/Register" className="p-4 mb-4 bg-secondary rounded-lg items-center text-center">
        <Text className="text-foreground font-semibold" selectable={false}>
          Create Account
        </Text>
      </Link>

      <Pressable className="mt-2">
        <Text className="text-blue-500 text-center" selectable={false}>
          Forgot Password?
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
