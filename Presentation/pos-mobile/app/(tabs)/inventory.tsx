import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { useInventory } from "@/src/hooks/use-inventory";
import { formatPHP } from "@/src/lib/math";
import { typeface, useInter } from "@/src/theme/typography";
import type { Category, Product } from "@/src/types/inventory";
import * as Haptics from "expo-haptics";
import {
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  X,
} from "lucide-react-native";
import { Skeleton } from "moti/skeleton";
import React, { ReactElement, useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmationModal } from "../../components/ConfirmationModal";
import { InventoryTable } from "../../components/inventory-table";
import { AddProductModal } from "../../components/inventory/add-product-modal";
import { CategoryManagerModal } from "../../components/inventory/category-manager-modal";
import { EditProductModal } from "../../components/inventory/edit-product-modal";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

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

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low-stock", label: "Low stock" },
  { id: "out-of-stock", label: "Out" },
  { id: "expired", label: "Expired" },
  { id: "no-category", label: "Uncategorized" },
  { id: "non-perishable", label: "No expiry" },
];

function isExpired(product: Product) {
  return !!product.expiryDate && new Date(product.expiryDate) < new Date();
}

function stockTone(product: Product) {
  if (product.stockQuantity === 0) return "#E11D48";
  if (product.stockQuantity <= product.lowStockThreshold) return "#D97706";
  return "#15803D";
}

function stockCopy(product: Product) {
  if (product.stockQuantity === 0) return "Out of stock";
  return `${product.stockQuantity} in stock`;
}

function expiryCopy(product: Product) {
  if (!product.expiryDate) return "No expiry";
  return new Date(product.expiryDate).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function packCopy(product: Product) {
  if (
    product.packPrice != null &&
    product.packPrice > 0 &&
    product.piecesPerPack != null &&
    product.piecesPerPack > 1
  ) {
    return `${formatPHP(product.packPrice)} · ${product.piecesPerPack} pcs`;
  }
  return "None";
}

function statusCopy(product: Product) {
  if (product.stockQuantity === 0) return "Out";
  if (isExpired(product)) return "Expired";
  if (product.stockQuantity <= product.lowStockThreshold) return "Low";
  return null;
}

export default function InventoryScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const font = useInter();
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
  const [search, setSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType | string>("all");

  const handleEditPress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setModals((m) => ({ ...m, edit: true }));
  }, []);

  const handleDeletePress = useCallback((product: Product) => {
    setSelectedProduct(product);
    setModals((m) => ({ ...m, delete: true }));
  }, []);

  const setFilter = useCallback((filter: FilterType | string) => {
    setActiveFilter(filter);
    void Haptics.selectionAsync();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.toLowerCase();
    return query
      ? categories.filter((c) => c.name.toLowerCase().includes(query))
      : categories;
  }, [categories, categorySearch]);

  const stats = useMemo(() => {
    const today = new Date();
    let low = 0;
    let out = 0;
    let expired = 0;
    for (const product of products) {
      if (product.stockQuantity === 0) out += 1;
      else if (product.stockQuantity <= product.lowStockThreshold) low += 1;
      if (product.expiryDate && new Date(product.expiryDate) < today) {
        expired += 1;
      }
    }
    return { low, out, expired };
  }, [products]);

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

  const gridItemWidth = (width - 56) / 2;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingHorizontal: 22,
          paddingBottom: 36,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={TINT}
          />
        }
      >
        <View style={styles.header}>
          <DrawerMenuButton />
          <View style={styles.identity}>
            <Text style={[styles.title, typeface(font.bold, "700")]}>
              Inventory
            </Text>
            <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
              {loading && products.length === 0
                ? "Loading stock"
                : `${filteredProducts.length} item${filteredProducts.length === 1 ? "" : "s"}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setModals((m) => ({ ...m, cat: true }))}
            style={styles.headerGhost}
            accessibilityLabel="Manage categories"
          >
            <FolderPlus size={14} color={INK} strokeWidth={1.8} />
            <Text
              style={[styles.headerGhostText, typeface(font.medium, "500")]}
            >
              Category
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setModals((m) => ({ ...m, add: true }))}
            style={styles.headerAdd}
            accessibilityLabel="Add product"
          >
            <Plus size={14} color="#FFFFFF" strokeWidth={2.2} />
            <Text
              style={[styles.headerAddText, typeface(font.semibold, "600")]}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          {(
            [
              {
                id: "low-stock" as const,
                label: "Low",
                value: stats.low,
                hot: "#B45309",
                wash: "#FDE6D4",
              },
              {
                id: "out-of-stock" as const,
                label: "Out",
                value: stats.out,
                hot: "#BE123C",
                wash: "#FDECEC",
              },
              {
                id: "expired" as const,
                label: "Expired",
                value: stats.expired,
                hot: "#BE123C",
                wash: "#FDECEC",
              },
            ] as const
          ).map((item) => {
            const active = activeFilter === item.id;
            const display =
              loading && products.length === 0 ? "—" : String(item.value);
            const hot = item.value > 0;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(active ? "all" : item.id)}
                style={[
                  styles.stat,
                  hot && { backgroundColor: item.wash },
                  active && styles.statOn,
                ]}
              >
                <Text
                  style={[
                    styles.statLabel,
                    active && styles.statLabelOn,
                    typeface(font.medium, "500"),
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.statValue,
                    { color: hot ? item.hot : INK },
                    typeface(font.semibold, "600"),
                  ]}
                >
                  {display}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.search}>
          <Search size={16} color="#94A3B8" strokeWidth={2} />
          <TextInput
            placeholder="Search products"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.searchInput, typeface(font.medium, "500")]}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <X size={14} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        <FilterBar
          activeFilter={activeFilter}
          setActiveFilter={setFilter}
          categories={filteredCategories}
          categorySearch={categorySearch}
          setCategorySearch={setCategorySearch}
          loading={loading && categories.length === 0}
          fontFamily={font.medium}
        />

        <View style={styles.listHead}>
          <Text style={[styles.listTitle, typeface(font.bold, "700")]}>
            Products
          </Text>
          <View style={styles.metricToggle}>
            <Pressable
              onPress={() => setViewMode(ViewMode.TABLE)}
              style={[
                styles.metricChip,
                viewMode === ViewMode.TABLE && styles.metricChipOn,
              ]}
            >
              <ListIcon
                size={14}
                color={viewMode === ViewMode.TABLE ? INK : MUTED}
              />
            </Pressable>
            <Pressable
              onPress={() => setViewMode(ViewMode.GRID)}
              style={[
                styles.metricChip,
                viewMode === ViewMode.GRID && styles.metricChipOn,
              ]}
            >
              <LayoutGrid
                size={14}
                color={viewMode === ViewMode.GRID ? INK : MUTED}
              />
            </Pressable>
          </View>
        </View>

        {loading && products.length === 0 ? (
          <View style={{ marginTop: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <View key={i} style={{ paddingVertical: 12 }}>
                <Skeleton
                  colorMode="light"
                  width="100%"
                  height={18}
                  radius={6}
                />
              </View>
            ))}
          </View>
        ) : filteredProducts.length === 0 ? (
          <Text style={[styles.empty, typeface(font.regular, "400")]}>
            No products match this filter
          </Text>
        ) : viewMode === ViewMode.TABLE ? (
          <InventoryTable
            products={filteredProducts}
            onDelete={handleDeletePress}
            onEdit={handleEditPress}
            font={font}
          />
        ) : (
          <View style={styles.grid}>
            {filteredProducts.map((product) => (
              <InventoryGridCard
                key={product.id}
                product={product}
                width={gridItemWidth}
                fontFamily={font.semibold}
                metaFamily={font.medium}
                onEdit={() => handleEditPress(product)}
                onDelete={() => handleDeletePress(product)}
              />
            ))}
          </View>
        )}
      </ScrollView>

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
    </View>
  );
}

function FilterBar({
  activeFilter,
  setActiveFilter,
  categories,
  categorySearch,
  setCategorySearch,
  loading,
  fontFamily,
}: {
  activeFilter: FilterType | string;
  setActiveFilter: (filter: FilterType | string) => void;
  categories: Category[];
  categorySearch: string;
  setCategorySearch: (text: string) => void;
  loading?: boolean;
  fontFamily?: string;
}): ReactElement {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterRow}
    >
      {FILTERS.map((filter) => {
        const active = activeFilter === filter.id;
        return (
          <Pressable
            key={filter.id}
            onPress={() => setActiveFilter(filter.id)}
            style={[styles.chip, active && styles.chipOn]}
          >
            <Text
              style={[
                styles.chipText,
                active && styles.chipTextOn,
                fontFamily ? { fontFamily } : { fontWeight: "500" },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}

      <View style={styles.filterRule} />

      {loading ? (
        <>
          <Skeleton colorMode="light" width={88} height={30} radius={999} />
          <Skeleton colorMode="light" width={88} height={30} radius={999} />
        </>
      ) : (
        <>
          <View style={styles.catSearch}>
            <TextInput
              placeholder="Category"
              placeholderTextColor="#94A3B8"
              value={categorySearch}
              onChangeText={setCategorySearch}
              style={[
                styles.catInput,
                fontFamily ? { fontFamily } : { fontWeight: "500" },
              ]}
            />
            {categorySearch.length > 0 ? (
              <Pressable onPress={() => setCategorySearch("")} hitSlop={6}>
                <X size={12} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
          {categories.map((cat) => {
            const active = activeFilter === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveFilter(cat.id)}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextOn,
                    fontFamily ? { fontFamily } : { fontWeight: "500" },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function InventoryGridCard({
  product,
  onEdit,
  onDelete,
  width,
  fontFamily,
  metaFamily,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  width: number;
  fontFamily?: string;
  metaFamily?: string;
}): ReactElement {
  const status = statusCopy(product);
  const expired = isExpired(product);
  const hasPack = packCopy(product) !== "None";
  const details = [
    { label: "Stock", value: stockCopy(product), color: stockTone(product) },
    {
      label: "Category",
      value: product.categoryName ?? "Uncategorized",
      color: INK,
    },
    {
      label: "Pack",
      value: packCopy(product),
      color: hasPack ? TINT : MUTED,
    },
    {
      label: "Expiry",
      value: expiryCopy(product),
      color: expired ? "#E11D48" : product.expiryDate ? INK : MUTED,
    },
  ];

  return (
    <Pressable
      onPress={onEdit}
      onLongPress={onDelete}
      style={[styles.gridCard, { width }]}
    >
      <View style={styles.gridHead}>
        <Text
          style={[
            styles.gridName,
            fontFamily ? { fontFamily } : { fontWeight: "600" },
          ]}
          numberOfLines={2}
        >
          {product.name}
        </Text>
        {status ? (
          <View
            style={[
              styles.statusPill,
              status === "Low" ? styles.statusPillAmber : styles.statusPillRose,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                { color: status === "Low" ? "#B45309" : "#BE123C" },
                metaFamily ? { fontFamily } : { fontWeight: "500" },
              ]}
            >
              {status}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          styles.gridKicker,
          metaFamily ? { fontFamily } : { fontWeight: "500" },
        ]}
      >
        Piece price
      </Text>
      <Text
        style={[
          styles.gridPrice,
          fontFamily ? { fontFamily } : { fontWeight: "600" },
        ]}
      >
        {formatPHP(product.price)}
      </Text>

      <View style={styles.gridRule} />

      {details.map((row) => (
        <View key={row.label} style={styles.detail}>
          <Text
            style={[
              styles.detailLabel,
              metaFamily ? { fontFamily } : { fontWeight: "500" },
            ]}
          >
            {row.label}
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: row.color ?? INK },
              fontFamily ? { fontFamily } : { fontWeight: "600" },
            ]}
            numberOfLines={1}
          >
            {row.value}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAFBFD",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  identity: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    color: INK,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: MUTED,
  },
  headerGhost: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#EEF1F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 8,
  },
  headerGhostText: {
    fontSize: 12,
    color: INK,
  },
  headerAdd: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: TINT,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerAddText: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  stat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  statOn: {
    backgroundColor: "#DCEBFF",
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
  },
  statLabelOn: {
    color: INK,
  },
  statValue: {
    fontSize: 14,
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: INK,
    paddingVertical: 0,
  },
  filterScroll: {
    marginTop: 16,
    marginHorizontal: -22,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EEF1F6",
  },
  chipOn: {
    backgroundColor: TINT,
  },
  chipText: {
    fontSize: 13,
    color: INK,
  },
  chipTextOn: {
    color: "#FFFFFF",
  },
  filterRule: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: "rgba(15, 23, 42, 0.16)",
    marginHorizontal: 4,
  },
  catSearch: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 32,
    minWidth: 108,
  },
  catInput: {
    flex: 1,
    fontSize: 13,
    color: INK,
    paddingVertical: 0,
    minWidth: 72,
  },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 13,
    color: INK,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricToggle: {
    flexDirection: "row",
    backgroundColor: "#EEF1F6",
    borderRadius: 999,
    padding: 3,
  },
  metricChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metricChipOn: {
    backgroundColor: "#FFFFFF",
  },
  empty: {
    paddingVertical: 20,
    fontSize: 14,
    color: MUTED,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    backgroundColor: "#F4F6FA",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 12,
  },
  gridHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  gridName: {
    flex: 1,
    fontSize: 14,
    color: INK,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 1,
  },
  statusPillAmber: {
    backgroundColor: "#FDE6D4",
  },
  statusPillRose: {
    backgroundColor: "#FDECEC",
  },
  statusPillText: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  gridKicker: {
    marginTop: 10,
    fontSize: 11,
    color: MUTED,
  },
  gridPrice: {
    marginTop: 1,
    fontSize: 16,
    color: TINT,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  gridRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(15, 23, 42, 0.08)",
    marginTop: 10,
    marginBottom: 4,
  },
  detail: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: MUTED,
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
