import { typeface, type AppFonts } from "@/src/theme/typography";
import type { Product } from "@/src/types/inventory";
import { ChevronsUpDown, Edit3, Trash2 } from "lucide-react-native";
import React, { ReactElement, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

function stockColor(product: Product) {
  if (product.stockQuantity === 0) return "#E11D48";
  if (product.stockQuantity <= product.lowStockThreshold) return "#D97706";
  return "#15803D";
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
          Sort by price
        </Text>
        <ChevronsUpDown size={12} color="#94A3B8" />
      </Pressable>

      {sortedProducts.map((product, index) => {
        const expired =
          !!product.expiryDate && new Date(product.expiryDate) < new Date();
        const hasPack =
          product.packPrice != null &&
          product.packPrice > 0 &&
          product.piecesPerPack != null &&
          product.piecesPerPack > 1;

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
                <View style={styles.body}>
                  <Text
                    style={[styles.name, typeface(font.semibold, "600")]}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={[styles.meta, typeface(font.medium, "500")]}
                    numberOfLines={1}
                  >
                    {product.categoryName ?? "Uncategorized"}
                    {" · "}
                    ₱{Math.round(product.price).toLocaleString("en-PH")}
                    {hasPack ? ` · ${product.piecesPerPack}pk` : ""}
                    {" · "}
                    <Text style={{ color: expired ? "#E11D48" : MUTED }}>
                      {product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )
                        : "No expiry"}
                    </Text>
                  </Text>
                </View>
                <Text
                  style={[
                    styles.qty,
                    { color: stockColor(product) },
                    typeface(font.semibold, "600"),
                  ]}
                >
                  {product.stockQuantity}
                </Text>
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
    paddingVertical: 4,
    marginBottom: 4,
  },
  sortText: {
    fontSize: 12,
    color: MUTED,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#FAFBFD",
  },
  body: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 15,
    color: INK,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
  },
  qty: {
    fontSize: 16,
    fontVariant: ["tabular-nums"],
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
    minHeight: 64,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
});
