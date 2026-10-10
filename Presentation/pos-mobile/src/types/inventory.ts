export interface Category {
  productCount?: number;
  id: string;
  name: string;
}

export interface ProductFormState {
  name: string;
  price: string;
  packPrice: string;
  piecesPerPack: string;
  stockQuantity: string;
  categoryId: string | null;
  description: string;
  expiryDate: string;
}

export interface Product {
  categoryName?: string | null;
  id: string;
  name: string;
  price: number;
  packPrice?: number | null;
  piecesPerPack?: number | null;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId?: string | null;
  description?: string;
  expiryDate?: string | null;
}

export interface CreateProductRequest {
  name: string;
  price: number;
  packPrice?: number | null;
  piecesPerPack?: number | null;
  stockQuantity: number;
  categoryId: string | null;
  description?: string;
  expiryDate?: string | null;
}

export interface UpdateProductRequest {
  id: string;
  name: string;
  price: number;
  packPrice?: number | null;
  piecesPerPack?: number | null;
  stock: number;
  lowStockThreshold: number;
  categoryId: string | null;
  description?: string;
  expiryDate?: string | null;
}

export function isPackConfigValid(packPrice: string, piecesPerPack: string): boolean {
  const hasPackPrice = packPrice.trim() !== "";
  const hasPieces = piecesPerPack.trim() !== "";
  if (!hasPackPrice && !hasPieces) return true;
  return hasPackPrice && hasPieces && Number(piecesPerPack) > 1 && Number(packPrice) > 0;
}

export function parseOptionalNumber(val: string): number | null {
  const num = Number(val);
  return isNaN(num) || val.trim() === "" ? null : num;
}

export interface PagedResponse<T> {
  items: T[];
  page?: number;
  pageSize?: number;
  totalCount: number;
  totalPages?: number;
}

export interface UpdateCategoryNameRequest {
  newCategoryName: string;
}
