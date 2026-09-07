import { Promotion } from "./promotion";
export interface Category {
  id: string;
  name: string;
  productCount: number;
}

export interface UpdateCategoryNameRequest {
  newCategoryName: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  packPrice?: number | null;
  piecesPerPack?: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  categoryName: string | null;
  categoryId: string | null;
  expiryDate: string | null;
  promotions?: Promotion[];
}

export interface CreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  packPrice?: number | null;
  piecesPerPack?: number | null;
  stockQuantity: number;
  expiryDate: string | null;
  categoryId: string | null;
}

export interface UpdateProductRequest {
  id: string;
  name: string;
  description: string | null;
  price: number;
  packPrice?: number | null;
  piecesPerPack?: number | null;
  stock: number;
  lowStockThreshold: number;
  categoryId: string | null;
  expiryDate: string | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
}

export interface BaseErrorResponse {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isPackConfigValid(
  packPrice: string,
  piecesPerPack: string,
): boolean {
  const price = parseOptionalNumber(packPrice);
  const pieces = parseOptionalNumber(piecesPerPack);
  if (price == null && pieces == null) return true;
  return price != null && price > 0 && pieces != null && pieces > 1;
}
