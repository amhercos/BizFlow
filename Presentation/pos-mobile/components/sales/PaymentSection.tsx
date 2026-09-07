import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import { type CustomerCredit } from "@/src/types/credit";
import { PaymentType } from "@/src/types/sale";
import { X } from "lucide-react-native";
import React, { Dispatch, SetStateAction, memo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { CreditPayment } from "./CreditPayment";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const QUICK_CASH = [
  [20, 50, 100],
  [200, 500, 1000],
] as const;

interface PaymentSectionProps {
  activePayment: PaymentType;
  setActivePayment: (p: PaymentType) => void;
  cashReceived: number;
  setCashReceived: Dispatch<SetStateAction<number>>;
  dueAmount: number;
  credits: CustomerCredit[];
  selectedCreditId: string;
  setSelectedCreditId: (id: string) => void;
  isNewCustomer: boolean;
  setIsNewCustomer: (b: boolean) => void;
  newCustomerName: string;
  setNewCustomerName: (s: string) => void;
  newCustomerContact: string;
  setNewCustomerContact: (s: string) => void;
}

export const PaymentSection = memo(
  ({
    activePayment,
    setActivePayment,
    cashReceived,
    setCashReceived,
    dueAmount,
    ...creditProps
  }: PaymentSectionProps) => {
    const font = useInter();
    const exactTender = Math.ceil(dueAmount);
    const hasCash = cashReceived > 0;

    return (
      <View style={styles.wrap}>
        <View style={styles.segment}>
          {(
            [
              { id: PaymentType.Cash, label: "Cash" },
              { id: PaymentType.Credit, label: "Credit" },
            ] as const
          ).map((method) => {
            const active = activePayment === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => setActivePayment(method.id)}
                style={[styles.segmentItem, active && styles.segmentItemOn]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    active && styles.segmentTextOn,
                    typeface(active ? font.semibold : font.medium, "600"),
                  ]}
                >
                  {method.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activePayment === PaymentType.Cash ? (
          <View>
            <View style={styles.cashRow}>
              <Text style={[styles.peso, typeface(font.semibold, "600")]}>
                ₱
              </Text>
              <TextInput
                keyboardType="numeric"
                value={cashReceived === 0 ? "" : cashReceived.toString()}
                onChangeText={(val) =>
                  setCashReceived(Number(val.replace(/[^0-9]/g, "")) || 0)
                }
                placeholder="0"
                placeholderTextColor="#94A3B8"
                style={[styles.cashInput, typeface(font.bold, "700")]}
              />
              {hasCash ? (
                <Pressable
                  onPress={() => setCashReceived(0)}
                  hitSlop={8}
                  style={styles.clearIcon}
                >
                  <X size={14} color={MUTED} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={() => setCashReceived(exactTender)}
              style={styles.exactBtn}
            >
              <Text style={[styles.exactLabel, typeface(font.medium, "500")]}>
                Exact amount
              </Text>
              <Text style={[styles.exactValue, typeface(font.semibold, "600")]}>
                {formatPHP(exactTender)}
              </Text>
            </Pressable>

            <View style={styles.denomBlock}>
              {QUICK_CASH.map((row) => (
                <View key={row.join("-")} style={styles.denomRow}>
                  {row.map((val) => (
                    <Pressable
                      key={val}
                      onPress={() =>
                        setCashReceived((prev) => (prev || 0) + val)
                      }
                      style={styles.denom}
                    >
                      <Text
                        style={[styles.denomText, typeface(font.medium, "500")]}
                      >
                        {val}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <CreditPayment {...creditProps} />
        )}
      </View>
    );
  },
);

PaymentSection.displayName = "PaymentSection";

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 4,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemOn: {
    backgroundColor: TINT,
  },
  segmentText: {
    fontSize: 14,
    color: INK,
  },
  segmentTextOn: {
    color: "#FFFFFF",
  },
  cashRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  peso: {
    fontSize: 22,
    color: INK,
    marginRight: 8,
  },
  cashInput: {
    flex: 1,
    fontSize: 26,
    color: INK,
    paddingVertical: 0,
    fontVariant: ["tabular-nums"],
  },
  clearIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  exactBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exactLabel: {
    fontSize: 14,
    color: TINT,
  },
  exactValue: {
    fontSize: 15,
    color: TINT,
    fontVariant: ["tabular-nums"],
  },
  denomBlock: {
    marginTop: 12,
  },
  denomRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  denom: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  denomText: {
    fontSize: 14,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
});
