import type { ReportPeriod } from "@/src/services/reportService";
import type { RecentTransaction } from "@/src/types/record";

export type SeriesPoint = {
  label: string;
  sales: number;
  orders: number;
};

export type TenderMix = {
  cash: number;
  credit: number;
  cashPct: number;
  creditPct: number;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function inRange(time: number, start: number, end: number) {
  return time >= start && time < end;
}

function hourSeries(transactions: RecentTransaction[]): SeriesPoint[] {
  const slots = [
    { label: "6am", start: 6, end: 9 },
    { label: "9am", start: 9, end: 12 },
    { label: "12pm", start: 12, end: 15 },
    { label: "3pm", start: 15, end: 18 },
    { label: "6pm", start: 18, end: 21 },
    { label: "9pm", start: 21, end: 24 },
  ];

  return slots.map((slot) => {
    const ofSlot = transactions.filter((tx) => {
      const hour = new Date(tx.transactionDate).getHours();
      if (slot.label === "9p") return hour >= 21 || hour < 6;
      return hour >= slot.start && hour < slot.end;
    });
    return {
      label: slot.label,
      sales: ofSlot.reduce((sum, tx) => sum + tx.totalAmount, 0),
      orders: ofSlot.length,
    };
  });
}

function weekSeries(transactions: RecentTransaction[]): SeriesPoint[] {
  const today = startOfDay(new Date());
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

  return Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - offset));
    const start = startOfDay(day).getTime();
    const ofDay = transactions.filter((tx) =>
      inRange(new Date(tx.transactionDate).getTime(), start, start + 86400000),
    );
    return {
      label: days[day.getDay()],
      sales: ofDay.reduce((sum, tx) => sum + tx.totalAmount, 0),
      orders: ofDay.length,
    };
  });
}

function monthSeries(transactions: RecentTransaction[]): SeriesPoint[] {
  const today = startOfDay(new Date());

  return Array.from({ length: 4 }, (_, offset) => {
    const end = new Date(today);
    end.setDate(today.getDate() - (3 - offset) * 7 + 1);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    const startMs = start.getTime();
    const endMs = end.getTime();
    const ofWeek = transactions.filter((tx) =>
      inRange(new Date(tx.transactionDate).getTime(), startMs, endMs),
    );
    return {
      label: start.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
      }),
      sales: ofWeek.reduce((sum, tx) => sum + tx.totalAmount, 0),
      orders: ofWeek.length,
    };
  });
}

export function buildReportSeries(
  period: ReportPeriod,
  transactions: RecentTransaction[],
): SeriesPoint[] {
  if (period === "today") return hourSeries(transactions);
  if (period === "monthly") return monthSeries(transactions);
  return weekSeries(transactions);
}

export function tenderMix(transactions: RecentTransaction[]): TenderMix {
  const cash = transactions
    .filter((tx) => tx.paymentType === "Cash")
    .reduce((sum, tx) => sum + tx.totalAmount, 0);
  const credit = transactions
    .filter((tx) => tx.paymentType === "Credit")
    .reduce((sum, tx) => sum + tx.totalAmount, 0);
  const total = cash + credit;
  return {
    cash,
    credit,
    cashPct: total > 0 ? Math.round((cash / total) * 100) : 0,
    creditPct: total > 0 ? Math.round((credit / total) * 100) : 0,
  };
}

export function peakPoint(series: SeriesPoint[], metric: "sales" | "orders") {
  if (series.length === 0) return null;
  return series.reduce((best, point) =>
    (metric === "sales" ? point.sales : point.orders) >
    (metric === "sales" ? best.sales : best.orders)
      ? point
      : best,
  );
}
