import { typeface, useInter } from "@/src/theme/typography";
import { type CustomerCredit } from "@/src/types/credit";
import type { AppliedPromoLine } from "@/src/types/promotion";
import { PaymentType, UnitType, type BasketItem } from "@/src/types/sale";
import { formatPHP } from "@/src/lib/math";
import { X } from "lucide-react-native";
import React, { memo, useMemo } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BillDetails } from "./BillDetails";
import { OrderSummary } from "./OrderSummary";
import { PaymentSection } from "./PaymentSection";

const INK = "#0F172A";
const TINT = "#2563EB";
const LINE = "rgba(15, 23, 42, 0.08)";

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
    promotionsApplied: AppliedPromoLine[];
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
    const insets = useSafeAreaInsets();
    const font = useInter();
    const isCredit = activePayment === PaymentType.Credit;
    const currentTargetTotal = isCredit ? totals.creditTotal : totals.cashTotal;

    const currentChangeAmount = useMemo(
      () => cashReceived - currentTargetTotal,
      [cashReceived, currentTargetTotal],
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
      Alert.alert("Void transaction", "Remove all items from this basket?", [
        { text: "Cancel", style: "cancel" },
        { text: "Void", style: "destructive", onPress: clearBasket },
      ]);
    };

    const payment = (
      <PaymentSection
        activePayment={activePayment}
        setActivePayment={setActivePayment}
        cashReceived={cashReceived}
        setCashReceived={setCashReceived}
        dueAmount={currentTargetTotal}
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
    );

    const bill = (
      <BillDetails
        originalTotal={totals.originalTotal}
        discountedTotal={currentTargetTotal}
        isCalculating={false}
        amountTendered={!isCredit ? cashReceived : 0}
        promotions={isCredit ? [] : totals.promotionsApplied}
      />
    );

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View
          style={[
            styles.header,
            isTablet ? styles.headerTablet : { paddingTop: insets.top + 8 },
          ]}
        >
          {!isTablet ? (
            <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={8}>
              <X size={18} color={INK} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.identity}>
            <Text style={[styles.title, typeface(font.bold, "700")]}>
              Checkout
            </Text>
          </View>
          <Pressable onPress={handleVoidBasket} hitSlop={8}>
            <Text style={[styles.void, typeface(font.medium, "500")]}>Void</Text>
          </Pressable>
        </View>

        {isTablet ? (
          <View style={styles.split}>
            <View style={styles.basketPane}>
              <OrderSummary
                basket={basket}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.payPane}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
              >
                {bill}
                {payment}
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={styles.phoneSplit}>
            <View style={styles.phoneBasket}>
              <OrderSummary
                basket={basket}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
              />
            </View>
            <View style={styles.phonePay}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                bounces={false}
                nestedScrollEnabled
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                {bill}
                {payment}
              </ScrollView>
            </View>
          </View>
        )}

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <TouchableOpacity
            onPress={handleCheckout}
            disabled={isCheckoutDisabled}
            style={[styles.payBtn, isCheckoutDisabled && styles.payBtnOff]}
          >
            <Text style={[styles.payText, typeface(font.semibold, "600")]}>
              {isSubmitting
                ? "Processing…"
                : `Charge ${formatPHP(currentTargetTotal)}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFBFD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  headerTablet: {
    paddingTop: 16,
  },
  close: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  identity: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  void: {
    fontSize: 14,
    color: "#E11D48",
  },
  split: {
    flex: 1,
    flexDirection: "row",
  },
  basketPane: {
    flex: 1,
    minHeight: 0,
  },
  payPane: {
    flex: 1.05,
    minHeight: 0,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
  },
  phoneSplit: {
    flex: 1,
    minHeight: 0,
  },
  phoneBasket: {
    flex: 1,
    minHeight: 0,
  },
  phonePay: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: "58%",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
    backgroundColor: "#F7F8FB",
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: LINE,
    backgroundColor: "#FAFBFD",
  },
  payBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtnOff: {
    backgroundColor: "#CBD5E1",
  },
  payText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

TransactionContent.displayName = "TransactionContent";
