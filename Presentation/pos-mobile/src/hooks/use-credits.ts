import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { creditService } from "../services/creditService";
import type {
  ApiErrorResponse,
  CreditStats,
  CustomerCreditSummary,
  UpdateCustomerCreditCommand,
} from "../types/credit";

export const CREDITS_QUERY_KEY = ["customer-credits"] as const;

export function useCredits() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [includeSettled, setIncludeSettled] = useState(false);

  const query = useQuery({
    queryKey: [...CREDITS_QUERY_KEY, search, includeSettled],
    queryFn: () =>
      creditService.getCredits(search.trim() || undefined, includeSettled),
  });

  const fetchCredits = useCallback(
    async (
      nextSearch?: string,
      nextSettled: boolean = false,
      _isRefresh: boolean = false,
    ) => {
      const next = nextSearch ?? "";
      if (next === search && nextSettled === includeSettled) {
        await queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
        return;
      }
      setSearch(next);
      setIncludeSettled(nextSettled);
    },
    [includeSettled, queryClient, search],
  );

  const getSummary = useCallback(
    async (id: string): Promise<CustomerCreditSummary | null> => {
      try {
        return await creditService.getSummary(id);
      } catch {
        Alert.alert("Access Error", "Failed to retrieve the account summary.");
        return null;
      }
    },
    [],
  );

  const getCreditStats = useCallback(
    async (period: string): Promise<CreditStats | null> => {
      try {
        return await creditService.getCreditStats(period);
      } catch {
        Alert.alert("Stats Error", "Unable to load credit statistics.");
        return null;
      }
    },
    [],
  );

  const recordPayment = async (
    creditId: string,
    amount: number,
  ): Promise<void> => {
    try {
      await creditService.recordPayment({
        customerCreditId: creditId,
        amountPaid: amount,
      });
      await queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
    } catch (error: unknown) {
      let message = "The server rejected the payment record.";

      if (isAxiosError<ApiErrorResponse>(error)) {
        message =
          error.response?.data?.error ||
          error.response?.data?.message ||
          message;
      }

      Alert.alert("Payment Failed", message);
      throw error;
    }
  };

  const updateCredit = async (
    command: UpdateCustomerCreditCommand,
  ): Promise<void> => {
    try {
      await creditService.updateCredit(command);
      await queryClient.invalidateQueries({ queryKey: CREDITS_QUERY_KEY });
    } catch (error: unknown) {
      let message = "Failed to save customer changes.";

      if (isAxiosError<ApiErrorResponse>(error)) {
        message = error.response?.data?.error || message;
      }

      Alert.alert("Update Error", message);
      throw error;
    }
  };

  return {
    credits: query.data ?? [],
    loading: query.isLoading,
    refreshing: query.isRefetching,
    fetchCredits,
    getSummary,
    getCreditStats,
    recordPayment,
    updateCredit,
  } as const;
}
