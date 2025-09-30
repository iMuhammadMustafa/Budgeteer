import Button from "@/src/components/Button";
import MyIcon from "@/src/components/MyIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import { useTheme } from "@/src/providers/ThemeProvider";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Drawer } from "expo-router/drawer";
import * as Updates from "expo-updates";
import { ActivityIndicator, Platform, Text, View } from "react-native";

export default function DrawerLayout() {
  console.log("This is the Drawer Layout");

  const { isDarkMode, toggleTheme } = useTheme();
  const { isLoading, session } = useAuth();

  if (isLoading || !session) return <ActivityIndicator className="flex-1" />;
  return (
    <Drawer
      screenOptions={{
        drawerType: "slide",
        headerTintColor: isDarkMode ? "white" : "black",
        headerRight: () => (
          <Button onPress={toggleTheme} rightIcon={isDarkMode ? "Sun" : "Moon"} variant="ghost" iconSize={24} />
        ),
      }}
      drawerContent={props => (
        <DrawerContentScrollView {...props} className="flex-1">
          <DrawerItemList {...props} />
          <Footer />
        </DrawerContentScrollView>
      )}
    >
      <Drawer.Screen
        name="(tabs)" // This is the name of the page and must match the url from root
        options={{
          drawerLabel: "Dashboard",
          title: "Main",
          drawerIcon: ({ color }: any) => <MyIcon name="House" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Accounts"
        options={{
          drawerLabel: "Accounts",
          title: "Accounts",
          drawerIcon: ({ color }: any) => <MyIcon name="Landmark" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Categories"
        options={{
          drawerLabel: "Categories",
          title: "Categories",
          drawerIcon: ({ color }: any) => <MyIcon name="ChartBarStacked" color={color} size={24} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        options={{
          drawerLabel: "Settings",
          title: "Settings",
          drawerIcon: ({ color }: any) => <MyIcon name="Settings" color={color} size={24} />,
        }}
      />
    </Drawer>
  );
}

const Footer = () => {
  const { isUpdateAvailable, isUpdatePending, isDownloading } = Updates.useUpdates();

  return (
    <View className="flex-row justify-around items-center py-2">
      <Text
        className="text-foreground text-center"
        onPress={async () => {
          if (Platform.OS !== "web") await Updates.checkForUpdateAsync();
        }}
      >
        Version 0.16.11
      </Text>
      {isUpdatePending && !isDownloading && (
        <Button onPress={async () => await Updates.reloadAsync()} variant="outline" rightIcon="Power" size="sm" />
      )}
      {isDownloading && <ActivityIndicator size="small" color="black" />}
      {isUpdateAvailable && !isUpdatePending && !isDownloading && (
        <Button
          onPress={async () => await Updates.fetchUpdateAsync()}
          variant="outline"
          rightIcon="CloudDownload"
          size="sm"
        />
      )}
    </View>
  );
};
