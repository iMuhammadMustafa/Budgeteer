import React from "react";
import { View, Text, Image, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";

// Placeholder image for missing visuals
const Placeholder = ({ label }: { label: string }) => (
  <View
    style={{
      width: 128,
      height: 128,
      backgroundColor: "#F3F4F6",
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      marginLeft: 16,
    }}
  >
    <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center" }}>{label}</Text>
  </View>
);

export default function Landing({ session }: { session?: any }) {
  return (
    <ScrollView className="flex-1 bg-[#F8FAFC]" contentContainerStyle={{ flexGrow: 1 }}>
      {/* Section 1: Hero & Navigation Bar */}
      <View className="justify-center items-center px-6 pt-16 pb-12">
        <Image source={require("@/assets/images/logo.png")} className="w-28 h-28 mb-6" resizeMode="contain" />
        <Text className="text-4xl font-extrabold mb-4" style={{ color: "#3B82F6", fontFamily: "Poppins-ExtraBold" }}>
          Budgeteer
        </Text>
        <Text className="text-xl text-center mb-4 font-semibold" style={{ color: "#0F172A" }}>
          Financial clarity is finally here.
        </Text>
        <Text className="text-base text-center mb-8" style={{ color: "#334155" }}>
          Budgeteer gives you the tools to track your spending, save smarter, and reach your financial goals with
          confidence.
        </Text>
        <Pressable
          className="px-8 py-3 rounded-full shadow-hard-2 mb-4"
          style={{ backgroundColor: "#3B82F6" }}
          onPress={() => (session && session.user ? router.replace("/Dashboard") : router.replace("/Login"))}
        >
          <Text className="text-lg font-bold" style={{ color: "#FFF" }}>
            {session && session.user ? "Go to Dashboard" : "Get Started for Free"}
          </Text>
        </Pressable>
      </View>

      {/* Section 2: App Showcase */}
      <View className="items-center mb-12">
        <View
          className="shadow-lg rounded-3xl p-2"
          style={{
            backgroundColor: "#3B82F6",
            marginTop: -32,
            marginBottom: 24,
            width: "90%",
            alignSelf: "center",
          }}
        >
          {/* Use real image if available, else placeholder */}
          {require("@/assets/images/cards.png") ? (
            <Image source={require("@/assets/images/cards.png")} className="w-64 h-96" resizeMode="contain" />
          ) : (
            <Placeholder label="App Dashboard Mockup" />
          )}
        </View>
        <View
          className="rounded-2xl px-6 py-6"
          style={{
            backgroundColor: "#FFF",
            width: "90%",
            alignSelf: "center",
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 8,
            marginTop: -32,
          }}
        >
          <Text className="text-2xl font-bold mb-2 text-center" style={{ color: "#0F172A" }}>
            All your finances, in one smart place.
          </Text>
          <Text className="text-base text-center" style={{ color: "#334155" }}>
            Connect your accounts and see your complete financial picture in a single, intuitive dashboard.
          </Text>
        </View>
      </View>

      {/* Section 3: Feature Deep Dive */}
      <View
        className="px-4 mb-12"
        style={{
          backgroundColor: "#3B82F6",
          borderRadius: 24,
          width: "90%",
          alignSelf: "center",
          paddingVertical: 32,
          marginBottom: 32,
        }}
      >
        {/* Swiggly line scroll-spy placeholder */}
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 24, alignItems: "center" }}>
          <View style={{ width: 4, height: "100%", backgroundColor: "#A5B4FC", borderRadius: 2 }} />
          {/* Dot would animate in real implementation */}
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#FFF", marginTop: 32 }} />
        </View>
        {/* Feature 1 */}
        <View className="flex-row items-center mb-8 ml-8">
          <View className="flex-1">
            <Text className="text-xl font-bold mb-2" style={{ color: "#FFF" }}>
              Spend Smarter with AI Insights
            </Text>
            <Text className="text-base mb-2" style={{ color: "#F1F5F9" }}>
              Our smart AI analyzes your spending patterns and provides personalized tips to help you cut costs and save
              more, automatically.
            </Text>
          </View>
          {/* Use real image if available, else placeholder */}
          {require("@/assets/images/thumbnail.png") ? (
            <Image
              source={require("@/assets/images/thumbnail.png")}
              className="w-32 h-32 ml-4 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <Placeholder label="AI Insights Card" />
          )}
        </View>
        {/* Feature 2 */}
        <View className="flex-row items-center mb-8 ml-8">
          <View className="flex-1">
            <Text className="text-xl font-bold mb-2" style={{ color: "#FFF" }}>
              Effortless Budget & Expense Tracking
            </Text>
            <Text className="text-base mb-2" style={{ color: "#F1F5F9" }}>
              Set monthly or weekly budgets in seconds. We'll categorize your expenses and show you exactly where your
              money is going with detailed charts.
            </Text>
          </View>
          {require("@/assets/images/partial-react-logo.png") ? (
            <Image
              source={require("@/assets/images/partial-react-logo.png")}
              className="w-32 h-32 ml-4 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <Placeholder label="Budgeting Screen" />
          )}
        </View>
        {/* Feature 3 */}
        <View className="flex-row items-center mb-8 ml-8">
          <View className="flex-1">
            <Text className="text-xl font-bold mb-2" style={{ color: "#FFF" }}>
              Reach Your Goals, Faster
            </Text>
            <Text className="text-base mb-2" style={{ color: "#F1F5F9" }}>
              Saving for a vacation, a new car, or a down payment? Set your goals in Budgeteer and track your progress
              with motivating visual indicators.
            </Text>
          </View>
          {require("@/assets/images/cards.png") ? (
            <Image
              source={require("@/assets/images/cards.png")}
              className="w-32 h-32 ml-4 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <Placeholder label="Goals Progress" />
          )}
        </View>
        {/* Feature 4 */}
        <View className="flex-row items-center mb-8 ml-8">
          <View className="flex-1">
            <Text className="text-xl font-bold mb-2" style={{ color: "#FFF" }}>
              Automate and Organize
            </Text>
            <Text className="text-base mb-2" style={{ color: "#F1F5F9" }}>
              Add recurring transactions to automate your cash flow. Manage multiple accounts, from checking to credit
              cards, with real-time balance tracking.
            </Text>
          </View>
          {require("@/assets/images/profile.png") ? (
            <Image
              source={require("@/assets/images/profile.png")}
              className="w-32 h-32 ml-4 rounded-xl"
              resizeMode="cover"
            />
          ) : (
            <Placeholder label="Accounts & Recurring" />
          )}
        </View>
      </View>

      {/* Section 4: Final Call to Action & Footer */}
      <View style={{ backgroundColor: "#3B82F6" }} className="py-10 px-6 rounded-t-3xl">
        <Text className="text-2xl font-bold text-white text-center mb-4">Ready to take control of your finances?</Text>
        <Pressable
          className="bg-white px-8 py-3 rounded-full mx-auto mb-8"
          onPress={() => (session && session.user ? router.replace("/Dashboard") : router.replace("/Login"))}
        >
          <Text className="text-primary-900 text-lg font-bold">Get Started with Budgeteer Today</Text>
        </Pressable>
        <View className="flex-row justify-between items-center border-t border-blue-400 pt-6">
          {/* Column 1: Logo & Tagline */}
          <View className="flex-1">
            <Image source={require("@/assets/images/logo-small.png")} className="w-10 h-10 mb-2" resizeMode="contain" />
            <Text className="text-white text-xs">Budgeteer: Simple, smart, secure.</Text>
          </View>
          {/* Column 2: Links */}
          <View className="flex-1 items-center">
            <Text className="text-white text-xs mb-1">Features</Text>
            <Text className="text-white text-xs mb-1">Pricing</Text>
            <Text className="text-white text-xs">Contact</Text>
          </View>
          {/* Column 3: Social Icons */}
          <View className="flex-1 items-end flex-row space-x-2 justify-end">
            {/* Placeholder icons for X and Instagram */}
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#FFF",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 8,
              }}
            >
              <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>X</Text>
            </View>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#FFF",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>IG</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
