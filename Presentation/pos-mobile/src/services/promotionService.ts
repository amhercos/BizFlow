import { apiClient } from "../api/client";
import {
  CreatePromotionRequest,
  Promotion,
  PromotionCalculationRequest,
  PromotionCalculationResponse,
  UpdatePromotionRequest,
} from "../types/promotion";
import { showToast } from "../utils/toast";

export const promotionService = {
  getAll: async (): Promise<Promotion[]> => {
    const response = await apiClient.get<Promotion[]>("/Promotions");
    return response.data;
  },

  getById: async (id: string): Promise<Promotion> => {
    const response = await apiClient.get<Promotion>(`/Promotions/${id}`);
    return response.data;
  },

  create: async (data: CreatePromotionRequest): Promise<Promotion> => {
    const response = await apiClient.post<Promotion>("/Promotions", data);
    showToast.success("Success", "Promotion created successfully");
    return response.data;
  },

  update: async (data: UpdatePromotionRequest): Promise<void> => {
    await apiClient.put(`/Promotions/${data.mainProductId}`, data);
    showToast.success("Updated", "Promotion has been updated");
  },

  toggle: async (id: string): Promise<void> => {
    await apiClient.patch(`/Promotions/${id}/toggle`);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/Promotions/${id}`);
    showToast.success("Deleted", "Promotion removed");
  },

  calculate: async (
    params: PromotionCalculationRequest,
  ): Promise<PromotionCalculationResponse> => {
    const response = await apiClient.post<PromotionCalculationResponse>(
      "/Promotions/calculate",
      {
        productId: params.productId,
        quantity: params.quantity,
        basket:
          params.basket?.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: 0,
          })) || [],
      },
    );
    return response.data;
  },
};
