import { isAxiosError } from "axios";
import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { InventoryService } from "../services/inventoryService";
import type {
  Category,
  CreateProductRequest,
  Product,
  UpdateProductRequest,
} from "../types/inventory";

export function useInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 500;

  const handleError = useCallback((err: unknown, defaultMsg: string) => {
    let msg = defaultMsg;
    if (isAxiosError(err)) {
      msg = err.response?.data?.message || defaultMsg;
    } else if (err instanceof Error) {
      msg = err.message;
    }
    Toast.show({
      type: "error",
      text1: "Error",
      text2: msg,
    });
  }, []);

  /**
   * REFRESH: Resets to page 1 and fetches fresh data.
   * Restores all existing Inventory Screen logic.
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        InventoryService.getProducts(1, PAGE_SIZE),
        InventoryService.getCategories(),
      ]);
      setProducts(pRes.data.items);
      setCategories(cRes.data);
      setHasMore(pRes.data.items.length < pRes.data.totalCount);
      setPage(1);
    } catch (err) {
      handleError(err, "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * FETCH MORE: Specifically for Sales screen infinite scroll.
   * Appends items to the existing list instead of replacing them.
   */
  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;

    const nextPage = page + 1;
    try {
      const pRes = await InventoryService.getProducts(nextPage, PAGE_SIZE);
      const newItems = pRes.data.items;

      setProducts((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(products.length + newItems.length < pRes.data.totalCount);
    } catch (err) {
      handleError(err, "Failed to load more items");
    }
  }, [loading, hasMore, page, products.length, handleError]);

  // --- Product Actions (Restored for Inventory Screen) ---

  const addProduct = async (data: CreateProductRequest) => {
    try {
      await InventoryService.createProduct(data);
      Toast.show({ type: "success", text1: "Added", text2: "Product created" });
      refresh();
    } catch (err) {
      handleError(err, "Failed to add product");
    }
  };

  const updateProduct = async (id: string, data: UpdateProductRequest) => {
    try {
      await InventoryService.updateProduct(id, data);
      Toast.show({
        type: "success",
        text1: "Updated",
        text2: "Product updated",
      });
      refresh();
    } catch (err) {
      handleError(err, "Failed to update product");
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await InventoryService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      Toast.show({ type: "info", text1: "Deleted", text2: "Product removed" });
    } catch (err) {
      handleError(err, "Failed to delete product");
    }
  };

  const addCategory = async (name: string) => {
    try {
      await InventoryService.createCategory(name);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Category added",
      });
      refresh();
    } catch (err) {
      handleError(err, "Failed to add category");
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await InventoryService.deleteCategory(id);
      Toast.show({ type: "info", text1: "Deleted", text2: "Category removed" });
      refresh();
    } catch (err) {
      handleError(err, "Failed to delete category");
    }
  };

  const updateCategoryName = async (id: string, name: string) => {
    try {
      await InventoryService.updateCategoryName(id, name);
      refresh();
    } catch (err) {
      handleError(err, "Failed to update category");
    }
  };

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    products,
    categories,
    loading,
    hasMore,
    refresh,
    fetchMore,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    updateCategoryName,
  };
}
