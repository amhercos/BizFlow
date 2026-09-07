import { WeekBarChart } from "@/components/dashboard/WeekBarChart";
import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { useAuth } from "@/src/context/AuthContext";
import { dashboardService } from "@/src/services/dashboardService";
import { reportService } from "@/src/services/reportService";
import { typeface, useInter } from "@/src/theme/typography";
import {
  DailySummary,
  NearExpiryProduct,
} from "@/src/types/dashboard";
import type { RecentTransaction, TopProduct } from "@/src/types/record";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Bell, TrendingDown, TrendingUp } from "lucide-react-native";
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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Metric = "sales" | "orders";

function formatPHP(amount: number) {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
      sales: ofDay.reduce((sum, tx) => sum + tx.totalAmount, 0),
      orders: ofDay.length,
    };
  });
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
        reportService.getTopSelling(8),
      ]);
      setSummary(s);
      setWeekTx(week);
      setNearExpiry(expiry);
      setTopProducts(top);
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
    metric === "sales" ? selectedDay?.sales ?? 0 : selectedDay?.orders ?? 0;
  const previousValue =
    metric === "sales" ? previous?.sales : previous?.orders;
  const deltaPct =
    previousValue && previousValue > 0
      ? ((selectedValue - previousValue) / previousValue) * 100
      : null;

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
        paddingBottom: 110,
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
          style={styles.iconBtn}
          accessibilityLabel="Open reports"
        >
          <Bell size={20} color={INK} strokeWidth={1.8} />
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
        <View style={{ marginTop: 18 }}>
          <Skeleton colorMode="light" width={140} height={14} radius={6} />
          <View style={{ height: 12 }} />
          <Skeleton colorMode="light" width={240} height={38} radius={8} />
          <View style={{ height: 22 }} />
          <Skeleton colorMode="light" width="100%" height={168} radius={16} />
        </View>
      ) : (
        <>
          <Text style={[styles.kicker, typeface(font.medium, "500")]}>
            {metric === "sales" ? "Daily sales" : "Daily orders"}
          </Text>
          <View style={styles.heroRow}>
            <Text
              style={[styles.hero, typeface(font.bold, "700")]}
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
                  <TrendingUp size={12} color="#15803D" />
                ) : (
                  <TrendingDown size={12} color="#B91C1C" />
                )}
                <Text
                  style={[
                    styles.deltaText,
                    { color: deltaPct >= 0 ? "#15803D" : "#B91C1C" },
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
            values={chartValues}
            labels={days.map((day) => day.label)}
            selected={selected}
            onSelect={onSelectDay}
            formatValue={
              metric === "sales" ? compactPHP : (value) => String(value)
            }
            fontFamily={font.semibold}
          />
        </>
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
        <Pressable
          onPress={() => router.push("/(tabs)/inventory")}
          style={[styles.wash, { backgroundColor: "#FDE6D4" }]}
        >
          <Text style={[styles.washLabel, typeface(font.medium, "500")]}>
            Low stock
          </Text>
          <Text style={[styles.washValue, typeface(font.bold, "700")]}>
            {loading ? "—" : `${summary?.lowStockCount ?? 0}`}
          </Text>
        </Pressable>
      </View>

      <View style={styles.listHead}>
        <Text style={[styles.listTitle, typeface(font.bold, "700")]}>
          Top products
        </Text>
        <View style={styles.chip}>
          <Text style={[styles.chipText, typeface(font.medium, "500")]}>
            Bestsellers
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
        topProducts.map((product, index) => (
          <View key={`${product.name}-${index}`} style={styles.productRow}>
            <View style={styles.rank}>
              <Text style={[styles.rankText, typeface(font.semibold, "600")]}>
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
          </View>
        ))
      )}

      {!loading && nearExpiry.length > 0 ? (
        <Pressable
          onPress={() => router.push("/(tabs)/inventory")}
          style={styles.notice}
        >
          <Text style={[styles.noticeText, typeface(font.medium, "500")]}>
            {nearExpiry.length} item{nearExpiry.length === 1 ? "" : "s"} near
            expiry
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.recentHead}>
        <Text style={[styles.recentTitle, typeface(font.bold, "700")]}>
          Recent
        </Text>
        {!loading ? (
          <TouchableOpacity onPress={() => router.push("/(tabs)/reports")}>
            <Text style={[styles.seeAll, typeface(font.semibold, "600")]}>
              See all
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading
        ? [1, 2, 3].map((i) => (
            <View key={i} style={styles.recentRow}>
              <Skeleton colorMode="light" width="70%" height={16} radius={6} />
            </View>
          ))
        : recent.length === 0
          ? (
              <Text style={[styles.empty, typeface(font.regular, "400")]}>
                No sales this week
              </Text>
            )
          : recent.map((tx, index) => (
              <View key={tx.id}>
                {index > 0 ? <View style={styles.hairline} /> : null}
                <View style={styles.recentRow}>
                  <View style={styles.recentBody}>
                    <Text
                      style={[styles.recentName, typeface(font.semibold, "600")]}
                    >
                      {tx.itemCount} {tx.itemCount === 1 ? "item" : "items"}
                    </Text>
                    <Text
                      style={[styles.recentMeta, typeface(font.medium, "500")]}
                    >
                      {tx.paymentType} ·{" "}
                      {new Date(tx.transactionDate).toLocaleString(undefined, {
                        weekday: "short",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[styles.amount, typeface(font.semibold, "600")]}
                  >
                    {formatPHP(tx.totalAmount)}
                  </Text>
                </View>
              </View>
            ))}
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
    justifyContent: "space-between",
    marginBottom: 20,
  },
  identity: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
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
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 14,
    color: MUTED,
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
    gap: 12,
    marginTop: 28,
  },
  wash: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  washLabel: {
    fontSize: 13,
    color: INK,
    opacity: 0.65,
  },
  washValue: {
    marginTop: 10,
    fontSize: 22,
    color: INK,
    letterSpacing: -0.4,
    fontVariant: ["tabular-nums"],
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 32,
    marginBottom: 4,
  },
  listTitle: {
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  chip: {
    backgroundColor: "#E8EEF8",
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
    paddingVertical: 13,
  },
  rank: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    color: INK,
  },
  productName: {
    flex: 1,
    fontSize: 15,
    color: INK,
    marginRight: 12,
  },
  productMeta: {
    fontSize: 13,
    color: MUTED,
    fontVariant: ["tabular-nums"],
  },
  empty: {
    paddingVertical: 16,
    fontSize: 14,
    color: MUTED,
  },
  notice: {
    marginTop: 8,
    paddingVertical: 10,
  },
  noticeText: {
    fontSize: 13,
    color: "#B45309",
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
  seeAll: {
    fontSize: 14,
    color: TINT,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  recentBody: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    color: INK,
  },
  recentMeta: {
    marginTop: 2,
    fontSize: 13,
    color: MUTED,
  },
  amount: {
    fontSize: 15,
    color: INK,
    fontVariant: ["tabular-nums"],
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
  },
});
