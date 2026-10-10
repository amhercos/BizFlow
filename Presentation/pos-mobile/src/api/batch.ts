import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const batchClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

batchClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("bizflow_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber?: string;
  quantity: number;
  remainingQuantity: number;
  expiryDate?: string;
  costPrice?: number;
  createdAt?: string;
  isDeleted?: boolean;
}

export async function getProductBatches(productId: string): Promise<ProductBatch[]> {
  const endpoints = [
    `/product/batches/product/${productId}`,
    `/products/${productId}/batches`,
    `/product/${productId}/batches`,
    `/batches/product/${productId}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await batchClient.get(endpoint);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status && err.response.status !== 404) {
        console.warn(`Batch fetch error on ${endpoint}:`, err.message);
      }
    }
  }
  return [];
}

export async function createProductBatch(data: {
  productId: string;
  quantity: number;
  expiryDate?: string;
  costPrice?: number;
  batchNumber?: string;
}): Promise<ProductBatch> {
  const response = await batchClient.post("/product/batches", data);
  return response.data;
}

export async function deleteProductBatch(batchId: string): Promise<void> {
  await batchClient.delete(`/product/batches/${batchId}`);
}