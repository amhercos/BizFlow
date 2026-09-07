import { formatPHP } from "@/src/lib/math";
import { cn } from "@/src/lib/utils";
import { UnitType, type BasketItem } from "@/src/types/sale";
import { calculateLineTotal } from "@/src/utils/promotion-engine";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface OrderSummaryProps {
  basket: BasketItem[];
  updateQuantity: (
    productId: string,
    unitType: UnitType,
    nextQty: number,
  ) => void;
  removeItem: (productId: string, unitType: UnitType) => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  basket,
  updateQuantity,
  removeItem,
}) => (
  <View className="flex-1 px-5 pt-4">
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-slate-900 font-black text-xs uppercase tracking-widest">
        Order Items ({basket.length})
      </Text>
    </View>

    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {basket.map((item) => {
        const promoCalc = calculateLineTotal(item, basket);
        const hasActivePromo = promoCalc.savings > 0;
        const itemUnitType = item.unitType ?? UnitType.Piece;

        return (
          <View
            key={`${item.productId}-${itemUnitType}`}
            className="flex-row items-center bg-white border border-slate-100 p-3.5 rounded-2xl mb-2.5 shadow-sm"
          >
            {/* Item Info Description Area */}
            <View className="flex-1 mr-2">
              <Text
                numberOfLines={1}
                className="font-bold text-slate-800 text-[12px] uppercase leading-tight"
              >
                {item.name}
              </Text>

              <View className="flex-row items-center mt-0.5">
                <Text
                  className={cn(
                    "text-[10px] font-medium",
                    hasActivePromo
                      ? "text-slate-400 line-through"
                      : "text-slate-400",
                  )}
                >
                  {formatPHP(item.unitPrice)}
                </Text>
                {hasActivePromo && (
                  <Text className="text-[10px] font-black text-emerald-600 ml-1">
                    {formatPHP(promoCalc.discountedTotal / item.quantity)} /
                    unit
                  </Text>
                )}
              </View>
            </View>

            {/* Micro Quantity Modifier Controls */}
            <View className="flex-row items-center bg-slate-50 rounded-xl p-1 border border-slate-100 mr-2">
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity === 1) {
                    removeItem(item.productId, itemUnitType);
                  } else {
                    updateQuantity(
                      item.productId,
                      itemUnitType,
                      item.quantity - 1,
                    );
                  }
                }}
                className="w-7 h-7 items-center justify-center rounded-lg bg-white shadow-sm"
              >
                {item.quantity === 1 ? (
                  <Trash2 size={11} color="#ef4444" />
                ) : (
                  <Minus size={11} color="#1e293b" strokeWidth={3} />
                )}
              </TouchableOpacity>

              <View className="w-8 items-center">
                <Text className="font-black text-slate-900 text-xs">
                  {item.quantity}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  updateQuantity(
                    item.productId,
                    itemUnitType,
                    item.quantity + 1,
                  )
                }
                className="w-7 h-7 items-center justify-center rounded-lg bg-white shadow-sm"
              >
                <Plus size={11} color="#1e293b" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            {/* Real-time Line Value Display Box */}
            <View className="items-end min-w-[75px]">
              <Text
                className={cn(
                  "text-[12px] font-black",
                  hasActivePromo ? "text-emerald-600" : "text-slate-900",
                )}
              >
                {formatPHP(promoCalc.discountedTotal)}
              </Text>
              {hasActivePromo && (
                <Text className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter mt-0.5">
                  Saved {formatPHP(promoCalc.savings)}
                </Text>
              )}
            </View>

            {/* Direct Multi-item Row Deletion Accessor */}
            <TouchableOpacity
              onPress={() => removeItem(item.productId, itemUnitType)}
              className="ml-2.5 p-1 bg-slate-50 rounded-lg border border-slate-100"
            >
              <Trash2 size={12} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        );
      })}

      {basket.length === 0 && (
        <View className="flex-1 items-center justify-center py-20 opacity-40">
          <View className="bg-slate-100 p-6 rounded-full mb-4">
            <ShoppingBag size={36} color="#94a3b8" />
          </View>
          <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">
            Basket is empty
          </Text>
        </View>
      )}
    </ScrollView>
  </View>
);
