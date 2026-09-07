import { AppTabBar } from "@/components/navigation/AppTabBar";
import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout(): React.JSX.Element {
  return (
    <Tabs
      initialRouteName="dashboard"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarLabel: "Stocks",
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Point of Sale",
          tabBarLabel: "POS",
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: "Promotions",
          tabBarLabel: "Promos",
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: "Customer Credits",
          tabBarLabel: "Credits",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{ href: null, headerShown: false }}
      />
      <Tabs.Screen
        name="reports"
        options={{ title: "Reports", href: null, headerShown: false }}
      />
    </Tabs>
  );
}

TabLayout.displayName = "TabLayout";
