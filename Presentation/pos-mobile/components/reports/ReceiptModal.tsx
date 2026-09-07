import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { TransactionDetails, TransactionItem } from "@/src/types/record";
import { format } from "date-fns";
import { X } from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const GREEN = "#15803D";
const LINE = "rgba(15, 23, 42, 0.08)";

interface ReceiptModalProps {
  data: TransactionDetails | null;
  visible: boolean;
  onClose: () => void;
}

export function ReceiptModal({ data, visible, onClose }: ReceiptModalProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const isCash = data?.paymentType === "Cash";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.identity}>
              <Text style={[styles.title, typeface(font.bold, "700")]}>
                Receipt
              </Text>
              <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
                {data ? data.id.slice(-12).toUpperCase() : "Loading"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.close}
              accessibilityLabel="Close receipt"
            >
              <X size={18} color={INK} />
            </TouchableOpacity>
          </View>

          {!data ? (
            <View style={styles.body}>
              <Skeleton colorMode="light" width="100%" height={72} radius={16} />
              <View style={{ height: 14 }} />
              <Skeleton colorMode="light" width="100%" height={88} radius={16} />
              <View style={{ height: 14 }} />
              <Skeleton
                colorMode="light"
                width="100%"
                height={120}
                radius={16}
              />
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.meta}>
                <MetaLine
                  label="Date"
                  value={format(
                    new Date(data.transactionDate),
                    "MMM dd, yyyy • hh:mm aa",
                  )}
                />
                <View style={styles.hairline} />
                <MetaLine label="Cashier" value={data.userName || "N/A"} />
                <View style={styles.hairline} />
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, typeface(font.medium, "500")]}>
                    Method
                  </Text>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isCash ? "#E7F8EE" : "#DCEBFF",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isCash ? GREEN : TINT },
                        typeface(font.medium, "500"),
                      ]}
                    >
                      {data.paymentType}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.section, typeface(font.bold, "700")]}>
                Items
              </Text>
              <View style={styles.list}>
                {data.items.map((item: TransactionItem, index: number) => (
                  <View key={`${item.productName}-${index}`}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.itemRow}>
                      <View style={styles.itemBody}>
                        <Text
                          style={[styles.itemName, typeface(font.semibold, "600")]}
                          numberOfLines={1}
                        >
                          {item.productName}
                        </Text>
                        <Text
                          style={[styles.itemMeta, typeface(font.medium, "500")]}
                        >
                          {item.quantity} × {formatPHP(item.unitPrice)}
                        </Text>
                      </View>
                      <Text
                        style={[styles.itemAmount, typeface(font.semibold, "600")]}
                      >
                        {formatPHP(item.subTotal)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.totals}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, typeface(font.medium, "500")]}>
                    Total
                  </Text>
                  <Text style={[styles.totalValue, typeface(font.bold, "700")]}>
                    {formatPHP(data.totalAmount)}
                  </Text>
                </View>
                {isCash ? (
                  <>
                    <View style={styles.hairline} />
                    <View style={styles.totalRow}>
                      <Text
                        style={[styles.metaLabel, typeface(font.medium, "500")]}
                      >
                        Cash received
                      </Text>
                      <Text
                        style={[styles.cashValue, typeface(font.semibold, "600")]}
                      >
                        {formatPHP(data.cashReceived)}
                      </Text>
                    </View>
                    <View style={styles.totalRow}>
                      <Text
                        style={[styles.metaLabel, typeface(font.medium, "500")]}
                      >
                        Change
                      </Text>
                      <Text
                        style={[styles.changeValue, typeface(font.bold, "700")]}
                      >
                        {formatPHP(data.changeAmount)}
                      </Text>
                    </View>
                  </>
                ) : null}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  const font = useInter();
  return (
    <View style={styles.metaRow}>
      <Text style={[styles.metaLabel, typeface(font.medium, "500")]}>
        {label}
      </Text>
      <Text style={[styles.metaValue, typeface(font.semibold, "600")]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  sheet: {
    backgroundColor: "#FAFBFD",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 12,
  },
  identity: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  meta: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: MUTED,
  },
  metaValue: {
    fontSize: 13,
    color: INK,
    flexShrink: 1,
    marginLeft: 12,
    textAlign: "right",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
  },
  section: {
    marginTop: 22,
    marginBottom: 8,
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  list: {
    backgroundColor: "#F4F6FA",
    borderRadius: 16,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  itemBody: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  itemName: {
    fontSize: 15,
    color: INK,
  },
  itemMeta: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
  },
  itemAmount: {
    fontSize: 15,
    color: TINT,
    fontVariant: ["tabular-nums"],
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginLeft: 14,
  },
  totals: {
    marginTop: 16,
    backgroundColor: "#F3F7FF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  totalLabel: {
    fontSize: 13,
    color: MUTED,
  },
  totalValue: {
    fontSize: 22,
    color: TINT,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  cashValue: {
    fontSize: 15,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  changeValue: {
    fontSize: 18,
    color: TINT,
    fontVariant: ["tabular-nums"],
  },
});
