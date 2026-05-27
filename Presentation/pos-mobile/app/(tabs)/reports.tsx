import { CalendarDays, Filter, RefreshCcw, Search } from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, {
  memo,
  ReactElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ReceiptModal } from "@/components/reports/ReceiptModal";
import { TransactionTable } from "@/components/reports/TransactionTable";
import { useReport } from "@/src/hooks/use-report";
import { useTransactionHistory } from "@/src/hooks/use-transaction-history";
import type { ReportPeriod } from "@/src/services/reportService";
import type { TransactionDetails } from "@/src/types/record";

interface AnalyticsCardProps {
  label: string;
  value: string;
  accent: string;
  width: DimensionValue;
  loading?: boolean; // Added prop
}

const AnalyticsCard = memo(
  ({
    label,
    value,
    accent,
    width,
    loading,
  }: AnalyticsCardProps): ReactElement => (
    <View
      style={{ width }}
      className="bg-white border border-slate-100 p-5 rounded-[28px] shadow-sm"
    >
      {/* Skeleton.Group synchronizes the shimmer wave */}
      <Skeleton.Group show={!!loading}>
        <View className={`w-8 h-1.5 rounded-full mb-4 ${accent}`} />
        <Text className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
          {label}
        </Text>
        <Skeleton colorMode="light" width="85%" height={24} radius={8}>
          <Text className="text-lg font-black text-slate-950" numberOfLines={1}>
            {value}
          </Text>
        </Skeleton>
      </Skeleton.Group>
    </View>
  ),
);
AnalyticsCard.displayName = "AnalyticsCard";

const Pagination = memo(
  ({
    page,
    setPage,
    hasMore,
  }: {
    page: number;
    setPage: (p: number) => void;
    hasMore: boolean;
  }): ReactElement => (
    <View className="flex-row items-center justify-between mt-6">
      <TouchableOpacity
        onPress={() => setPage(page - 1)}
        disabled={page === 1}
        className={`px-4 py-2 rounded-xl ${page === 1 ? "opacity-20" : "bg-slate-100"}`}
      >
        <Text className="text-[10px] font-black uppercase text-slate-900">
          Prev
        </Text>
      </TouchableOpacity>

      <View className="flex-row items-center">
        <CalendarDays size={12} color="#94a3b8" />
        <Text className="ml-2 text-[10px] font-black text-slate-400 uppercase">
          Page {page}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => setPage(page + 1)}
        disabled={!hasMore}
        className={`px-4 py-2 rounded-xl ${!hasMore ? "opacity-20" : "bg-slate-100"}`}
      >
        <Text className="text-[10px] font-black uppercase text-slate-900">
          Next
        </Text>
      </TouchableOpacity>
    </View>
  ),
);
Pagination.displayName = "Pagination";

export default function RecordsScreen(): ReactElement {
  const {
    summary,
    recentTransactions,
    loading: summaryLoading,
    period,
    setPeriod,
    refresh: refreshSummary,
  } = useReport("today");

  const {
    loading: historyLoading,
    page,
    setPage,
    pageSize,
    getTransactionById,
    topProduct,
  } = useTransactionHistory();

  const loading = summaryLoading || historyLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<"All" | "Cash" | "Credit">(
    "All",
  );
  const [selectedTx, setSelectedTx] = useState<TransactionDetails | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const formatPHP = useCallback(
    (val: number) =>
      `₱${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [],
  );

  const handleOpenReceipt = useCallback(
    async (id: string) => {
      if (isFetchingDetails) return;
      setIsReceiptOpen(true);
      setSelectedTx(null);
      setIsFetchingDetails(true);

      try {
        const data = await getTransactionById(id);
        if (data) setSelectedTx(data);
        else setIsReceiptOpen(false);
      } catch {
        setIsReceiptOpen(false);
      } finally {
        setIsFetchingDetails(false);
      }
    },
    [getTransactionById, isFetchingDetails],
  );

  const filteredTransactions = useMemo(() => {
    return recentTransactions.filter((tx) => {
      const matchesSearch = tx.id
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesMethod =
        methodFilter === "All" || tx.paymentType === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [recentTransactions, searchQuery, methodFilter]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View key={`screen-${period}`} style={styles.contentWrapper}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-6 pt-6 flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-slate-950 tracking-tighter">
                Analytics
              </Text>
              <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Business Performance
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => refreshSummary()}
              disabled={loading}
              className="bg-slate-100 p-3 rounded-2xl"
            >
              <RefreshCcw size={18} color={loading ? "#cbd5e1" : "#0f172a"} />
            </TouchableOpacity>
          </View>

          {/* Period Switcher */}
          <View className="px-6 py-6">
            <View className="flex-row bg-slate-100 p-1 rounded-2xl">
              {(["today", "weekly", "monthly"] as ReportPeriod[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPeriod(p)}
                  className={`flex-1 py-2.5 rounded-xl items-center ${period === p ? "bg-white shadow-sm" : ""}`}
                >
                  <Text
                    className={`text-[10px] font-black uppercase ${period === p ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats Grid - Skeleton Added */}
          <View className="px-6 mb-8">
            <View className="flex-row justify-between mb-4">
              <AnalyticsCard
                loading={summaryLoading}
                label={`${period} Revenue`}
                value={formatPHP(summary?.totalRevenue || 0)}
                accent="bg-emerald-500"
                width="48%"
              />
              <AnalyticsCard
                loading={summaryLoading}
                label="Volume"
                value={(summary?.totalTransactions ?? 0).toString()}
                accent="bg-blue-500"
                width="48%"
              />
            </View>
            <AnalyticsCard
              loading={historyLoading}
              label="Most Popular Item"
              value={topProduct?.name || "No Data"}
              accent="bg-amber-500"
              width="100%"
            />
          </View>

          {/* Search & Filter */}
          <View className="px-6 mb-4">
            <View className="flex-row gap-2">
              <View className="flex-1 flex-row items-center bg-slate-50 rounded-2xl px-4 h-12">
                <Search size={18} color="#94a3b8" />
                <TextInput
                  placeholder="Search Reference..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-2 text-sm font-bold text-slate-700"
                />
              </View>
              <TouchableOpacity
                onPress={() =>
                  setMethodFilter((prev) =>
                    prev === "All"
                      ? "Cash"
                      : prev === "Cash"
                        ? "Credit"
                        : "All",
                  )
                }
                className="bg-slate-900 rounded-2xl px-4 flex-row items-center"
              >
                <Filter size={16} color="white" />
                <Text className="ml-2 text-[10px] font-black text-white uppercase">
                  {methodFilter}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transactions Area - Skeleton handling is passed to TransactionTable */}
          <View className="px-6 mb-24">
            <Text className="text-lg font-black text-slate-900 mb-4">
              {period.charAt(0).toUpperCase() + period.slice(1)} Transactions
            </Text>
            <TransactionTable
              data={filteredTransactions}
              loading={loading}
              onViewDetails={handleOpenReceipt}
            />

            {/* Hide pagination during load to prevent accidental clicks */}
            {!loading && (
              <Pagination
                page={page}
                setPage={setPage}
                hasMore={recentTransactions.length >= pageSize}
              />
            )}
          </View>
        </ScrollView>
      </View>

      <ReceiptModal
        data={selectedTx}
        visible={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedTx(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
});
