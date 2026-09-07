import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { AppliedPromoLine } from "@/src/types/promotion";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "rgba(15, 23, 42, 0.08)";

interface BillDetailsProps {
  originalTotal: number;
  discountedTotal: number;
  isCalculating: boolean;
  amountTendered?: number;
  promotions?: AppliedPromoLine[];
}

export const BillDetails: React.FC<BillDetailsProps> = ({
  originalTotal,
  discountedTotal,
  isCalculating,
  amountTendered = 0,
  promotions = [],
}) => {
  const font = useInter();
  const change =
    amountTendered > discountedTotal ? amountTendered - discountedTotal : 0;
  const short =
    amountTendered > 0 && amountTendered < discountedTotal
      ? discountedTotal - amountTendered
      : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, typeface(font.medium, "500")]}>
          Subtotal
        </Text>
        <Text style={[styles.value, typeface(font.medium, "500")]}>
          {formatPHP(originalTotal)}
        </Text>
      </View>

      {promotions.length > 0 ? (
        <View style={styles.promoBlock}>
          <Text style={[styles.promoHeading, typeface(font.semibold, "600")]}>
            Promos
          </Text>
          {promotions.map((promo) => (
            <View key={promo.name} style={styles.promoRow}>
              <Text
                numberOfLines={2}
                style={[styles.promoName, typeface(font.medium, "500")]}
              >
                {promo.name}
              </Text>
              <Text style={[styles.promoValue, typeface(font.semibold, "600")]}>
                −{formatPHP(promo.savings)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.hairline} />

      <View style={styles.row}>
        <Text style={[styles.totalLabel, typeface(font.semibold, "600")]}>
          Total due
        </Text>
        {isCalculating ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <Text style={[styles.total, typeface(font.bold, "700")]}>
            {formatPHP(discountedTotal)}
          </Text>
        )}
      </View>

      {amountTendered > 0 ? (
        <>
          <View style={styles.row}>
            <Text style={[styles.label, typeface(font.medium, "500")]}>
              Cash given
            </Text>
            <Text style={[styles.value, typeface(font.medium, "500")]}>
              {formatPHP(amountTendered)}
            </Text>
          </View>
          {short > 0 ? (
            <View style={styles.row}>
              <Text style={[styles.shortLabel, typeface(font.semibold, "600")]}>
                Short
              </Text>
              <Text style={[styles.short, typeface(font.bold, "700")]}>
                {formatPHP(short)}
              </Text>
            </View>
          ) : (
            <View style={styles.row}>
              <Text style={[styles.totalLabel, typeface(font.semibold, "600")]}>
                Change
              </Text>
              <Text style={[styles.change, typeface(font.bold, "700")]}>
                {formatPHP(change)}
              </Text>
            </View>
          )}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: MUTED,
  },
  value: {
    fontSize: 14,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  promoBlock: {
    marginTop: 2,
    marginBottom: 4,
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  promoHeading: {
    fontSize: 11,
    color: "#15803D",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  promoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  promoName: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
    lineHeight: 18,
  },
  promoValue: {
    fontSize: 13,
    color: "#15803D",
    fontVariant: ["tabular-nums"],
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: INK,
  },
  total: {
    fontSize: 22,
    color: INK,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  change: {
    fontSize: 18,
    color: "#2563EB",
    fontVariant: ["tabular-nums"],
  },
  shortLabel: {
    fontSize: 15,
    color: "#E11D48",
  },
  short: {
    fontSize: 18,
    color: "#E11D48",
    fontVariant: ["tabular-nums"],
  },
});
