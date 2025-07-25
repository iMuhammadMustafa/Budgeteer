import React from "react";
import { View, Text, Pressable, ScrollView, Dimensions } from "react-native";
import { Svg, Path, Circle, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

// Custom SVG Logo Component
const BudgeteerLogo = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
        <Stop offset="100%" stopColor="#1D4ED8" stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
        <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
      </LinearGradient>
    </Defs>

    {/* Background Circle */}
    <Circle cx="50" cy="50" r="45" fill="url(#grad1)" />

    {/* Dollar Sign */}
    <Path
      d="M45 20 L45 25 M45 75 L45 80 M35 30 Q35 25 40 25 L55 25 Q60 25 60 30 Q60 35 55 35 L40 35 Q35 35 35 40 Q35 45 40 45 L55 45 Q60 45 60 50 Q60 55 55 55 L40 55 Q35 55 35 60 Q35 65 40 65 L55 65 Q60 65 60 70"
      stroke="#FFFFFF"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />

    {/* Chart bars */}
    <Rect x="70" y="40" width="4" height="20" fill="url(#grad2)" rx="2" />
    <Rect x="76" y="35" width="4" height="25" fill="url(#grad2)" rx="2" />
    <Rect x="82" y="30" width="4" height="30" fill="url(#grad2)" rx="2" />
  </Svg>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }) => (
  <View className="bg-white rounded-2xl p-6 shadow-lg mb-4 border border-gray-100">
    <View className="flex-row items-center mb-3">
      <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
        <Text className="text-blue-600 text-lg font-bold">{icon}</Text>
      </View>
      <Text className="text-lg font-bold text-gray-900 flex-1">{title}</Text>
    </View>
    <Text className="text-gray-600 text-sm leading-5">{description}</Text>
  </View>
);

// Stats Component
const StatCard = ({ number, label }) => (
  <View className="items-center">
    <Text className="text-2xl font-extrabold text-blue-600">{number}</Text>
    <Text className="text-gray-600 text-sm text-center">{label}</Text>
  </View>
);

export default function BudgeteerLanding({ session, router }) {
  const features = [
    {
      icon: "💳",
      title: "Smart Account Management",
      description: "Create and manage multiple accounts with real-time balance tracking",
    },
    {
      icon: "📊",
      title: "Budget & Expense Tracking",
      description: "Set budgets and track expenses with detailed analytics and insights",
    },
    {
      icon: "🔄",
      title: "Recurring Transactions",
      description: "Automate recurring income and expenses for effortless tracking",
    },
    {
      icon: "📈",
      title: "Expense Comparison",
      description: "Compare spending patterns across different time periods",
    },
    {
      icon: "🎯",
      title: "Goal Setting",
      description: "Set financial goals and track your progress with visual indicators",
    },
    {
      icon: "🔔",
      title: "Smart Notifications",
      description: "Get alerts for budget limits, bill reminders, and spending insights",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Hero Section */}
      <View className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-16 pb-12">
        <View className="items-center mb-8">
          <BudgeteerLogo size={100} />
          <Text className="text-4xl font-extrabold text-white mt-4 mb-2">Budgeteer</Text>
          <Text className="text-xl text-blue-100 text-center font-medium">Your Personal Finance Companion</Text>
        </View>

        <View className="items-center mb-8">
          <Text className="text-lg text-blue-100 text-center leading-6 mb-6 px-4">
            Take control of your finances with smart budgeting, expense tracking, and financial insights that help you
            achieve your goals.
          </Text>

          <Pressable
            className="bg-white px-8 py-4 rounded-full shadow-lg active:scale-95"
            onPress={() => (session && session.user ? router.replace("/Dashboard") : router.replace("/Login"))}
          >
            <Text className="text-blue-600 text-lg font-bold">
              {session && session.user ? "Go to Dashboard" : "Start Your Journey"}
            </Text>
          </Pressable>
        </View>

        {/* Stats Section */}
        <View className="flex-row justify-around bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <StatCard number="10K+" label="Active Users" />
          <StatCard number="$2M+" label="Money Tracked" />
          <StatCard number="4.8★" label="App Rating" />
        </View>
      </View>

      {/* Features Section */}
      <View className="px-6 py-12">
        <View className="items-center mb-8">
          <Text className="text-3xl font-extrabold text-gray-900 mb-2">Powerful Features</Text>
          <Text className="text-gray-600 text-center text-lg">Everything you need to master your finances</Text>
        </View>

        <View className="space-y-4">
          {features.map((feature, index) => (
            <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} />
          ))}
        </View>
      </View>

      {/* CTA Section */}
      <View className="bg-gradient-to-r from-green-500 to-blue-600 mx-6 rounded-3xl p-8 mb-8">
        <View className="items-center">
          <Text className="text-2xl font-extrabold text-white mb-2 text-center">Ready to Transform Your Finances?</Text>
          <Text className="text-green-100 text-center mb-6 text-lg">
            Join thousands of users who've taken control of their money
          </Text>

          <Pressable
            className="bg-white px-8 py-4 rounded-full shadow-lg active:scale-95"
            onPress={() => (session && session.user ? router.replace("/Dashboard") : router.replace("/Login"))}
          >
            <Text className="text-blue-600 text-lg font-bold">
              {session && session.user ? "Open Dashboard" : "Get Started Free"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Footer */}
      <View className="bg-gray-900 px-6 py-8">
        <View className="items-center">
          <BudgeteerLogo size={60} />
          <Text className="text-white text-lg font-bold mt-2 mb-1">Budgeteer</Text>
          <Text className="text-gray-400 text-center text-sm">Making financial wellness accessible to everyone</Text>
        </View>
      </View>
    </ScrollView>
  );
}
