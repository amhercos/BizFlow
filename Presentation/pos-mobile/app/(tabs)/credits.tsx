import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { useCredits } from "@/src/hooks/use-credits";
import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { CustomerCredit, CustomerCreditSummary } from "@/src/types/credit";
import {
  ArrowUpDown,
  History,
  ReceiptText,
  Search,
  UserCog,
} from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CreditSummarySheet } from "@/components/credits/credit-summary-sheet";
import { EditCreditModal } from "@/components/credits/edit-credit-modal";
import { PayCreditModal } from "@/components/credits/pay-credit-modal";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";
const GREEN = "#15803D";

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
] as const;

export default function CreditsPage() {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const {
    credits,
    refreshing,
    fetchCredits,
    recordPayment,
    updateCredit,
    getSummary,
    getCreditStats,
  } = useCredits();

  const [search, setSearch] = useState("");
  const [showSettled, setShowSettled] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [creditStats, setCreditStats] = useState<
    import("@/src/types/credit").CreditStats | null
  >(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CustomerCredit | null>(
    null,
  );
  const [editingCredit, setEditingCredit] = useState<CustomerCredit | null>(
    null,
  );
  const [summaryData, setSummaryData] = useState<CustomerCreditSummary | null>(
    null,
  );
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCredits(search, showSettled);
    }, 300);
    return () => clearTimeout(handler);
  }, [search, showSettled, fetchCredits]);

  useEffect(() => {
    let active = true;
    setStatsLoading(true);
    getCreditStats(selectedPeriod).then((stats) => {
      if (active) setCreditStats(stats);
      setStatsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [selectedPeriod, getCreditStats]);

  const handleOpenSummary = async (id: string) => {
    setIsSummaryOpen(true);
    setIsSummaryLoading(true);
    const summary = await getSummary(id);
    if (summary) setSummaryData(summary);
    setIsSummaryLoading(false);
  };

  const processedCredits = useMemo(() => {
    const result = [...credits];
    result.sort((a, b) =>
      sortOrder === "asc"
        ? a.creditAmount - b.creditAmount
        : b.creditAmount - a.creditAmount,
    );
    return result;
  }, [credits, sortOrder]);

  const maxDebt = Math.max(
    ...processedCredits.map((c) => c.creditAmount),
    1,
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <DrawerMenuButton />
        <View style={styles.identity}>
          <Text style={[styles.title, typeface(font.bold, "700")]}>Credits</Text>
          <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
            {processedCredits.length} customer
            {processedCredits.length === 1 ? "" : "s"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSettled((v) => !v)}
          style={[styles.headerGhost, showSettled && styles.headerGhostOn]}
          accessibilityLabel="Show settled accounts"
        >
          <History size={14} color={showSettled ? TINT : INK} strokeWidth={1.8} />
          <Text
            style={[
              styles.headerGhostText,
              showSettled && { color: TINT },
              typeface(font.medium, "500"),
            ]}
          >
            Settled
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segment}>
        {PERIODS.map((item) => {
          const active = selectedPeriod === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setSelectedPeriod(item.value)}
              style={[styles.segmentItem, active && styles.segmentItemOn]}
            >
              <Text
                style={[
                  styles.segmentText,
                  active && styles.segmentTextOn,
                  typeface(active ? font.semibold : font.medium, "600"),
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.washes}>
        <View style={[styles.wash, { backgroundColor: "#EAF8D8" }]}>
          <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
            Collected
          </Text>
          {statsLoading ? (
            <Skeleton colorMode="light" width={72} height={20} radius={6} />
          ) : (
            <Text
              style={[styles.washValue, styles.washMoney, typeface(font.bold, "700")]}
              numberOfLines={1}
            >
              {formatPHP(creditStats?.totalCollected ?? 0)}
            </Text>
          )}
        </View>
        <View style={[styles.wash, { backgroundColor: "#FDE6D4" }]}>
          <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
            Outstanding
          </Text>
          {statsLoading ? (
            <Skeleton colorMode="light" width={72} height={20} radius={6} />
          ) : (
            <Text
              style={[
                styles.washValue,
                (creditStats?.totalOutstanding ??
                  creditStats?.totalActiveDebts ??
                  0) > 0 && styles.washAlert,
                typeface(font.bold, "700"),
              ]}
              numberOfLines={1}
            >
              {formatPHP(
                creditStats?.totalOutstanding ??
                  creditStats?.totalActiveDebts ??
                  0,
              )}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCredits(search, showSettled, true)}
            tintColor={TINT}
          />
        }
      >
        <View style={styles.search}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            placeholder="Search customers"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, typeface(font.medium, "500")]}
          />
        </View>

        <View style={styles.listHead}>
          <Text style={[styles.listTitle, typeface(font.bold, "700")]}>
            Customers
          </Text>
          <Pressable
            onPress={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            style={styles.sortBtn}
          >
            <Text style={[styles.sortText, typeface(font.medium, "500")]}>
              Balance
            </Text>
            <ArrowUpDown size={12} color="#94A3B8" />
          </Pressable>
        </View>

        {refreshing && credits.length === 0 ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={styles.row}>
              <Skeleton colorMode="light" width="80%" height={16} radius={6} />
            </View>
          ))
        ) : processedCredits.length === 0 ? (
          <Text style={[styles.empty, typeface(font.regular, "400")]}>
            No customers match
          </Text>
        ) : (
          processedCredits.map((customer) => {
            const settled = customer.creditAmount === 0;
            const share = Math.max(
              0.08,
              Math.min(1, customer.creditAmount / maxDebt),
            );
            return (
              <View key={customer.id} style={styles.row}>
                {!settled ? (
                  <View
                    style={[
                      styles.rowFill,
                      { width: `${Math.round(share * 100)}%` },
                    ]}
                  />
                ) : null}
                <View style={styles.rowBody}>
                  <Text
                    style={[styles.rowName, typeface(font.semibold, "600")]}
                    numberOfLines={1}
                  >
                    {customer.customerName}
                  </Text>
                  <Text
                    style={[styles.rowMeta, typeface(font.medium, "500")]}
                    numberOfLines={1}
                  >
                    {customer.contactInfo || "No contact"}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.rowAmount,
                    { color: settled ? GREEN : "#B45309" },
                    typeface(font.semibold, "600"),
                  ]}
                >
                  {settled ? "Settled" : formatPHP(customer.creditAmount)}
                </Text>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => setEditingCredit(customer)}
                    style={styles.iconAction}
                    hitSlop={8}
                  >
                    <UserCog size={15} color={MUTED} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleOpenSummary(customer.id)}
                    style={styles.iconAction}
                    hitSlop={8}
                  >
                    <ReceiptText size={15} color={MUTED} />
                  </Pressable>
                  {!settled ? (
                    <Pressable
                      onPress={() => setSelectedCredit(customer)}
                      style={styles.payBtn}
                    >
                      <Text
                        style={[styles.payText, typeface(font.semibold, "600")]}
                      >
                        Pay
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <CreditSummarySheet
        summary={summaryData}
        isOpen={isSummaryOpen}
        isLoading={isSummaryLoading}
        onClose={() => setIsSummaryOpen(false)}
      />
      <EditCreditModal
        credit={editingCredit}
        isOpen={!!editingCredit}
        onClose={() => setEditingCredit(null)}
        onConfirm={async (name, contact) => {
          if (editingCredit) {
            await updateCredit({
              id: editingCredit.id,
              customerName: name,
              contactInfo: contact,
            });
            setEditingCredit(null);
          }
        }}
      />
      <PayCreditModal
        credit={selectedCredit}
        isOpen={!!selectedCredit}
        onClose={() => setSelectedCredit(null)}
        onConfirm={async (amount) => {
          if (selectedCredit) {
            await recordPayment(selectedCredit.id, amount);
            setSelectedCredit(null);
          }
        }}
      />
    </View>
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
    marginLeft: 12,
    marginRight: 8,
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
  headerGhost: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerGhostOn: {
    backgroundColor: "#DCEBFF",
  },
  headerGhostText: {
    fontSize: 12,
    color: INK,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 18,
    padding: 4,
    marginHorizontal: 22,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemOn: {
    backgroundColor: TINT,
  },
  segmentText: {
    fontSize: 13,
    color: INK,
  },
  segmentTextOn: {
    color: "#FFFFFF",
  },
  washes: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  wash: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  washLabel: {
    fontSize: 11,
    color: INK,
    opacity: 0.65,
  },
  washValue: {
    marginTop: 6,
    fontSize: 16,
    color: INK,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  washMoney: {
    color: TINT,
  },
  washAlert: {
    color: "#B45309",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: INK,
    paddingVertical: 0,
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 6,
  },
  listTitle: {
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    color: MUTED,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  rowFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#FDE6D4",
    borderRadius: 12,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    zIndex: 1,
  },
  rowName: {
    fontSize: 15,
    color: INK,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: MUTED,
  },
  rowAmount: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    marginRight: 8,
    zIndex: 1,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    zIndex: 1,
  },
  iconAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  payBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  payText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  empty: {
    paddingVertical: 20,
    fontSize: 14,
    color: MUTED,
  },
});
