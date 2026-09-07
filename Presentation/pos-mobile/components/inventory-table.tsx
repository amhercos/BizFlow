import { formatPHP } from "@/src/lib/math";
import { typeface, type AppFonts } from "@/src/theme/typography";
import type { Product } from "@/src/types/inventory";
import { ChevronsUpDown, Edit3, Trash2 } from "lucide-react-native";
import React, { ReactElement, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

const INK = "#0F172A";
const MUTED = "#64748B";
const LINE = "rgba(15, 23, 42, 0.08)";
const TINT = "#2563EB";

interface RightActionsProps {
  drag: SharedValue<number>;
  onEdit: () => void;
  onDelete: () => void;
}

const RightActions = ({ drag, onEdit, onDelete }: RightActionsProps) => {
  const styleZ = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 160 }],
  }));

  return (
    <Reanimated.View style={[styleZ, styles.actions]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onEdit}
        style={[styles.action, { backgroundColor: TINT }]}
      >
        <Edit3 size={18} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onDelete}
        style={[styles.action, { backgroundColor: "#E11D48" }]}
      >
        <Trash2 size={18} color="white" />
      </TouchableOpacity>
    </Reanimated.View>
  );
};

interface InventoryTableProps {
  products: Product[];
  onDelete: (product: Product) => void;
  onEdit: (product: Product) => void;
  font?: AppFonts;
}

function isExpired(product: Product) {
  return !!product.expiryDate && new Date(product.expiryDate) < new Date();
}

function stockTone(product: Product) {
  if (product.stockQuantity === 0) return "#E11D48";
  if (product.stockQuantity <= product.lowStockThreshold) return "#D97706";
  return "#15803D";
}

function stockCopy(product: Product) {
  if (product.stockQuantity === 0) return "Out of stock";
  return `${product.stockQuantity} in stock`;
}

function expiryCopy(product: Product) {
  if (!product.expiryDate) return "No expiry";
  return new Date(product.expiryDate).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function InventoryTable({
  products,
  onDelete,
  onEdit,
  font = {},
}: InventoryTableProps): ReactElement | null {
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

  const sortedProducts = useMemo(() => {
    if (priceSort === "none") return products;
    return [...products].sort((a, b) =>
      priceSort === "asc" ? a.price - b.price : b.price - a.price,
    );
  }, [products, priceSort]);

  if (products.length === 0) return null;

  return (
    <View>
      <Pressable
        onPress={() =>
          setPriceSort((curr) => (curr === "asc" ? "desc" : "asc"))
        }
        style={styles.sort}
      >
        <Text style={[styles.sortText, typeface(font.medium, "500")]}>
          {priceSort === "asc"
            ? "Price · low to high"
            : priceSort === "desc"
              ? "Price · high to low"
              : "Sort by price"}
        </Text>
        <ChevronsUpDown size={12} color="#94A3B8" />
      </Pressable>

      {sortedProducts.map((product, index) => {
        const expired = isExpired(product);

        return (
          <View key={product.id}>
            {index > 0 ? <View style={styles.hairline} /> : null}
            <ReanimatedSwipeable
              friction={2}
              enableTrackpadTwoFingerGesture
              rightThreshold={40}
              renderRightActions={(_, drag) => (
                <RightActions
                  drag={drag}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product)}
                />
              )}
            >
              <Pressable
                onPress={() => onEdit(product)}
                style={styles.row}
              >
                <View style={styles.col}>
                  <View style={styles.line}>
                    <Text
                      style={[styles.name, typeface(font.semibold, "600")]}
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    <Text style={[styles.price, typeface(font.semibold, "600")]}>
                      {formatPHP(product.price)}
                    </Text>
                  </View>
                  <View style={styles.line}>
                    <Text
                      style={[styles.meta, typeface(font.medium, "500")]}
                      numberOfLines={1}
                    >
                      <Text style={{ color: stockTone(product) }}>
                        {stockCopy(product)}
                      </Text>
                      {" · "}
                      {product.categoryName ?? "Uncategorized"}
                    </Text>
                    <Text
                      style={[
                        styles.qty,
                        expired && styles.qtyHot,
                        typeface(font.medium, "500"),
                      ]}
                    >
                      {expired ? "Expired" : expiryCopy(product)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </ReanimatedSwipeable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sort: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    paddingVertical: 8,
    marginBottom: 6,
  },
  sortText: {
    fontSize: 12,
    color: MUTED,
  },
  row: {
    paddingVertical: 16,
    backgroundColor: "#FAFBFD",
  },
  col: {
    gap: 5,
  },
  line: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 15,
    color: INK,
    letterSpacing: -0.2,
  },
  price: {
    fontSize: 15,
    color: TINT,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.2,
  },
  meta: {
    flex: 1,
    fontSize: 12,
    color: MUTED,
  },
  qty: {
    fontSize: 12,
    color: MUTED,
    fontVariant: ["tabular-nums"],
  },
  qtyHot: {
    color: "#E11D48",
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
  actions: {
    flexDirection: "row",
    width: 160,
  },
  action: {
    width: 80,
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
});
