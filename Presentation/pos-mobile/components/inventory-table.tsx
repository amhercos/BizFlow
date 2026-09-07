import { cn } from "@/src/lib/utils";
import type { Product } from "@/src/types/inventory";
import {
  ArrowRight,
  Calendar,
  ChevronsUpDown,
  Edit3,
  Package2,
  Trash2,
} from "lucide-react-native";
import React, { ReactElement, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

// --- 1. Sub-component for Swipe Actions ---
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
    <Reanimated.View style={[styleZ, { flexDirection: "row", width: 160 }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onEdit}
        className="bg-slate-900 w-20 justify-center items-center h-full"
      >
        <Edit3 size={18} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onDelete}
        className="bg-rose-600 w-20 justify-center items-center h-full"
      >
        <Trash2 size={18} color="white" />
      </TouchableOpacity>
    </Reanimated.View>
  );
};

// --- 2. Main Inventory Table Component ---
interface InventoryTableProps {
  products: Product[];
  loading: boolean;
  onDelete: (product: Product) => void; // Changed to pass full product for naming
  onEdit: (product: Product) => void;
}

export function InventoryTable({
  products,
  loading,
  onDelete,
  onEdit,
}: InventoryTableProps): ReactElement | null {
  const [priceSort, setPriceSort] = useState<"none" | "asc" | "desc">("none");

  const sortedProducts = useMemo(() => {
    if (priceSort === "none") return products;
    return [...products].sort((a, b) =>
      priceSort === "asc" ? a.price - b.price : b.price - a.price,
    );
  }, [products, priceSort]);

  if (loading && products.length === 0) return null;

  return (
    <View className="flex-1">
      {/* --- TABLE HEADER --- */}
      <View className="flex-row items-center pb-4 border-b border-slate-100 px-4">
        <Text className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Product Info
        </Text>
        <View className="flex-row items-center">
          <View className="w-[65px] items-end">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Exp
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              setPriceSort((curr) => (curr === "asc" ? "desc" : "asc"))
            }
            className="w-[85px] flex-row items-center justify-end gap-1"
          >
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Price
            </Text>
            <ChevronsUpDown size={8} color="#cbd5e1" />
          </TouchableOpacity>
          <View className="w-[50px] items-end">
            <Text className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Qty
            </Text>
          </View>
          <View className="w-4" />
        </View>
      </View>

      {/* --- TABLE ROWS --- */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {sortedProducts.map((product) => {
          const isLow = product.stockQuantity <= product.lowStockThreshold;
          const isExpired =
            product.expiryDate && new Date(product.expiryDate) < new Date();

          return (
            <ReanimatedSwipeable
              key={product.id}
              friction={2}
              enableTrackpadTwoFingerGesture
              rightThreshold={40}
              renderRightActions={(prog, drag) => (
                <RightActions
                  drag={drag}
                  onEdit={() => onEdit(product)}
                  onDelete={() => onDelete(product)}
                />
              )}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => onEdit(product)}
                className="flex-row items-center py-6 border-b border-slate-50 px-4 bg-white"
              >
                <View className="flex-1 pr-6">
                  <Text
                    className="text-[15px] font-bold text-slate-900 leading-tight"
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {product.categoryName ?? "General"}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-[65px] items-end">
                    <Text
                      className={cn(
                        "text-[11px] font-bold",
                        isExpired ? "text-rose-500" : "text-slate-400",
                      )}
                    >
                      {product.expiryDate
                        ? new Date(product.expiryDate).toLocaleDateString(
                            undefined,
                            { month: "short", year: "2-digit" },
                          )
                        : "—"}
                    </Text>
                  </View>
                  <View className="w-[85px] items-end">
                    <Text className="text-[14px] font-black text-slate-900">
                      ₱{Math.round(product.price).toLocaleString()}
                    </Text>
                    {product.packPrice != null &&
                    product.packPrice > 0 &&
                    product.piecesPerPack != null &&
                    product.piecesPerPack > 1 ? (
                      <Text className="text-[9px] font-bold text-slate-400">
                        {product.piecesPerPack}pk
                      </Text>
                    ) : null}
                  </View>
                  <View className="w-[50px] items-end">
                    <Text
                      className={cn(
                        "text-[15px] font-black",
                        isLow ? "text-amber-500" : "text-emerald-600",
                      )}
                    >
                      {product.stockQuantity}
                    </Text>
                  </View>
                  <View className="w-4 items-end">
                    <View className="w-1 h-4 bg-slate-100 rounded-full opacity-50" />
                  </View>
                </View>
              </TouchableOpacity>
            </ReanimatedSwipeable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// --- 3. Product Card View ---
export function ProductCard({
  product,
  onEdit,
  onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (product: Product) => void;
}): ReactElement {
  const isLow = product.stockQuantity <= product.lowStockThreshold;
  const isExpired =
    product.expiryDate && new Date(product.expiryDate) < new Date();

  return (
    <TouchableOpacity
      onPress={() => onEdit(product)}
      activeOpacity={0.9}
      className="bg-white rounded-[40px] p-8 mb-6 shadow-2xl shadow-slate-200 border border-slate-50"
    >
      <View className="flex-row justify-between items-start mb-6">
        <View className="flex-1 pr-6">
          <View className="bg-slate-100 self-start px-3 py-1 rounded-lg mb-3">
            <Text className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              {product.categoryName ?? "General"}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {product.name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onDelete(product)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          className="bg-rose-50 w-12 h-12 items-center justify-center rounded-2xl"
        >
          <Trash2 size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-4 mb-8">
        <View
          className={cn(
            "flex-1 p-5 rounded-[28px] border",
            isLow
              ? "bg-amber-50 border-amber-100"
              : "bg-emerald-50 border-emerald-100",
          )}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Package2 size={14} color={isLow ? "#d97706" : "#059669"} />
            <Text
              className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isLow ? "text-amber-600" : "text-emerald-600",
              )}
            >
              Stock
            </Text>
          </View>
          <Text
            className={cn(
              "text-3xl font-black",
              isLow ? "text-amber-700" : "text-emerald-700",
            )}
          >
            {product.stockQuantity}
          </Text>
        </View>

        <View
          className={cn(
            "flex-1 p-5 rounded-[28px] border",
            isExpired
              ? "bg-rose-50 border-rose-100"
              : "bg-slate-50 border-slate-100",
          )}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Calendar size={14} color={isExpired ? "#e11d48" : "#64748b"} />
            <Text
              className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                isExpired ? "text-rose-600" : "text-slate-400",
              )}
            >
              Expiry
            </Text>
          </View>
          <Text
            className={cn(
              "text-2xl font-black",
              isExpired ? "text-rose-700" : "text-slate-900",
            )}
          >
            {product.expiryDate
              ? new Date(product.expiryDate).toLocaleDateString(undefined, {
                  month: "short",
                  year: "2-digit",
                })
              : "—"}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between pt-6 border-t border-slate-50">
        <View>
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-1">
            Unit Price
          </Text>
          <Text className="text-3xl font-black text-slate-900">
            ₱{product.price.toLocaleString()}
            <Text className="text-sm font-bold text-slate-400"> /pc</Text>
          </Text>
          {product.packPrice != null &&
          product.packPrice > 0 &&
          product.piecesPerPack != null &&
          product.piecesPerPack > 1 ? (
            <Text className="text-[12px] font-bold text-slate-400 mt-1">
              ₱{product.packPrice.toLocaleString()} / {product.piecesPerPack}pk
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => onEdit(product)}
          className="bg-slate-900 px-8 py-4 rounded-2xl flex-row items-center gap-2"
        >
          <Text className="text-white font-black text-[13px] uppercase">
            Edit
          </Text>
          <ArrowRight size={14} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
