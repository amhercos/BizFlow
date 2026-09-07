import { WeekBarChart } from "@/components/dashboard/WeekBarChart";
import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { ReceiptModal } from "@/components/reports/ReceiptModal";
import { TenderMixBar } from "@/components/reports/TenderMixBar";
import { TransactionTable } from "@/components/reports/TransactionTable";
import { useReport } from "@/src/hooks/use-report";
import {
  buildReportSeries,
  peakPoint,
  tenderMix,
} from "@/src/lib/report-analytics";
import type { ReportPeriod } from "@/src/services/reportService";
import { typeface, useInter } from "@/src/theme/typography";
import type { TransactionDetails } from "@/src/types/record";
import * as Haptics from "expo-haptics";
import { RefreshCcw, Search } from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "weekly", label: "Week" },
  { id: "monthly", label: "Month" },
];

type MethodFilter = "All" | "Cash" | "Credit";
type ChartMetric = "sales" | "orders";

function formatPHP(val: number) {
  return `₱${val.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function periodKicker(period: ReportPeriod) {
  if (period === "weekly") return "This week's sales";
  if (period === "monthly") return "This month's sales";
  return "Today's sales";
}

function compactPHP(amount: number) {
  if (amount >= 10000) return `₱${Math.round(amount / 1000)}k`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(1)}k`;
  return `₱${Math.round(amount)}`;
}

function chartCaption(period: ReportPeriod) {
  if (period === "today") return "By hour";
  if (period === "monthly") return "By week";
  return "By day";
}

export default function RecordsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const {
    summary,
    recentTransactions,
    chartTransactions,
    topProduct,
    loading,
    analyticsLoading,
    listLoading,
    period,
    setPeriod,
    page,
    setPage,
    pageSize,
    refresh,
    getTransactionById,
  } = useReport("today");

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("All");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("sales");
  const [selectedBar, setSelectedBar] = useState(0);
  const [selectedTx, setSelectedTx] = useState<TransactionDetails | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

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
    const query = searchQuery.trim().toLowerCase();
    return recentTransactions.filter((tx) => {
      const matchesSearch =
        query.length === 0 || tx.id.toLowerCase().includes(query);
      const matchesMethod =
        methodFilter === "All" || tx.paymentType === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [recentTransactions, searchQuery, methodFilter]);

  const series = useMemo(
    () => buildReportSeries(period, chartTransactions),
    [period, chartTransactions],
  );
  const mix = useMemo(() => tenderMix(chartTransactions), [chartTransactions]);
  const itemsSold = useMemo(
    () => chartTransactions.reduce((sum, tx) => sum + (tx.itemCount || 0), 0),
    [chartTransactions],
  );
  const peak = useMemo(
    () => peakPoint(series, chartMetric),
    [series, chartMetric],
  );
  const chartValues = series.map((point) =>
    chartMetric === "sales" ? point.sales : point.orders,
  );

  useEffect(() => {
    setSelectedBar(Math.max(0, series.length - 1));
  }, [period, series.length]);

  const onPeriod = useCallback(
    (next: ReportPeriod) => {
      if (next === period) return;
      setPeriod(next);
      void Haptics.selectionAsync();
    },
    [period, setPeriod],
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 22,
          paddingBottom: 28,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={TINT}
          />
        }
      >
        <View style={styles.header}>
          <DrawerMenuButton />
          <View style={styles.identity}>
            <Text style={[styles.title, typeface(font.bold, "700")]}>
              Reports
            </Text>
            <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
              Sales performance
            </Text>
          </View>
          <TouchableOpacity
            onPress={refresh}
            disabled={loading}
            style={styles.headerBtn}
            accessibilityLabel="Refresh reports"
          >
            <RefreshCcw
              size={14}
              color={loading ? "#93C5FD" : TINT}
              strokeWidth={2}
            />
            <Text style={[styles.headerBtnText, typeface(font.semibold, "600")]}>
              Refresh
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segment}>
          {PERIODS.map((item) => {
            const active = period === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onPeriod(item.id)}
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

        {loading && !summary ? (
          <View style={styles.heroCard}>
            <Skeleton colorMode="light" width={140} height={14} radius={6} />
            <View style={{ height: 12 }} />
            <Skeleton colorMode="light" width={240} height={38} radius={8} />
            <View style={{ height: 18 }} />
            <Skeleton colorMode="light" width="100%" height={168} radius={16} />
          </View>
        ) : (
          <View style={styles.heroCard}>
            <Text style={[styles.kicker, typeface(font.medium, "500")]}>
              {periodKicker(period)}
            </Text>
            <Text
              style={[styles.hero, typeface(font.bold, "700")]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPHP(summary?.totalRevenue ?? 0)}
            </Text>

            <View style={styles.chartHead}>
              <Text style={[styles.listTitle, typeface(font.bold, "700")]}>
                {chartCaption(period)}
              </Text>
              <View style={styles.metricToggle}>
                {(["sales", "orders"] as ChartMetric[]).map((item) => {
                  const active = chartMetric === item;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setChartMetric(item);
                        void Haptics.selectionAsync();
                      }}
                      style={[styles.metricChip, active && styles.metricChipOn]}
                    >
                      <Text
                        style={[
                          styles.metricChipText,
                          active && styles.metricChipTextOn,
                          typeface(font.medium, "500"),
                        ]}
                      >
                        {item === "sales" ? "Sales" : "Orders"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {analyticsLoading && chartTransactions.length === 0 ? (
              <View style={{ marginTop: 12 }}>
                <Skeleton colorMode="light" width="100%" height={168} radius={16} />
              </View>
            ) : (
              <WeekBarChart
                variant="hero"
                values={chartValues}
                labels={series.map((point) => point.label)}
                selected={Math.min(selectedBar, Math.max(series.length - 1, 0))}
                onSelect={(index) => {
                  setSelectedBar(index);
                  void Haptics.selectionAsync();
                }}
                formatValue={
                  chartMetric === "sales" ? compactPHP : (value) => String(value)
                }
                fontFamily={font.semibold}
              />
            )}

            {peak && (chartMetric === "sales" ? peak.sales : peak.orders) > 0 ? (
              <Text style={[styles.insight, typeface(font.medium, "500")]}>
                Busiest {peak.label}
                {" · "}
                {chartMetric === "sales"
                  ? compactPHP(peak.sales)
                  : `${peak.orders} orders`}
              </Text>
            ) : null}
          </View>
        )}

        <TenderMixBar mix={mix} font={font} insight />

        <View style={styles.washes}>
          <View style={[styles.wash, { backgroundColor: "#EAF8D8" }]}>
            <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
              Orders
            </Text>
            <Text style={[styles.washValue, typeface(font.bold, "700")]}>
              {loading && !summary
                ? "—"
                : String(summary?.totalTransactions ?? 0)}
            </Text>
          </View>
          <View style={[styles.wash, { backgroundColor: "#DCEBFF" }]}>
            <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
              Items sold
            </Text>
            <Text
              style={[styles.washValue, typeface(font.bold, "700")]}
              numberOfLines={1}
            >
              {loading && !summary ? "—" : String(itemsSold)}
            </Text>
          </View>
        </View>

        {topProduct ? (
          <View style={styles.topRow}>
            <View style={styles.topFill} />
            <View style={styles.topBody}>
              <Text style={[styles.topLabel, typeface(font.medium, "500")]}>
                Top product
              </Text>
              <Text
                style={[styles.topName, typeface(font.semibold, "600")]}
                numberOfLines={1}
              >
                {topProduct.name}
              </Text>
            </View>
            <Text style={[styles.topMeta, typeface(font.medium, "500")]}>
              {topProduct.quantitySold} sold
            </Text>
          </View>
        ) : null}

        <View style={styles.search}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            placeholder="Search reference"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, typeface(font.medium, "500")]}
          />
        </View>

        <View style={styles.filters}>
          {(["All", "Cash", "Credit"] as MethodFilter[]).map((item) => {
            const active = methodFilter === item;
            return (
              <Pressable
                key={item}
                onPress={() => setMethodFilter(item)}
                style={[styles.filterChip, active && styles.filterChipOn]}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextOn,
                    typeface(font.medium, "500"),
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.listHead}>
          <Text style={[styles.listTitle, typeface(font.bold, "700")]}>
            Transactions
          </Text>
          <View style={styles.chip}>
            <Text style={[styles.chipText, typeface(font.medium, "500")]}>
              {PERIODS.find((item) => item.id === period)?.label}
            </Text>
          </View>
        </View>

        <TransactionTable
          data={filteredTransactions}
          loading={listLoading}
          onViewDetails={handleOpenReceipt}
          font={font}
        />

        {!listLoading ? (
          <View style={styles.pager}>
            <Pressable
              onPress={() => setPage(page - 1)}
              disabled={page === 1}
              style={styles.pagerBtn}
            >
              <Text
                style={[
                  styles.pagerText,
                  page === 1 && styles.pagerDisabled,
                  typeface(font.semibold, "600"),
                ]}
              >
                Previous
              </Text>
            </Pressable>
            <Text style={[styles.pagerPage, typeface(font.medium, "500")]}>
              Page {page}
            </Text>
            <Pressable
              onPress={() => setPage(page + 1)}
              disabled={recentTransactions.length < pageSize}
              style={styles.pagerBtn}
            >
              <Text
                style={[
                  styles.pagerText,
                  recentTransactions.length < pageSize && styles.pagerDisabled,
                  typeface(font.semibold, "600"),
                ]}
              >
                Next
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <ReceiptModal
        data={selectedTx}
        visible={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setSelectedTx(null);
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
    marginBottom: 20,
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
  headerBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#DCEBFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerBtnText: {
    fontSize: 12,
    color: TINT,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 18,
    padding: 4,
    marginBottom: 22,
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
    fontSize: 14,
    color: INK,
  },
  segmentTextOn: {
    color: "#FFFFFF",
  },
  kicker: {
    fontSize: 13,
    color: MUTED,
  },
  heroCard: {
    backgroundColor: "#F3F7FF",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  hero: {
    marginTop: 4,
    fontSize: 36,
    color: TINT,
    letterSpacing: -1.2,
    fontVariant: ["tabular-nums"],
  },
  chartHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 4,
  },
  metricToggle: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 999,
    padding: 3,
  },
  metricChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  metricChipOn: {
    backgroundColor: "#FFFFFF",
  },
  metricChipText: {
    fontSize: 12,
    color: MUTED,
  },
  metricChipTextOn: {
    color: INK,
  },
  insight: {
    marginTop: 6,
    fontSize: 13,
    color: MUTED,
  },
  washes: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
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
    fontSize: 18,
    color: INK,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  washMoney: {
    color: TINT,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  topFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "72%",
    backgroundColor: "#DCEBFF",
    borderRadius: 12,
  },
  topBody: {
    flex: 1,
    marginRight: 12,
    zIndex: 1,
  },
  topLabel: {
    fontSize: 11,
    color: MUTED,
  },
  topName: {
    marginTop: 2,
    fontSize: 15,
    color: INK,
  },
  topMeta: {
    fontSize: 12,
    color: "#15803D",
    fontVariant: ["tabular-nums"],
    zIndex: 1,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    marginTop: 24,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: INK,
    paddingVertical: 0,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#EEF1F6",
  },
  filterChipOn: {
    backgroundColor: TINT,
  },
  filterText: {
    fontSize: 13,
    color: INK,
  },
  filterTextOn: {
    color: "#FFFFFF",
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chip: {
    backgroundColor: "#DCEBFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    color: TINT,
  },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingVertical: 12,
  },
  pagerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  pagerText: {
    fontSize: 14,
    color: TINT,
  },
  pagerDisabled: {
    color: "#CBD5E1",
  },
  pagerPage: {
    fontSize: 13,
    color: MUTED,
  },
});
