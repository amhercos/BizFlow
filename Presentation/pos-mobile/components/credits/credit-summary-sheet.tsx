import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { CustomerCreditSummary } from "@/src/types/credit";
import { X } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Modal,
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
const AMBER = "#B45309";
const LINE = "rgba(15, 23, 42, 0.08)";

interface CreditSummarySheetProps {
  summary: CustomerCreditSummary | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function CreditSummarySheet({
  summary,
  isOpen,
  onClose,
  isLoading,
}: CreditSummarySheetProps) {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const settled = (summary?.totalDebt ?? 0) === 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
        <View style={styles.header}>
          <View style={styles.identity}>
            <Text style={[styles.title, typeface(font.bold, "700")]}>
              Payment summary
            </Text>
            <Text
              style={[styles.subtitle, typeface(font.medium, "500")]}
              numberOfLines={1}
            >
              {summary?.customerName ?? "Customer account"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.close}
            accessibilityLabel="Close summary"
          >
            <X size={18} color={INK} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={TINT} />
          </View>
        ) : summary ? (
          <ScrollView
            contentContainerStyle={[
              styles.body,
              { paddingBottom: Math.max(insets.bottom, 28) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profile}>
              <Text
                style={[styles.customer, typeface(font.bold, "700")]}
                numberOfLines={1}
              >
                {summary.customerName}
              </Text>
              <Text style={[styles.contact, typeface(font.medium, "500")]}>
                {summary.contactInfo || "No contact"}
              </Text>
            </View>

            <View
              style={[
                styles.balance,
                { backgroundColor: settled ? "#E7F8EE" : "#FDE6D4" },
              ]}
            >
              <Text style={[styles.balanceLabel, typeface(font.medium, "500")]}>
                Outstanding
              </Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: settled ? GREEN : AMBER },
                  typeface(font.bold, "700"),
                ]}
              >
                {settled ? "Settled" : formatPHP(summary.totalDebt)}
              </Text>
            </View>

            <Text style={[styles.section, typeface(font.bold, "700")]}>
              Purchases
            </Text>
            {summary.creditPurchases.length === 0 ? (
              <Text style={[styles.empty, typeface(font.regular, "400")]}>
                No purchases recorded
              </Text>
            ) : (
              <View style={styles.list}>
                {summary.creditPurchases.map((purchase, index) => (
                  <View key={purchase.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={styles.row}>
                      <View style={styles.rowBody}>
                        <Text
                          style={[styles.rowName, typeface(font.semibold, "600")]}
                        >
                          {purchase.itemCount}{" "}
                          {purchase.itemCount === 1 ? "item" : "items"}
                        </Text>
                        <Text
                          style={[styles.rowMeta, typeface(font.medium, "500")]}
                        >
                          {formatDate(purchase.transactionDate)}
                        </Text>
                      </View>
                      <Text
                        style={[styles.rowAmount, typeface(font.semibold, "600")]}
                      >
                        {formatPHP(purchase.totalAmount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.section, typeface(font.bold, "700")]}>
              Payments
            </Text>
            {summary.paymentHistory.length === 0 ? (
              <Text style={[styles.empty, typeface(font.regular, "400")]}>
                No payments recorded yet
              </Text>
            ) : (
              <View style={styles.list}>
                {summary.paymentHistory.map((payment, index) => (
                  <View key={payment.id}>
                    {index > 0 ? <View style={styles.hairline} /> : null}
                    <View style={[styles.row, styles.payRow]}>
                      <View style={styles.rowFill} />
                      <View style={styles.rowBody}>
                        <Text
                          style={[styles.rowName, typeface(font.semibold, "600")]}
                        >
                          Payment received
                        </Text>
                        <Text
                          style={[styles.rowMeta, typeface(font.medium, "500")]}
                        >
                          {formatDate(payment.paymentDate)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.payAmount,
                          typeface(font.semibold, "600"),
                        ]}
                      >
                        {formatPHP(payment.amount)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAFBFD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  identity: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
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
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 22,
  },
  profile: {
    marginBottom: 12,
  },
  customer: {
    fontSize: 18,
    color: INK,
    letterSpacing: -0.3,
  },
  contact: {
    marginTop: 4,
    fontSize: 13,
    color: MUTED,
  },
  balance: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    color: MUTED,
  },
  balanceValue: {
    marginTop: 6,
    fontSize: 24,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  payRow: {
    overflow: "hidden",
  },
  rowFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E7F8EE",
  },
  rowBody: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
    zIndex: 1,
  },
  rowName: {
    fontSize: 15,
    color: INK,
  },
  rowMeta: {
    marginTop: 3,
    fontSize: 12,
    color: MUTED,
  },
  rowAmount: {
    fontSize: 15,
    color: TINT,
    fontVariant: ["tabular-nums"],
    zIndex: 1,
  },
  payAmount: {
    fontSize: 15,
    color: GREEN,
    fontVariant: ["tabular-nums"],
    zIndex: 1,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LINE,
    marginLeft: 14,
  },
  empty: {
    fontSize: 14,
    color: MUTED,
    paddingVertical: 8,
  },
});
