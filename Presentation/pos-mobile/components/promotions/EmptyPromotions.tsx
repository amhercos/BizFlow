import { typeface, useInter } from "@/src/theme/typography";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function EmptyPromotions() {
  const font = useInter();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, typeface(font.semibold, "600")]}>
        No deals yet
      </Text>
      <Text style={[styles.body, typeface(font.regular, "400")]}>
        Tap + to add a discount, bulk, or bundle promo.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 36,
  },
  title: {
    fontSize: 16,
    color: "#0F172A",
  },
  body: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
});
