import { DrawerContentComponentProps } from "@react-navigation/drawer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { BarChart3, LogOut, Settings, Store } from "lucide-react-native";
import React, { memo, useCallback, useEffect } from "react";
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
import { NavigationBridge, setDrawerNavigation } from "../src/utils/drawerRef";
import { showToast } from "../src/utils/toast";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const SectionHeader = memo(({ title }: { title: string }) => (
  <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-3 px-2">
    {title}
  </Text>
));
SectionHeader.displayName = "SectionHeader";

interface DrawerItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

const DrawerItem = memo(({ icon, label, onPress }: DrawerItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center p-4 rounded-2xl active:bg-slate-100"
  >
    {icon}
    <Text className="ml-3 font-bold text-slate-700">{label}</Text>
  </TouchableOpacity>
));
DrawerItem.displayName = "DrawerItem";

function CustomDrawerContent(
  props: DrawerContentComponentProps,
): React.JSX.Element {
  const { logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.flexOne, { paddingTop: Math.max(insets.top, 20) }]}>
      <ScrollView
        contentContainerStyle={styles.drawerScroll}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-3 mb-8 px-2">
          <View className="bg-blue-600 p-2 rounded-xl shadow-sm">
            <Store color="white" size={24} />
          </View>
          <Text className="text-xl font-bold text-slate-900 tracking-tight">
            BizFlow
          </Text>
        </View>

        <SectionHeader title="Management" />
        <View className="gap-y-1 mb-8">
          <DrawerItem
            icon={<BarChart3 size={20} color="#64748b" />}
            label="Analytics"
            onPress={() => navigateTo("/(tabs)/reports")}
          />
        </View>

        <SectionHeader title="Account" />
        <View className="gap-y-1">
          <DrawerItem
            icon={<Settings size={20} color="#64748b" />}
            label="Settings"
            onPress={() => navigateTo("/(tabs)/settings")}
          />
        </View>

        <View className="mt-auto pt-6 border-t border-slate-100">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center p-4 rounded-2xl bg-rose-50 active:bg-rose-100"
          >
            <LogOut size={20} color="#e11d48" />
            <Text className="ml-3 font-bold text-rose-600">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
        <ActivityIndicator size="large" color="#2563eb" />
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
          drawerStyle: { width: isLargeScreen ? 300 : "80%" },
          overlayColor: "rgba(0, 0, 0, 0.4)",
          sceneStyle: { backgroundColor: "#ffffff" },
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
  flexOne: { flex: 1, backgroundColor: "white" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  drawerScroll: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
});
