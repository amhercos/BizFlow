import { formatPHP } from "@/src/lib/math";
import { PromotionCalculationResponse } from "@/src/types/promotion";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

interface BillDetailsProps {
  calcResult: PromotionCalculationResponse;
  isCalculating: boolean;
  amountTendered?: number; // Added to receive the customer's payment amount
}

export const BillDetails: React.FC<BillDetailsProps> = ({
  calcResult,
  isCalculating,
  amountTendered = 0,
}) => {
  // Calculate change (ensure it doesn't show negative change if they haven't paid enough yet)
  const change =
    amountTendered > calcResult.discountedTotal
      ? amountTendered - calcResult.discountedTotal
      : 0;

  return (
    <View className="p-5 bg-white">
      <View className="flex-row justify-between mb-2">
        <Text className="text-slate-500 font-bold text-xs uppercase tracking-tight">
          Subtotal
        </Text>
        <Text className="text-slate-700 font-bold">
          {formatPHP(calcResult.originalTotal)}
        </Text>
      </View>

      {calcResult.savings > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-emerald-600 font-bold text-xs uppercase tracking-tight">
            Promo: {calcResult.appliedPromotionName || "Applied"}
          </Text>
          <Text className="text-emerald-600 font-bold">
            - {formatPHP(calcResult.savings)}
          </Text>
        </View>
      )}

      <View className="h-[1px] bg-slate-100 my-3" />

      <View className="flex-row justify-between items-center">
        <Text className="text-slate-900 font-black text-sm uppercase">
          Grand Total
        </Text>
        {isCalculating ? (
          <ActivityIndicator size="small" color="#10b981" />
        ) : (
          <Text className="text-2xl font-black text-emerald-600">
            {formatPHP(calcResult.discountedTotal)}
          </Text>
        )}
      </View>

      {/* Change Computation Section */}
      {amountTendered > 0 && (
        <>
          <View className="h-[1px] border-t border-dashed border-slate-200 my-3" />

          <View className="flex-row justify-between mb-2">
            <Text className="text-slate-500 font-bold text-xs uppercase tracking-tight">
              Cash Given
            </Text>
            <Text className="text-slate-700 font-bold">
              {formatPHP(amountTendered)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-slate-900 font-black text-sm uppercase">
              Change
            </Text>
            <Text className="text-xl font-black text-blue-600">
              {formatPHP(change)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};
