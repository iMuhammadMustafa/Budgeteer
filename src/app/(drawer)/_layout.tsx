import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import Icon from "@/src/lib/IonIcons";
import { TouchableOpacity } from "react-native";
import { useTheme } from "@/src/providers/ThemeProvider";

export default function DrawerLayout() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerType: "slide",
          headerTintColor: isDarkMode ? "white" : "black",

          headerRight: () => {
            return (
              <TouchableOpacity
                onPress={() => {
                  toggleTheme();
                }}
              >
                <Icon
                  name={isDarkMode ? "Sun" : "Moon"}
                  size={24}
                  color={isDarkMode ? "white" : "black"}
                  style={{ marginRight: 30 }}
                />
              </TouchableOpacity>
            );
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)" // This is the name of the page and must match the url from root
          options={{
            drawerLabel: "Dashboard",
            title: "Main",
            drawerIcon: ({ color }) => <Icon name="House" color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="Accounts"
          options={{
            drawerLabel: "Accounts",
            title: "Accounts",
            drawerIcon: ({ color }) => <Icon name="Landmark" color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="Categories"
          options={{
            drawerLabel: "Categories",
            title: "Categories",
            drawerIcon: ({ color }) => <Icon name="ChartBarStacked" color={color} size={24} />,
          }}
        />
        <Drawer.Screen
          name="Settings"
          options={{
            drawerLabel: "Settings",
            title: "Settings",
            drawerIcon: ({ color }) => <Icon name="Settings" color={color} size={24} />,
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
