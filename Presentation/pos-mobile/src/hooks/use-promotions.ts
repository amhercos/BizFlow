import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { promotionService } from "../services/promotionService";
import {
  CreatePromotionRequest,
  Promotion,
  PromotionCalculationRequest,
  PromotionCalculationResponse,
  UpdatePromotionRequest,
} from "../types/promotion";

export const PROMOTIONS_QUERY_KEY = ["promotions"] as const;

function matchesPromo(promo: Promotion, id: string) {
  return promo.mainProductId === id || promo.id === id;
}

export const usePromotions = () => {
  const queryClient = useQueryClient();

  const {
    data: promotions = [],
    isLoading,
    refetch,
  }: UseQueryResult<Promotion[], Error> = useQuery({
    queryKey: PROMOTIONS_QUERY_KEY,
    queryFn: promotionService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePromotionRequest) => promotionService.create(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePromotionRequest) => promotionService.update(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => promotionService.toggle(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PROMOTIONS_QUERY_KEY });
      const previous =
        queryClient.getQueryData<Promotion[]>(PROMOTIONS_QUERY_KEY);
      queryClient.setQueryData<Promotion[]>(PROMOTIONS_QUERY_KEY, (list) =>
        (list ?? []).map((promo) =>
          matchesPromo(promo, id)
            ? { ...promo, isActive: !promo.isActive }
            : promo,
        ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PROMOTIONS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (isActive, id) => {
      if (typeof isActive !== "boolean") return;
      queryClient.setQueryData<Promotion[]>(PROMOTIONS_QUERY_KEY, (list) =>
        (list ?? []).map((promo) =>
          matchesPromo(promo, id) ? { ...promo, isActive } : promo,
        ),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionService.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROMOTIONS_QUERY_KEY }),
  });

  const calculatePrice = useCallback(
    async (
      params: PromotionCalculationRequest,
    ): Promise<PromotionCalculationResponse> => {
      return await promotionService.calculate(params);
    },
    [],
  );

  return {
    promotions,
    isLoading,
    isProcessing:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
    addPromotion: createMutation.mutate,
    updatePromotion: updateMutation.mutate,
    togglePromotion: toggleMutation.mutate,
    removePromotion: deleteMutation.mutate,
    refresh: refetch,
    calculatePrice,
  };
};
