import { typeface, useInter } from "@/src/theme/typography";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Tag,
  type LucideIcon,
} from "lucide-react-native";
import React, { memo, useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const BAR_FILL = "#FFFFFF";
const POS_SIZE = 56;
const DIP = 34;
const BAR_HEIGHT = 58;

const SIDE_TABS: Record<string, { label: string; Icon: LucideIcon }> = {
  dashboard: { label: "Home", Icon: LayoutDashboard },
  inventory: { label: "Stocks", Icon: Package },
  promotions: { label: "Promos", Icon: Tag },
  credits: { label: "Credits", Icon: Receipt },
};

function notchPath(width: number, height: number) {
  const half = width / 2;
  return `
    M 0 0
    L ${half - 45} 0
    C ${half - 30} 0, ${half - 25} ${DIP}, ${half} ${DIP}
    C ${half + 25} ${DIP}, ${half + 30} 0, ${half + 45} 0
    L ${width} 0
    L ${width} ${height}
    L 0 ${height}
    Z
  `;
}

export const AppTabBar = memo(function AppTabBar({
  state,
  navigation,
  insets,
}: BottomTabBarProps) {
  const font = useInter();
  const { width } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  const left = state.routes.filter(
    (route) => route.name === "dashboard" || route.name === "inventory",
  );
  const right = state.routes.filter(
    (route) => route.name === "promotions" || route.name === "credits",
  );
  const posRoute = state.routes.find((route) => route.name === "sales");
  const posFocused = posRoute
    ? state.routes[state.index]?.key === posRoute.key
    : false;
  const barHeight = BAR_HEIGHT + Math.max(insets.bottom, 10);

  const goTo = (route: (typeof state.routes)[number], focused: boolean) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!focused && !event.defaultPrevented) {
      void Haptics.selectionAsync();
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <View style={[styles.wrap, { paddingTop: POS_SIZE / 2 }]}>
      <View style={[styles.barHost, { height: barHeight, width }]}>
        <Svg
          width={width}
          height={barHeight}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Path d={notchPath(width, barHeight)} fill={BAR_FILL} />
        </Svg>
        <View
          style={[
            styles.row,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          <View style={styles.cluster}>
            {left.map((route) => {
              const meta = SIDE_TABS[route.name];
              const focused = state.routes[state.index]?.key === route.key;
              return (
                <SideTab
                  key={route.key}
                  label={meta.label}
                  Icon={meta.Icon}
                  focused={focused}
                  fontFamily={focused ? font.semibold : font.medium}
                  onPress={() => goTo(route, focused)}
                  onLongPress={() =>
                    navigation.emit({
                      type: "tabLongPress",
                      target: route.key,
                    })
                  }
                />
              );
            })}
          </View>
          <View style={styles.posSlot} />
          <View style={styles.cluster}>
            {right.map((route) => {
              const meta = SIDE_TABS[route.name];
              const focused = state.routes[state.index]?.key === route.key;
              return (
                <SideTab
                  key={route.key}
                  label={meta.label}
                  Icon={meta.Icon}
                  focused={focused}
                  fontFamily={focused ? font.semibold : font.medium}
                  onPress={() => goTo(route, focused)}
                  onLongPress={() =>
                    navigation.emit({
                      type: "tabLongPress",
                      target: route.key,
                    })
                  }
                />
              );
            })}
          </View>
        </View>
      </View>

      {posRoute ? (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: posFocused }}
          accessibilityLabel="POS"
          onPress={() => goTo(posRoute, posFocused)}
          onLongPress={() =>
            navigation.emit({ type: "tabLongPress", target: posRoute.key })
          }
          style={[
            styles.pos,
            posFocused ? styles.posOn : styles.posOff,
            { left: (width - POS_SIZE) / 2 },
          ]}
        >
          <ShoppingCart
            size={22}
            color={posFocused ? "#FFFFFF" : INK}
            strokeWidth={2.4}
          />
        </Pressable>
      ) : null}
    </View>
  );
});

function SideTab({
  label,
  Icon,
  focused,
  fontFamily,
  onPress,
  onLongPress,
}: {
  label: string;
  Icon: LucideIcon;
  focused: boolean;
  fontFamily?: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
    >
      <Icon
        size={20}
        color={focused ? TINT : MUTED}
        strokeWidth={focused ? 2.2 : 1.8}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          focused && styles.labelOn,
          typeface(fontFamily, focused ? "600" : "500"),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "#FAFBFD",
  },
  barHost: {
    overflow: "visible",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  cluster: {
    flex: 1,
    flexDirection: "row",
  },
  posSlot: {
    width: 78,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 6,
  },
  label: {
    fontSize: 10,
    color: MUTED,
  },
  labelOn: {
    color: TINT,
  },
  pos: {
    position: "absolute",
    top: 0,
    width: POS_SIZE,
    height: POS_SIZE,
    borderRadius: POS_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  posOn: {
    backgroundColor: TINT,
  },
  posOff: {
    backgroundColor: "#FFFFFF",
  },
});
