import { reportService, type ReportPeriod } from "@/src/services/reportService";
import type {
  DailySummary,
  RecentTransaction,
  TopProduct,
  TransactionDetails,
} from "@/src/types/record";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

const LIST_PAGE_SIZE = 10;
const CHART_PAGE_SIZE = 200;

export const useReport = (initialPeriod: ReportPeriod = "today") => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [chartTransactions, setChartTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [topProduct, setTopProduct] = useState<TopProduct | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [period, setPeriodState] = useState<ReportPeriod>(initialPeriod);
  const [page, setPage] = useState(1);

  const fetchAnalytics = useCallback(async (targetPeriod: ReportPeriod) => {
    setAnalyticsLoading(true);
    try {
      const [summaryData, chartData, topSelling] = await Promise.all([
        reportService.getSummary(targetPeriod),
        reportService.getRecentTransactions(1, CHART_PAGE_SIZE, targetPeriod),
        reportService.getTopSelling(1),
      ]);
      setSummary(summaryData);
      setChartTransactions(chartData);
      setTopProduct(topSelling[0] ?? null);
    } catch (error) {
      console.error("[useReport] Error fetching analytics:", error);
      Alert.alert(
        "Error",
        "Failed to load report data. Please check your connection.",
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchList = useCallback(
    async (targetPeriod: ReportPeriod, targetPage: number) => {
      setListLoading(true);
      try {
        const transactionsData = await reportService.getRecentTransactions(
          targetPage,
          LIST_PAGE_SIZE,
          targetPeriod,
        );
        setRecentTransactions(transactionsData);
      } catch (error) {
        console.error("[useReport] Error fetching transactions:", error);
      } finally {
        setListLoading(false);
      }
    },
    [],
  );

  const setPeriod = useCallback((next: ReportPeriod) => {
    setPeriodState(next);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  useEffect(() => {
    fetchList(period, page);
  }, [period, page, fetchList]);

  const getTransactionById = useCallback(
    async (id: string): Promise<TransactionDetails | null> => {
      try {
        return await reportService.getTransactionById(id);
      } catch (err) {
        console.error("Get Transaction Details Error:", err);
        return null;
      }
    },
    [],
  );

  const refresh = useCallback(() => {
    void fetchAnalytics(period);
    void fetchList(period, page);
  }, [fetchAnalytics, fetchList, period, page]);

  return {
    summary,
    recentTransactions,
    chartTransactions,
    topProduct,
    loading: analyticsLoading || listLoading,
    analyticsLoading,
    listLoading,
    period,
    setPeriod,
    page,
    setPage,
    pageSize: LIST_PAGE_SIZE,
    refresh,
    getTransactionById,
  };
};
