import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { Promotion } from "@/src/types/promotion";
import { resolvePromoType } from "@/src/utils/promotion-engine";
import { Tag } from "lucide-react-native";
import React, { memo, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const PROMO = "#15803D";
const PAD = 22;

interface PromoBarProps {
  promotions: Promotion[];
  onPress: (promotion: Promotion) => void;
}

function describePromo(promo: Promotion): string {
  const tier = [...(promo.tiers ?? [])].sort(
    (a, b) => a.quantity - b.quantity,
  )[0];
  if (!tier) return "";

  const type = resolvePromoType(promo);
  const main = promo.productName ?? "item";

  if (type === "bundle") {
    const tieUp = promo.tieUpProductName ?? "item";
    return `${tier.quantity || 1} ${main} + ${promo.tieUpQuantity || 1} ${tieUp} · ${formatPHP(tier.price)}`;
  }
  if (type === "bulk") {
    return `${tier.quantity} ${main} for ${formatPHP(tier.price)}`;
  }
  return `${main} ${formatPHP(tier.price)} each (min ${tier.quantity || 1})`;
}

export const PromoBar = memo(function PromoBar({
  promotions,
  onPress,
}: PromoBarProps) {
  const font = useInter();
  const live = useMemo(
    () => promotions.filter((p) => p.isActive && !p.isDeleted),
    [promotions],
  );

  if (live.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, typeface(font.semibold, "600")]}>
        Promos · tap to add to basket
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        keyboardShouldPersistTaps="handled"
      >
        {live.map((promo) => (
          <Pressable
            key={promo.id}
            onPress={() => onPress(promo)}
            style={styles.chip}
          >
            <View style={styles.icon}>
              <Tag size={14} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <View style={styles.copy}>
              <Text
                numberOfLines={1}
                style={[styles.name, typeface(font.semibold, "600")]}
              >
                {promo.name}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.detail, typeface(font.medium, "500")]}
              >
                {describePromo(promo)}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
  },
  heading: {
    paddingHorizontal: PAD,
    marginBottom: 6,
    fontSize: 11,
    color: PROMO,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: {
    paddingHorizontal: PAD,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 260,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(22, 163, 74, 0.10)",
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: PROMO,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flexShrink: 1,
  },
  name: {
    fontSize: 13,
    color: INK,
  },
  detail: {
    marginTop: 1,
    fontSize: 11,
    color: MUTED,
  },
});