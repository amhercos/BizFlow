import { typeface, useInter } from "@/src/theme/typography";
import { PromotionType } from "@/src/types/promotion";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TypeBadgeProps {
  type: PromotionType | string;
}

export default function TypeBadge({ type }: TypeBadgeProps) {
  const font = useInter();
  const isBulk = type === PromotionType.Bulk || type === "Bulk";
  const isBundle = type === PromotionType.Bundle || type === "Bundle";
  const isDiscount = type === PromotionType.Discount || type === "Discount";

  const label = isBulk
    ? "Bulk"
    : isBundle
      ? "Bundle"
      : isDiscount
        ? "Discount"
        : "Promo";

  return (
    <View style={styles.badge}>
      <Text style={[styles.text, typeface(font.medium, "500")]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8EEF8",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: {
    fontSize: 11,
    color: "#2563EB",
  },
});
