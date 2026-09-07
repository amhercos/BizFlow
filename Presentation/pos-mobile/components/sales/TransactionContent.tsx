import { type CustomerCredit } from "@/src/types/credit";
import { PaymentType, UnitType, type BasketItem } from "@/src/types/sale";
import { CheckCircle2, RotateCcw, X } from "lucide-react-native";
import React, { memo, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { formatPHP } from "@/src/lib/math";
import { cn } from "@/src/lib/utils";
import { BillDetails } from "./BillDetails";
import { OrderSummary } from "./OrderSummary";
import { PaymentSection } from "./PaymentSection";

const QUICK_CASH = [20, 50, 100, 200, 500, 1000];

interface TransactionContentProps {
  basket: BasketItem[];
  activePayment: PaymentType;
  setActivePayment: (p: PaymentType) => void;
  cashReceived: number;
  setCashReceived: React.Dispatch<React.SetStateAction<number>>;
  handleCheckout: () => void;
  clearBasket: () => void;
  onClose: () => void;
  updateQuantity: (
    productId: string,
    unitType: UnitType,
    nextQty: number,
  ) => void;
  removeItem: (productId: string, unitType: UnitType) => void;
  credits: CustomerCredit[];
  selectedCreditId: string;
  setSelectedCreditId: (s: string) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (b: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (s: string) => void;
  newCustomerContact: string;
  setNewCustomerContact: (s: string) => void;
  isSubmitting: boolean;
  totals: {
    originalTotal: number;
    cashTotal: number;
    creditTotal: number;
    savings: number;
    promotionsApplied: string | null;
  };
  isTablet?: boolean;
}

export const TransactionContent = memo<TransactionContentProps>(
  ({
    basket,
    activePayment,
    setActivePayment,
    cashReceived,
    setCashReceived,
    handleCheckout,
    clearBasket,
    onClose,
    updateQuantity,
    removeItem,
    credits,
    selectedCreditId,
    setSelectedCreditId,
    isNewCustomer,
    setIsNewCustomer,
    newCustomerName,
    setNewCustomerName,
    newCustomerContact,
    setNewCustomerContact,
    isSubmitting,
    totals,
    isTablet = false,
  }) => {
    const isCredit = activePayment === PaymentType.Credit;

    const currentTargetTotal = isCredit ? totals.creditTotal : totals.cashTotal;
    const currentSavingsTotal = isCredit ? 0 : totals.savings;
    const currentPromotionLabels = isCredit ? null : totals.promotionsApplied;

    const currentChangeAmount = useMemo(
      () => cashReceived - currentTargetTotal,
      [cashReceived, currentTargetTotal],
    );

    const dynamicCalcResult = useMemo(
      () => ({
        originalTotal: totals.originalTotal,
        discountedTotal: currentTargetTotal,
        savings: currentSavingsTotal,
        appliedPromotionName: currentPromotionLabels,
      }),
      [
        totals.originalTotal,
        currentTargetTotal,
        currentSavingsTotal,
        currentPromotionLabels,
      ],
    );

    const isCheckoutDisabled = useMemo(
      () =>
        isSubmitting ||
        basket.length === 0 ||
        (!isCredit && (cashReceived === 0 || currentChangeAmount < 0)) ||
        (isCredit && !isNewCustomer && !selectedCreditId) ||
        (isCredit && isNewCustomer && !newCustomerName),
      [
        isSubmitting,
        basket.length,
        isCredit,
        cashReceived,
        currentChangeAmount,
        isNewCustomer,
        selectedCreditId,
        newCustomerName,
      ],
    );

    const handleVoidBasket = () => {
      Alert.alert(
        "Void Transaction",
        "Are you absolutely sure you want to void this transaction and wipe out all items from the basket?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Void Items", style: "destructive", onPress: clearBasket },
        ],
      );
    };

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {!isTablet && (
          <View className="h-20 flex-row items-center px-6 border-b border-slate-100">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-50"
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>

            <View className="flex-1 ml-4">
              <Text className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                Checkout
              </Text>
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {basket.length} {basket.length === 1 ? "Item" : "Items"} inside
                Cart
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleVoidBasket}
              className="flex-row items-center bg-rose-50 px-4 py-2 rounded-xl"
            >
              <RotateCcw size={13} color="#ef4444" />
              <Text className="text-rose-600 font-black text-[11px] uppercase ml-1.5 tracking-tight">
                Void Order
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-1 flex-col">
          <View className="flex-1 bg-slate-50/50">
            <OrderSummary
              basket={basket}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
            />
          </View>

          <View className="flex-[1.2] bg-white border-t border-slate-100">
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              <PaymentSection
                activePayment={activePayment}
                setActivePayment={setActivePayment}
                cashReceived={cashReceived}
                setCashReceived={setCashReceived}
                credits={credits}
                selectedCreditId={selectedCreditId}
                setSelectedCreditId={setSelectedCreditId}
                isNewCustomer={isNewCustomer}
                setIsNewCustomer={setIsNewCustomer}
                newCustomerName={newCustomerName}
                setNewCustomerName={setNewCustomerName}
                newCustomerContact={newCustomerContact}
                setNewCustomerContact={setNewCustomerContact}
              />

              {!isCredit && (
                <View className="px-5 mt-2">
                  <View className="bg-slate-50/80 p-4 rounded-3xl border border-dashed border-slate-200">
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">
                      Quick Denominations
                    </Text>
                    <View className="flex-row flex-wrap justify-between gap-y-2">
                      {QUICK_CASH.map((val) => (
                        <TouchableOpacity
                          key={val}
                          onPress={() =>
                            setCashReceived((prev) => (prev || 0) + val)
                          }
                          className="w-[31%] py-3 rounded-xl bg-white border border-slate-100 items-center justify-center shadow-sm"
                        >
                          <Text className="text-slate-700 font-black text-xs">
                            +₱{val}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        onPress={() => setCashReceived(0)}
                        className="w-[31%] py-3 rounded-xl bg-rose-50 border border-rose-100 items-center justify-center"
                      >
                        <Text className="text-rose-500 font-black text-[10px] uppercase">
                          Reset
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              <View className="h-[1px] bg-slate-100 mx-5 my-5" />

              <BillDetails
                calcResult={dynamicCalcResult}
                isCalculating={false}
                amountTendered={!isCredit ? cashReceived : 0}
              />
            </ScrollView>
          </View>
        </View>

        <View className="p-6 border-t border-slate-100 bg-white">
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={isCheckoutDisabled}
            className={cn(
              "h-16 rounded-2xl flex-row items-center justify-center shadow-lg",
              isCheckoutDisabled ? "bg-slate-200" : "bg-slate-900",
            )}
          >
            <CheckCircle2 size={18} color="white" />
            <Text className="text-white font-black text-base uppercase tracking-widest ml-2">
              {isSubmitting
                ? "Processing..."
                : `Checkout • ${formatPHP(currentTargetTotal)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  },
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
});
TransactionContent.displayName = "TransactionContent";
