import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import { UnitType, type BasketItem } from "@/src/types/sale";
import { calculateLineTotal } from "@/src/utils/promotion-engine";
import { Gift, Minus, Plus } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "rgba(15, 23, 42, 0.08)";
const TINT = "#2563EB";
const FREE = "#15803D";

interface OrderSummaryProps {
  basket: BasketItem[];
  updateQuantity: (
    productId: string,
    unitType: UnitType,
    nextQty: number,
    isFree?: boolean,
  ) => void;
  removeItem: (productId: string, unitType: UnitType, isFree?: boolean) => void;
  toggleFree: (productId: string, unitType: UnitType, isFree: boolean) => void;
  nested?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  basket,
  updateQuantity,
  removeItem,
  toggleFree,
  nested = false,
}) => {
  const font = useInter();
  const list = (
    <>
      {basket.length === 0 ? (
        <Text style={[styles.empty, typeface(font.regular, "400")]}>
          Basket is empty
        </Text>
      ) : (
        basket.map((item, index) => {
          const promoCalc = calculateLineTotal(item, basket);
          const isFree = !!item.isFree;
          const hasActivePromo = !isFree && promoCalc.savings > 0;
          const itemUnitType = item.unitType ?? UnitType.Piece;

          return (
            <View
              key={`${item.productId}-${itemUnitType}-${isFree ? "free" : "paid"}`}
            >
              {index > 0 ? <View style={styles.hairline} /> : null}
              <View style={styles.row}>
                <View style={styles.body}>
                  <Text
                    numberOfLines={1}
                    style={[styles.name, typeface(font.semibold, "600")]}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.meta, typeface(font.medium, "500")]}>
                    {itemUnitType === UnitType.Pack ? "Pack" : "Piece"}
                    {" · "}
                    {isFree ? (
                      <Text style={styles.freeMeta}>Free item</Text>
                    ) : hasActivePromo ? (
                      <>
                        <Text style={styles.strike}>
                          {formatPHP(item.unitPrice)}
                        </Text>{" "}
                        {formatPHP(promoCalc.discountedTotal / item.quantity)}
                      </>
                    ) : (
                      formatPHP(item.unitPrice)
                    )}
                  </Text>
                  <Pressable
                    onPress={() =>
                      toggleFree(item.productId, itemUnitType, isFree)
                    }
                    hitSlop={6}
                    style={[styles.freeBtn, isFree && styles.freeBtnOn]}
                  >
                    <Gift size={11} color={isFree ? FREE : MUTED} />
                    <Text
                      style={[
                        styles.freeText,
                        isFree && styles.freeTextOn,
                        typeface(font.semibold, "600"),
                      ]}
                    >
                      {isFree ? "Free · tap to undo" : "Click to Mark free"}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => {
                      if (item.quantity === 1) {
                        removeItem(item.productId, itemUnitType, isFree);
                      } else {
                        updateQuantity(
                          item.productId,
                          itemUnitType,
                          item.quantity - 1,
                          isFree,
                        );
                      }
                    }}
                    style={styles.stepBtn}
                    hitSlop={6}
                  >
                    <Minus size={12} color={INK} />
                  </Pressable>
                  <Text style={[styles.qty, typeface(font.semibold, "600")]}>
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() =>
                      updateQuantity(
                        item.productId,
                        itemUnitType,
                        item.quantity + 1,
                        isFree,
                      )
                    }
                    style={styles.stepBtn}
                    hitSlop={6}
                  >
                    <Plus size={12} color={INK} />
                  </Pressable>
                </View>

                <Text
                  style={[
                    styles.line,
                    (hasActivePromo || isFree) && styles.linePromo,
                    typeface(font.semibold, "600"),
                  ]}
                >
                  {isFree ? "FREE" : formatPHP(promoCalc.discountedTotal)}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </>
  );

  return (
    <View style={[styles.wrap, nested && styles.wrapNested]}>
      {nested ? (
        list
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {list}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  wrapNested: {
    flex: 0,
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  body: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    color: INK,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
  },
  freeMeta: {
    color: FREE,
  },
  strike: {
    textDecorationLine: "line-through",
    color: "#94A3B8",
  },
  freeBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: "#EEF1F6",
  },
  freeBtnOn: {
    backgroundColor: "#DCFCE7",
  },
  freeText: {
    fontSize: 11,
    color: MUTED,
  },
  freeTextOn: {
    color: FREE,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  qty: {
    width: 28,
    textAlign: "center",
    fontSize: 14,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  line: {
    minWidth: 72,
    textAlign: "right",
    fontSize: 14,
    color: TINT,
    fontVariant: ["tabular-nums"],
  },
  linePromo: {
    color: FREE,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
  empty: {
    paddingVertical: 24,
    fontSize: 14,
    color: MUTED,
  },
});
