import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import { Promotion, PromotionType } from "@/src/types/promotion";
import { Edit3, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "rgba(15, 23, 42, 0.08)";
const TINT = "#2563EB";

interface PromotionCardProps {
  promotion: Promotion;
  onToggle: (mainProductId: string) => void;
  onDelete: (mainProductId: string) => void;
  onEdit: (promotion: Promotion) => void;
}

function typeLabel(type: Promotion["type"]) {
  if (type === PromotionType.Bulk || type === "Bulk") return "Bulk";
  if (type === PromotionType.Bundle || type === "Bundle") return "Bundle";
  if (type === PromotionType.Discount || type === "Discount") return "Discount";
  return "Promo";
}

export default function PromotionCard({
  promotion,
  onToggle,
  onDelete,
  onEdit,
}: PromotionCardProps) {
  const font = useInter();
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    setOptimisticActive(null);
  }, [promotion.isActive, promotion.id]);

  const isBundle =
    promotion.type === PromotionType.Bundle || promotion.type === "Bundle";
  const isDiscount =
    promotion.type === PromotionType.Discount ||
    promotion.type === "Discount";

  const flatPrice = promotion.tiers[0]?.price ?? 0;
  const basePrice = promotion.originalPrice ?? 0;
  const paused = !(optimisticActive ?? promotion.isActive);
  const kind = typeLabel(promotion.type);
  const subtitle = [kind, promotion.name].filter(Boolean).join(" · ");

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.topBody}>
          <Text
            numberOfLines={1}
            style={[styles.product, typeface(font.semibold, "600")]}
          >
            {promotion.productName ?? "Unknown product"}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.meta, typeface(font.medium, "500")]}
          >
            {subtitle}
          </Text>
          {isBundle && promotion.tieUpProductName ? (
            <Text
              numberOfLines={1}
              style={[styles.meta, typeface(font.medium, "500")]}
            >
              With {promotion.tieUpProductName}
            </Text>
          ) : null}
        </View>
        <View
          style={[styles.statusPill, paused ? styles.statusPaused : styles.statusLive]}
        >
          <Text
            style={[
              styles.statusText,
              { color: paused ? MUTED : "#15803D" },
              typeface(font.medium, "500"),
            ]}
          >
            {paused ? "Paused" : "Live"}
          </Text>
        </View>
        <Switch
          value={!paused}
          onValueChange={() => {
            setOptimisticActive(paused);
            onToggle(promotion.mainProductId);
          }}
          trackColor={{ false: "#CBD5E1", true: "#BFDBFE" }}
          thumbColor={!paused ? TINT : "#94A3B8"}
        />
      </View>

      <View style={styles.hairline} />

      {isDiscount ? (
        <View style={styles.priceRow}>
          <Text style={[styles.price, typeface(font.bold, "700")]}>
            {formatPHP(flatPrice)}
          </Text>
          <View style={styles.priceEnd}>
            {basePrice > 0 ? (
              <Text style={[styles.retail, typeface(font.medium, "500")]}>
                {formatPHP(basePrice)}
              </Text>
            ) : null}
            {basePrice > flatPrice ? (
              <Text style={[styles.save, typeface(font.medium, "500")]}>
                Save {formatPHP(basePrice - flatPrice)}
              </Text>
            ) : null}
          </View>
        </View>
      ) : (
        <View>
          {promotion.tiers.map((tier, index) => {
            const wholesaleImpact = basePrice * tier.quantity - tier.price;
            return (
              <View key={tier.id ?? index} style={styles.tierRow}>
                <Text style={[styles.tier, typeface(font.medium, "500")]}>
                  {tier.quantity} for {formatPHP(tier.price)}
                </Text>
                {wholesaleImpact > 0 ? (
                  <Text style={[styles.save, typeface(font.medium, "500")]}>
                    Save {formatPHP(wholesaleImpact)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onEdit(promotion)}
          style={styles.action}
          hitSlop={8}
        >
          <Edit3 size={14} color={MUTED} strokeWidth={2} />
          <Text style={[styles.actionText, typeface(font.medium, "500")]}>
            Edit
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onDelete(promotion.mainProductId)}
          style={styles.action}
          hitSlop={8}
        >
          <Trash2 size={14} color="#E11D48" strokeWidth={2} />
          <Text style={[styles.deleteText, typeface(font.medium, "500")]}>
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    marginBottom: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topBody: {
    flex: 1,
    minWidth: 0,
  },
  product: {
    fontSize: 16,
    color: INK,
    letterSpacing: -0.2,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusLive: {
    backgroundColor: "#E7F8EE",
  },
  statusPaused: {
    backgroundColor: "#EEF1F6",
  },
  statusText: {
    fontSize: 10,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginTop: 12,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  price: {
    fontSize: 22,
    color: TINT,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  priceEnd: {
    alignItems: "flex-end",
  },
  retail: {
    fontSize: 13,
    color: MUTED,
    textDecorationLine: "line-through",
    fontVariant: ["tabular-nums"],
  },
  save: {
    fontSize: 13,
    color: "#15803D",
    fontVariant: ["tabular-nums"],
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  tier: {
    fontSize: 15,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  actions: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 13,
    color: MUTED,
  },
  deleteText: {
    fontSize: 13,
    color: "#E11D48",
  },
});
