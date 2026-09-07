import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { BarChart3, LogOut, Settings, Store } from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import "../global.css";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { typeface, useInter } from "../src/theme/typography";
import { NavigationBridge, setDrawerNavigation } from "../src/utils/drawerRef";
import { showToast } from "../src/utils/toast";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function roleLabel(role?: string) {
  if (role === "StoreOwner") return "Store owner";
  if (role === "Cashier") return "Cashier";
  if (role === "Admin") return "Admin";
  return "Staff";
}

function CustomDrawerContent(
  props: DrawerContentComponentProps,
): React.JSX.Element {
  const { logout, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const font = useInter();

  useEffect(() => {
    const bridge: NavigationBridge = {
      dispatch: props.navigation.dispatch,
      navigate: (name: string, params?: object) =>
        props.navigation.navigate(name, params),
      closeDrawer: props.navigation.closeDrawer,
    };
    setDrawerNavigation(bridge);
    return () => setDrawerNavigation(null);
  }, [props.navigation]);

  const handleLogout = useCallback(async (): Promise<void> => {
    try {
      await logout();
      showToast.success("Logged out");
    } catch {}
  }, [logout]);

  const navigateTo = useCallback(
    (path: string): void => {
      props.navigation.closeDrawer();
      router.push(path as never);
    },
    [props.navigation, router],
  );

  return (
    <View
      style={[
        styles.drawer,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Store size={18} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={styles.brandCopy}>
          <Text style={[styles.brandName, typeface(font.bold, "700")]}>
            BizFlow
          </Text>
          <Text
            style={[styles.brandMeta, typeface(font.medium, "500")]}
            numberOfLines={1}
          >
            {user?.fullName || user?.userName || roleLabel(user?.role)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.drawerScroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.section, typeface(font.bold, "700")]}>
          Management
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo("/(tabs)/reports")}
          style={styles.row}
          accessibilityLabel="Analytics"
        >
          <BarChart3 size={20} color={MUTED} strokeWidth={1.8} />
          <Text style={[styles.rowLabel, typeface(font.semibold, "600")]}>
            Analytics
          </Text>
        </TouchableOpacity>

        <Text style={[styles.section, typeface(font.bold, "700")]}>
          Account
        </Text>
        <TouchableOpacity
          onPress={() => navigateTo("/(tabs)/settings")}
          style={styles.row}
          accessibilityLabel="Settings"
        >
          <Settings size={20} color={MUTED} strokeWidth={1.8} />
          <Text style={[styles.rowLabel, typeface(font.semibold, "600")]}>
            Settings
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        onPress={() => {
          void handleLogout();
        }}
        style={styles.logout}
        accessibilityLabel="Logout"
      >
        <LogOut size={20} color="#E11D48" strokeWidth={1.8} />
        <Text style={[styles.logoutText, typeface(font.semibold, "600")]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutNav(): React.JSX.Element {
  const { token, isLoading } = useAuth();
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const router = useRouter();
  const isLargeScreen: boolean = width >= 768;

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup: boolean = segments[0] === "(tabs)";

    if (token && !inAuthGroup) {
      router.replace("/(tabs)/dashboard");
    } else if (!token && inAuthGroup) {
      router.replace("/");
    }
  }, [token, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={TINT} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flexOne}>
      <Drawer
        drawerContent={(props: DrawerContentComponentProps) => (
          <CustomDrawerContent {...props} />
        )}
        screenOptions={{
          headerShown: false,
          drawerType: "front",
          drawerStyle: {
            width: isLargeScreen ? 300 : "80%",
            backgroundColor: "#FAFBFD",
          },
          overlayColor: "rgba(15, 23, 42, 0.4)",
          sceneStyle: { backgroundColor: "#FAFBFD" },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerItemStyle: { display: "none" },
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="(tabs)"
          options={{ drawerLabel: "Home", title: "Dashboard" }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutNav />
          <Toast />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1, backgroundColor: "#FAFBFD" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFBFD",
  },
  drawer: {
    flex: 1,
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 18,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 12,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  brandCopy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  brandName: {
    fontSize: 17,
    color: INK,
    letterSpacing: -0.3,
  },
  brandMeta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
  },
  drawerScroll: {
    paddingBottom: 16,
  },
  section: {
    marginTop: 22,
    marginBottom: 4,
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: INK,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 15,
    color: "#E11D48",
  },
});
