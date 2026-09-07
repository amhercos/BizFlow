import { WeekBarChart } from "@/components/dashboard/WeekBarChart";
import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { TenderMixBar } from "@/components/reports/TenderMixBar";
import { useAuth } from "@/src/context/AuthContext";
import { formatPHP } from "@/src/lib/math";
import { tenderMix } from "@/src/lib/report-analytics";
import { dashboardService } from "@/src/services/dashboardService";
import { reportService } from "@/src/services/reportService";
import { typeface, useInter } from "@/src/theme/typography";
import type { DailySummary, NearExpiryProduct } from "@/src/types/dashboard";
import type { RecentTransaction, TopProduct } from "@/src/types/record";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Metric = "sales" | "orders";

function compactPHP(amount: number) {
  if (amount >= 10000) return `₱${Math.round(amount / 1000)}k`;
  if (amount >= 1000) return `₱${(amount / 1000).toFixed(1)}k`;
  return `₱${Math.round(amount)}`;
}

function roleLabel(role?: string) {
  if (role === "StoreOwner") return "Store owner";
  if (role === "Cashier") return "Cashier";
  if (role === "Admin") return "Admin";
  return "Staff";
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function weekSeries(transactions: RecentTransaction[]) {
  const today = startOfDay(new Date());
  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - offset));
    const start = startOfDay(day).getTime();
    const end = start + 86400000;
    const ofDay = transactions.filter((tx) => {
      const time = new Date(tx.transactionDate).getTime();
      return time >= start && time < end;
    });
    return {
      label: WEEKDAYS[day.getDay()],
      date: day,
      sales: ofDay.reduce((sum, tx) => sum + tx.totalAmount, 0),
      orders: ofDay.length,
    };
  });
}

function expiryTone(days: number) {
  if (days <= 0) return "#E11D48";
  if (days <= 3) return "#B45309";
  return MUTED;
}

function expiryCopy(days: number) {
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const font = useInter();

  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("sales");
  const [selected, setSelected] = useState(6);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [weekTx, setWeekTx] = useState<RecentTransaction[]>([]);
  const [nearExpiry, setNearExpiry] = useState<NearExpiryProduct[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, week, expiry, top] = await Promise.all([
        dashboardService.getSummary(),
        reportService.getRecentTransactions(1, 100, "weekly"),
        dashboardService.getNearExpiry(),
        reportService.getTopSelling(3),
      ]);
      setSummary(s);
      setWeekTx(week);
      setNearExpiry(expiry);
      setTopProducts(top.slice(0, 3));
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const days = useMemo(() => weekSeries(weekTx), [weekTx]);
  const chartValues = days.map((day) =>
    metric === "sales" ? day.sales : day.orders,
  );
  const selectedDay = days[selected] ?? days[6];
  const previous = selected > 0 ? days[selected - 1] : undefined;
  const selectedValue =
    metric === "sales" ? (selectedDay?.sales ?? 0) : (selectedDay?.orders ?? 0);
  const previousValue = metric === "sales" ? previous?.sales : previous?.orders;
  const deltaPct =
    previousValue && previousValue > 0
      ? ((selectedValue - previousValue) / previousValue) * 100
      : null;

  const avgTicket = useMemo(() => {
    const orders = summary?.totalTransactions ?? 0;
    if (!orders) return 0;
    return (summary?.totalRevenue ?? 0) / orders;
  }, [summary]);

  const mix = useMemo(() => tenderMix(weekTx), [weekTx]);
  const maxSold = Math.max(...topProducts.map((p) => p.quantitySold), 1);

  const recent = useMemo(
    () =>
      [...weekTx]
        .sort(
          (a, b) =>
            new Date(b.transactionDate).getTime() -
            new Date(a.transactionDate).getTime(),
        )
        .slice(0, 5),
    [weekTx],
  );

  const displayName = user?.fullName || user?.userName || "BizFlow";
  const selectedDate = selectedDay?.date ?? new Date();
  const isToday = selected === days.length - 1;
  const heroKicker = isToday
    ? metric === "sales"
      ? "Today's sales"
      : "Today's orders"
    : `${selectedDate.toLocaleDateString("en-PH", { weekday: "long" })} ${
        metric === "sales" ? "sales" : "orders"
      }`;

  const onSelectDay = useCallback((index: number) => {
    setSelected(index);
    void Haptics.selectionAsync();
  }, []);

  const onMetric = useCallback((item: Metric) => {
    setMetric(item);
    void Haptics.selectionAsync();
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + 10,
        paddingHorizontal: 22,
        paddingBottom: 28,
      }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadData}
          tintColor={TINT}
        />
      }
    >
      <View style={styles.header}>
        <DrawerMenuButton />
        <View style={styles.identity}>
          <Text
            style={[styles.name, typeface(font.bold, "700")]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={[styles.role, typeface(font.medium, "500")]}>
            {roleLabel(user?.role)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/reports")}
          style={styles.headerBtn}
          accessibilityLabel="Open reports"
        >
          <Text style={[styles.headerBtnText, typeface(font.semibold, "600")]}>
            Reports
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segment}>
        {(["sales", "orders"] as Metric[]).map((item) => {
          const active = metric === item;
          return (
            <Pressable
              key={item}
              onPress={() => onMetric(item)}
              style={[styles.segmentItem, active && styles.segmentItemOn]}
            >
              <Text
                style={[
                  styles.segmentText,
                  active && styles.segmentTextOn,
                  typeface(active ? font.semibold : font.medium, "600"),
                ]}
              >
                {item === "sales" ? "Sales" : "Orders"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.heroCard}>
          <Skeleton colorMode="light" width={140} height={14} radius={6} />
          <View style={{ height: 12 }} />
          <Skeleton colorMode="light" width={240} height={38} radius={8} />
          <View style={{ height: 18 }} />
          <Skeleton colorMode="light" width="100%" height={184} radius={16} />
        </View>
      ) : (
        <View style={styles.heroCard}>
          <Text style={[styles.kicker, typeface(font.medium, "500")]}>
            {heroKicker}
          </Text>
          <View style={styles.heroRow}>
            <Text
              style={[
                styles.hero,
                metric === "sales" && styles.heroMoney,
                typeface(font.bold, "700"),
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {metric === "sales" ? formatPHP(selectedValue) : selectedValue}
            </Text>
            {deltaPct != null ? (
              <View
                style={[
                  styles.delta,
                  {
                    backgroundColor: deltaPct >= 0 ? "#E7F8EE" : "#FDECEC",
                  },
                ]}
              >
                {deltaPct >= 0 ? (
                  <TrendingUp size={12} color={GREEN} />
                ) : (
                  <TrendingDown size={12} color="#B91C1C" />
                )}
                <Text
                  style={[
                    styles.deltaText,
                    { color: deltaPct >= 0 ? GREEN : "#B91C1C" },
                    typeface(font.semibold, "600"),
                  ]}
                >
                  {deltaPct >= 0 ? "+" : ""}
                  {deltaPct.toFixed(1)}%
                </Text>
              </View>
            ) : null}
          </View>

          <WeekBarChart
            variant="hero"
            todayIndex={days.length - 1}
            values={chartValues}
            labels={days.map((day) => day.label)}
            selected={selected}
            onSelect={onSelectDay}
            formatValue={
              metric === "sales" ? compactPHP : (value) => String(value)
            }
            fontFamily={font.semibold}
          />
        </View>
      )}

      <View style={styles.washes}>
        <Pressable
          onPress={() => router.push("/(tabs)/reports")}
          style={[styles.wash, { backgroundColor: "#EAF8D8" }]}
        >
          <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
            Orders today
          </Text>
          <Text style={[styles.washValue, typeface(font.bold, "700")]}>
            {loading ? "—" : `${summary?.totalTransactions ?? 0}`}
          </Text>
        </Pressable>
        <View style={[styles.wash, { backgroundColor: "#DCEBFF" }]}>
          <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
            Sale
          </Text>
          <Text
            style={[
              styles.washValue,
              styles.washMoney,
              typeface(font.bold, "700"),
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {loading ? "—" : formatPHP(avgTicket)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/inventory")}
          style={[styles.wash, { backgroundColor: "#FDE6D4" }]}
        >
          <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
            Low stock
          </Text>
          <Text
            style={[
              styles.washValue,
              (summary?.lowStockCount ?? 0) > 0 && styles.washAlert,
              typeface(font.bold, "700"),
            ]}
          >
            {loading ? "—" : `${summary?.lowStockCount ?? 0}`}
          </Text>
        </Pressable>
      </View>

      {!loading ? <TenderMixBar mix={mix} font={font} insight /> : null}

      <View style={styles.listHead}>
        <Text style={[styles.listTitle, typeface(font.bold, "700")]}>
          Top products
        </Text>
        <View style={styles.chip}>
          <Text style={[styles.chipText, typeface(font.medium, "500")]}>
            Top 3
          </Text>
        </View>
      </View>

      {loading ? (
        [1, 2, 3].map((i) => (
          <View key={i} style={styles.productRow}>
            <Skeleton colorMode="light" width="78%" height={16} radius={6} />
          </View>
        ))
      ) : topProducts.length === 0 ? (
        <Text style={[styles.empty, typeface(font.regular, "400")]}>
          No sales to rank yet
        </Text>
      ) : (
        topProducts.map((product, index) => {
          const share = Math.max(0.08, product.quantitySold / maxSold);
          const rankStyle =
            index === 0
              ? styles.rankGold
              : index === 1
                ? styles.rankSilver
                : styles.rankBronze;
          const rankText = index === 0 ? styles.rankTextOn : styles.rankText;
          return (
            <Pressable
              key={`${product.name}-${index}`}
              onPress={() => router.push("/(tabs)/reports")}
              style={styles.productRow}
            >
              <View
                style={[
                  styles.productFill,
                  {
                    width: `${Math.round(share * 100)}%`,
                    backgroundColor: index === 0 ? "#DCEBFF" : "#EEF1F6",
                  },
                ]}
              />
              <View style={[styles.rank, rankStyle]}>
                <Text style={[rankText, typeface(font.semibold, "600")]}>
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[styles.productName, typeface(font.semibold, "600")]}
                numberOfLines={1}
              >
                {product.name}
              </Text>
              <Text style={[styles.productMeta, typeface(font.medium, "500")]}>
                {product.quantitySold} sold
              </Text>
            </Pressable>
          );
        })
      )}

      {!loading && nearExpiry.length > 0 ? (
        <Pressable
          onPress={() => router.push("/(tabs)/inventory")}
          style={styles.expiryCard}
        >
          <View style={styles.expiryHead}>
            <Text style={[styles.expiryTitle, typeface(font.semibold, "600")]}>
              Near expiry
            </Text>
            <Text style={[styles.expiryCount, typeface(font.medium, "500")]}>
              {nearExpiry.length} item{nearExpiry.length === 1 ? "" : "s"}
            </Text>
          </View>
          {nearExpiry.slice(0, 3).map((item) => (
            <View key={item.id} style={styles.expiryRow}>
              <Text
                style={[styles.expiryName, typeface(font.medium, "500")]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  styles.expiryDays,
                  { color: expiryTone(item.daysUntilExpiry) },
                  typeface(font.semibold, "600"),
                ]}
              >
                {expiryCopy(item.daysUntilExpiry)}
              </Text>
            </View>
          ))}
        </Pressable>
      ) : null}

      <View style={styles.recentHead}>
        <Text style={[styles.recentTitle, typeface(font.bold, "700")]}>
          Recent
        </Text>
        {!loading ? (
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/reports")}
            style={styles.seeAllBtn}
          >
            <Text style={[styles.seeAll, typeface(font.semibold, "600")]}>
              See all
            </Text>
            <ChevronRight size={14} color={TINT} />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        [1, 2, 3].map((i) => (
          <View key={i} style={styles.recentRow}>
            <Skeleton colorMode="light" width="70%" height={16} radius={6} />
          </View>
        ))
      ) : recent.length === 0 ? (
        <Text style={[styles.empty, typeface(font.regular, "400")]}>
          No sales this week
        </Text>
      ) : (
        recent.map((tx, index) => {
          const credit = tx.paymentType === "Credit";
          return (
            <View key={tx.id}>
              {index > 0 ? <View style={styles.hairline} /> : null}
              <Pressable
                onPress={() => router.push("/(tabs)/reports")}
                style={styles.recentRow}
              >
                <View style={styles.recentBody}>
                  <Text
                    style={[styles.recentName, typeface(font.semibold, "600")]}
                  >
                    {tx.itemCount} {tx.itemCount === 1 ? "item" : "items"}
                  </Text>
                  <View style={styles.recentMetaRow}>
                    <View
                      style={[
                        styles.payPill,
                        credit ? styles.payPillCredit : styles.payPillCash,
                      ]}
                    >
                      <Text
                        style={[
                          styles.payPillText,
                          { color: credit ? TINT : GREEN },
                          typeface(font.medium, "500"),
                        ]}
                      >
                        {tx.paymentType}
                      </Text>
                    </View>
                    <Text
                      style={[styles.recentMeta, typeface(font.medium, "500")]}
                    >
                      {new Date(tx.transactionDate).toLocaleString(undefined, {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.amount, typeface(font.semibold, "600")]}>
                  {formatPHP(tx.totalAmount)}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
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
    marginBottom: 18,
  },
  identity: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 0,
  },
  name: {
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  role: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
  },
  headerBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#DCEBFF",
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: 18,
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
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
    marginBottom: 10,
  },
  hero: {
    fontSize: 36,
    color: INK,
    letterSpacing: -1.2,
    fontVariant: ["tabular-nums"],
  },
  heroMoney: {
    color: TINT,
  },
  delta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  deltaText: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
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
  washAlert: {
    color: "#B45309",
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 6,
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
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
  },
  productFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    zIndex: 1,
  },
  rankGold: {
    backgroundColor: TINT,
  },
  rankSilver: {
    backgroundColor: "#DCEBFF",
  },
  rankBronze: {
    backgroundColor: "#EEF1F6",
  },
  rankText: {
    fontSize: 12,
    color: INK,
  },
  rankTextOn: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  productName: {
    flex: 1,
    fontSize: 15,
    color: INK,
    zIndex: 1,
  },
  productMeta: {
    fontSize: 12,
    color: GREEN,
    fontVariant: ["tabular-nums"],
    zIndex: 1,
  },
  empty: {
    paddingVertical: 16,
    fontSize: 14,
    color: MUTED,
  },
  expiryCard: {
    marginTop: 12,
    backgroundColor: "#FDE6D4",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  expiryHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  expiryTitle: {
    fontSize: 13,
    color: "#B45309",
  },
  expiryCount: {
    fontSize: 12,
    color: "#B45309",
    opacity: 0.8,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  expiryName: {
    flex: 1,
    fontSize: 13,
    color: INK,
  },
  expiryDays: {
    fontSize: 12,
  },
  recentHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 4,
  },
  recentTitle: {
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAll: {
    fontSize: 14,
    color: TINT,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  recentBody: {
    flex: 1,
    marginRight: 12,
  },
  recentName: {
    fontSize: 15,
    color: INK,
  },
  recentMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  payPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  payPillCash: {
    backgroundColor: "#E7F8EE",
  },
  payPillCredit: {
    backgroundColor: "#DCEBFF",
  },
  payPillText: {
    fontSize: 11,
  },
  recentMeta: {
    fontSize: 12,
    color: MUTED,
  },
  amount: {
    fontSize: 15,
    color: TINT,
    fontVariant: ["tabular-nums"],
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
});
