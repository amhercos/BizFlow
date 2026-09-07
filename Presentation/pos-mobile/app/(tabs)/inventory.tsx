import {
  Calendar,
  Edit3,
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useInventory } from "@/src/hooks/use-inventory";
import { cn } from "@/src/lib/utils";
import type { Category, Product } from "@/src/types/inventory";

import { ConfirmationModal } from "../../components/ConfirmationModal";
import { InventoryTable } from "../../components/inventory-table";
import { AddProductModal } from "../../components/inventory/add-product-modal";
import { CategoryManagerModal } from "../../components/inventory/category-manager-modal";
import { EditProductModal } from "../../components/inventory/edit-product-modal";

// Enums & Types
enum ViewMode {
  TABLE = "table",
  GRID = "grid",
}

type FilterType =
  | "all"
  | "low-stock"
  | "out-of-stock"
  | "expired"
  | "non-perishable"
  | "no-category";

interface FilterBarProps {
  activeFilter: FilterType | string;
  setActiveFilter: (filter: FilterType | string) => void;
  categories: Category[];
  categorySearch: string;
  setCategorySearch: (text: string) => void;
  loading?: boolean;
}

export default function InventoryScreen(): ReactElement {
  const { width } = useWindowDimensions();
  const {
    products = [],
    categories = [],
    loading,
    refresh,
    addProduct,
    deleteProduct,
    updateProduct,
    updateCategoryName,
    addCategory,
    deleteCategory,
  } = useInventory();

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TABLE);
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    cat: false,
    delete: false,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState<string>("");
  const [categorySearch, setCategorySearch] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<FilterType | string>("all");

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const toggleViewMode = useCallback(
    () =>
      setViewMode((prev) =>
        prev === ViewMode.TABLE ? ViewMode.GRID : ViewMode.TABLE,
      ),
    [],
  );

  const handleEditPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setModals((m) => ({ ...m, edit: true }));
  }, []);

  // Simplified: Accepts the whole product from the Table/Card swipe action
  const handleDeletePress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setModals((m) => ({ ...m, delete: true }));
  }, []);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.toLowerCase();
    return query
      ? categories.filter((c) => c.name.toLowerCase().includes(query))
      : categories;
  }, [categories, categorySearch]);

  const filteredProducts = useMemo(() => {
    const today = new Date();
    const query = search.toLowerCase();

    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        (p.description?.toLowerCase().includes(query) ?? false);
      if (!matchesSearch) return false;

      switch (activeFilter) {
        case "all":
          return true;
        case "low-stock":
          return p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0;
        case "out-of-stock":
          return p.stockQuantity === 0;
        case "expired":
          return p.expiryDate ? new Date(p.expiryDate) < today : false;
        case "no-category":
          return !p.categoryId;
        case "non-perishable":
          return !p.expiryDate;
        default:
          return p.categoryId === activeFilter;
      }
    });
  }, [products, search, activeFilter]);

  const gridItemWidth = (width - 48) / 2;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between border-b border-slate-50">
        <View>
          <Text className="text-2xl font-black text-slate-900 tracking-tighter">
            Inventory
          </Text>
          <View className="h-4 justify-center">
            {loading && products.length === 0 ? (
              <Skeleton colorMode="light" width={60} height={10} />
            ) : (
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {filteredProducts.length} Results
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={toggleViewMode}
            className="bg-slate-100 p-2.5 rounded-xl"
          >
            {viewMode === ViewMode.TABLE ? (
              <LayoutGrid size={18} color="#64748b" />
            ) : (
              <ListIcon size={18} color="#64748b" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModals((m) => ({ ...m, add: true }))}
            className="bg-slate-900 flex-row items-center px-4 h-11 rounded-xl shadow-sm"
          >
            <Plus size={16} color="white" />
            <Text className="text-white text-xs font-bold ml-2">Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor="#0f172a"
          />
        }
      >
        <View className="px-5 py-4 bg-slate-50/30">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="relative flex-1 justify-center">
              <View className="absolute left-3.5 z-10">
                <Search size={14} color="#94a3b8" />
              </View>
              <TextInput
                placeholder="Search inventory..."
                value={search}
                onChangeText={setSearch}
                className="bg-white border border-slate-200 h-11 pl-10 pr-4 rounded-2xl text-[13px] font-bold text-slate-900"
              />
            </View>
            <TouchableOpacity
              onPress={() => setModals((m) => ({ ...m, cat: true }))}
              className="bg-white border border-slate-200 h-11 w-11 items-center justify-center rounded-2xl shadow-sm"
            >
              <FolderPlus size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <FilterBar
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            categories={filteredCategories}
            categorySearch={categorySearch}
            setCategorySearch={setCategorySearch}
            loading={loading && categories.length === 0}
          />
        </View>

        <View className="px-5 pt-2 pb-20">
          {loading && products.length === 0 ? (
            <Skeleton.Group show={true}>
              {viewMode === ViewMode.TABLE ? (
                <View className="gap-y-4 mt-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton
                      key={i}
                      colorMode="light"
                      width="100%"
                      height={60}
                      radius={16}
                    />
                  ))}
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} className="mb-4">
                      <Skeleton
                        colorMode="light"
                        width={gridItemWidth}
                        height={200}
                        radius={32}
                      />
                    </View>
                  ))}
                </View>
              )}
            </Skeleton.Group>
          ) : viewMode === ViewMode.TABLE ? (
            <InventoryTable
              products={filteredProducts}
              loading={loading}
              onDelete={handleDeletePress} // Now receives product object directly
              onEdit={handleEditPress}
            />
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {filteredProducts.map((p) => (
                <InventoryGridCard
                  key={p.id}
                  product={p}
                  width={gridItemWidth}
                  onEdit={() => handleEditPress(p)}
                  onDelete={() => handleDeletePress(p)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <CategoryManagerModal
        isOpen={modals.cat}
        onClose={() => setModals((m) => ({ ...m, cat: false }))}
        categories={categories}
        onAdd={addCategory}
        onRename={updateCategoryName}
        onDelete={deleteCategory}
      />
      <AddProductModal
        isOpen={modals.add}
        onClose={() => setModals((m) => ({ ...m, add: false }))}
        categories={categories}
        onAdd={addProduct}
        onOpenCategoryManager={() => setModals((m) => ({ ...m, cat: true }))}
      />
      <EditProductModal
        isOpen={modals.edit}
        onClose={() => {
          setModals((m) => ({ ...m, edit: false }));
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        categories={categories}
        onUpdate={updateProduct}
        onOpenCategoryManager={() => setModals((m) => ({ ...m, cat: true }))}
      />

      {/* Single Global Confirmation Modal */}
      <ConfirmationModal
        visible={modals.delete}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => {
          setModals((m) => ({ ...m, delete: false }));
          setSelectedProduct(null);
        }}
        onConfirm={async () => {
          if (selectedProduct?.id) {
            await deleteProduct(selectedProduct.id);
            setModals((m) => ({ ...m, delete: false }));
            setSelectedProduct(null);
          }
        }}
      />
    </SafeAreaView>
  );
}

// ... FilterBar and InventoryGridCard remain unchanged ...
// (Kept for completeness if you need to copy-paste the whole file)

function FilterBar({
  activeFilter,
  setActiveFilter,
  categories,
  categorySearch,
  setCategorySearch,
  loading,
}: FilterBarProps): ReactElement {
  const staticFilters: FilterType[] = [
    "all",
    "low-stock",
    "expired",
    "out-of-stock",
    "no-category",
    "non-perishable",
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row items-center gap-2 pr-10">
        {staticFilters.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full border h-9",
              activeFilter === f
                ? "bg-slate-900 border-slate-900"
                : "bg-white border-slate-200",
            )}
          >
            <Text
              className={cn(
                "text-[10px] font-black uppercase",
                activeFilter === f ? "text-white" : "text-slate-500",
              )}
            >
              {f.replace("-", " ")}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="w-[1px] h-4 bg-slate-200 mx-1" />

        {loading ? (
          <View className="flex-row gap-2">
            <Skeleton colorMode="light" width={100} height={36} radius={20} />
            <Skeleton colorMode="light" width={100} height={36} radius={20} />
          </View>
        ) : (
          <>
            <View className="flex-row items-center bg-white border border-slate-200 rounded-full h-9 px-3 min-w-[120px]">
              <TextInput
                placeholder="Category..."
                value={categorySearch}
                onChangeText={setCategorySearch}
                className="flex-1 text-[10px] font-bold p-0"
              />
              {categorySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCategorySearch("")}>
                  <X size={12} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveFilter(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full border h-9 flex-row items-center gap-1.5",
                  activeFilter === cat.id
                    ? "bg-slate-900 border-slate-900"
                    : "bg-white border-slate-200",
                )}
              >
                <Tag
                  size={10}
                  color={activeFilter === cat.id ? "white" : "#94a3b8"}
                />
                <Text
                  className={cn(
                    "text-[10px] font-black uppercase",
                    activeFilter === cat.id ? "text-white" : "text-slate-500",
                  )}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

function InventoryGridCard({
  product,
  onEdit,
  onDelete,
  width,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  width: number;
}): ReactElement {
  const isExpired =
    product.expiryDate && new Date(product.expiryDate) < new Date();
  const isLowStock =
    product.stockQuantity <= product.lowStockThreshold &&
    product.stockQuantity > 0;
  const isOutOfStock = product.stockQuantity === 0;

  const formattedDate = useMemo(() => {
    if (!product.expiryDate) return "No Expiry";
    return new Date(product.expiryDate).toLocaleDateString("en-PH", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }, [product.expiryDate]);

  return (
    <View
      style={{ width }}
      className="bg-white border border-slate-100 rounded-[32px] p-5 mb-4 shadow-sm overflow-hidden"
    >
      <View className="flex-row justify-between items-center mb-3">
        <View>
          <Text className="text-xl font-black text-slate-900 tracking-tight">
            ₱{product.price.toLocaleString()}
            <Text className="text-[11px] font-bold text-slate-400"> /pc</Text>
          </Text>
          {product.packPrice != null &&
          product.packPrice > 0 &&
          product.piecesPerPack != null &&
          product.piecesPerPack > 1 ? (
            <Text className="text-[11px] font-bold text-slate-400 mt-0.5">
              ₱{product.packPrice.toLocaleString()}/{product.piecesPerPack}pk
            </Text>
          ) : null}
        </View>
        <View
          className={cn(
            "w-2.5 h-2.5 rounded-full",
            isOutOfStock
              ? "bg-rose-500"
              : isLowStock
                ? "bg-amber-500"
                : "bg-emerald-500",
          )}
        />
      </View>

      <Text
        className="text-lg font-extrabold text-slate-800 mb-1 leading-tight"
        numberOfLines={2}
      >
        {product.name}
      </Text>

      <View
        className={cn(
          "self-start px-2.5 py-1 rounded-lg mb-4 mt-1",
          isOutOfStock
            ? "bg-rose-50"
            : isLowStock
              ? "bg-amber-50"
              : "bg-slate-50",
        )}
      >
        <Text
          className={cn(
            "text-[10px] font-black uppercase tracking-wider",
            isOutOfStock
              ? "text-rose-600"
              : isLowStock
                ? "text-amber-600"
                : "text-slate-500",
          )}
        >
          {isOutOfStock ? "Out of Stock" : `${product.stockQuantity} in Stock`}
        </Text>
      </View>

      <View className="flex-row items-center mb-4 gap-1.5">
        <Calendar size={12} color={isExpired ? "#ef4444" : "#94a3b8"} />
        <Text
          className={cn(
            "text-[11px] font-bold",
            isExpired ? "text-rose-500" : "text-slate-400",
          )}
        >
          {formattedDate}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 pt-3 border-t border-slate-50">
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.8}
          className="flex-1 h-10 bg-slate-900 rounded-xl items-center justify-center flex-row"
        >
          <Edit3 size={14} color="white" />
          <Text className="text-white text-[11px] font-black ml-2 uppercase">
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.8}
          className="w-10 h-10 bg-rose-50 rounded-xl items-center justify-center"
        >
          <Trash2 size={14} color="#e11d48" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
