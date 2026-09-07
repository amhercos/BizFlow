import { drawerNavigationRef } from "@/src/utils/drawerRef";
import { DrawerActions } from "@react-navigation/native";
import { Menu } from "lucide-react-native";
import React, { memo, useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";

export const DrawerMenuButton = memo(function DrawerMenuButton() {
  const handleOpenDrawer = useCallback(() => {
    drawerNavigationRef.current?.dispatch(DrawerActions.openDrawer());
  }, []);

  return (
    <TouchableOpacity
      onPress={handleOpenDrawer}
      style={styles.button}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityLabel="Open menu"
      accessibilityRole="button"
    >
      <Menu size={20} color="#0F172A" strokeWidth={2.2} />
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
});
