import { DrawerActions } from "@react-navigation/native";
import { Tabs } from "expo-router";
import {
  LayoutDashboard,
  Menu,
  Package,
  Receipt,
  ShoppingCart,
  Tag,
} from "lucide-react-native";
import React, { memo, useCallback, useMemo } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { TabBarCurve } from "../../components/navigation/TabBarCurve";
import { drawerNavigationRef } from "../../src/utils/drawerRef";

const DrawerTrigger = memo((): React.JSX.Element => {
  const handleOpenDrawer = useCallback((): void => {
    drawerNavigationRef.current?.dispatch(DrawerActions.openDrawer());
  }, []);

  return (
    <TouchableOpacity
      onPress={handleOpenDrawer}
      style={styles.headerButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Menu size={20} color="#0f172a" strokeWidth={2.2} />
    </TouchableOpacity>
  );
});
DrawerTrigger.displayName = "DrawerTrigger";

export default function TabLayout(): React.JSX.Element {
  const { width } = useWindowDimensions();
  const isTablet: boolean = width >= 768;

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: "#ffffff",
        height: Platform.OS === "ios" ? 110 : 70,
      },
      headerTitleStyle: styles.headerTitle,
      headerLeft: () => <DrawerTrigger />,
      tabBarActiveTintColor: "#2563eb",
      tabBarInactiveTintColor: "#0f172a",
      tabBarLabelStyle: styles.tabLabel,
      tabBarBackground: () => <TabBarCurve />,
      tabBarStyle: {
        height: 75,
        paddingBottom: Platform.OS === "ios" ? 25 : 10,
        borderTopWidth: 0,
        backgroundColor: "transparent",
        elevation: 0,
        paddingHorizontal: isTablet ? width * 0.15 : 0,
      },
    }),
    [width, isTablet],
  );

  return (
    <Tabs initialRouteName="dashboard" screenOptions={screenOptions}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color }: { color: string }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarLabel: "Stocks",
          tabBarIcon: ({ color }: { color: string }) => (
            <Package size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen
        name="sales"
        options={{
          title: "Point of Sale",
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <View
              style={[
                styles.actionButton,
                focused ? styles.actionActive : styles.actionInactive,
              ]}
            >
              <ShoppingCart
                size={22}
                color={focused ? "white" : "#0f172a"}
                strokeWidth={2.5}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="promotions"
        options={{
          title: "Promotions",
          tabBarLabel: "Promos",
          tabBarIcon: ({ color }: { color: string }) => (
            <Tag size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />
      <Tabs.Screen
        name="credits"
        options={{
          title: "Customer Credits",
          tabBarLabel: "Credits",
          tabBarIcon: ({ color }: { color: string }) => (
            <Receipt size={22} color={color} strokeWidth={2.2} />
          ),
        }}
      />

      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ title: "Reports", href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginLeft: 20,
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
  },
  headerTitle: { fontWeight: "800", fontSize: 17, color: "#0f172a" },
  tabLabel: { fontWeight: "700", fontSize: 10 },
  actionButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -25, // Aligns perfectly with the curve dip
    borderWidth: 4,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  actionActive: {
    backgroundColor: "#2563eb", // Blue for active
  },
  actionInactive: {
    backgroundColor: "#ffffff", // White for inactive
  },
});

TabLayout.displayName = "TabLayout";
