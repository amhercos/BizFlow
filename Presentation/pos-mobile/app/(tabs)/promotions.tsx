import { DrawerMenuButton } from "@/components/navigation/DrawerMenuButton";
import { typeface, useInter } from "@/src/theme/typography";
import * as Haptics from "expo-haptics";
import { Plus, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import CreatePromotionModal from "../../components/promotions/CreatePromotionModal";
import EditPromotionModal from "../../components/promotions/EditPromotionModal";
import EmptyPromotions from "../../components/promotions/EmptyPromotions";
import PromotionCard from "../../components/promotions/PromotionCard";
import PromotionCardSkeleton from "../../components/promotions/PromotionCardSkeleton";
import { usePromotions } from "../../src/hooks/use-promotions";
import { Promotion } from "../../src/types/promotion";

const INK = "#0F172A";
const MUTED = "#64748B";
const TINT = "#2563EB";

type PromotionListItem = Promotion | { isSkeleton: true; id: string };
type StrategyFilter = "All" | "Discount" | "Bulk" | "Bundle";
type StatusFilter = "all" | "live" | "paused";

interface BackendPromotionShape extends Promotion {
  promotionType?: string;
}

const STRATEGIES: StrategyFilter[] = ["All", "Discount", "Bulk", "Bundle"];

export default function PromotionsScreen() {
  const insets = useSafeAreaInsets();
  const font = useInter();
  const { promotions, isLoading, refresh, togglePromotion, removePromotion } =
    usePromotions();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStrategy, setSelectedStrategy] =
    useState<StrategyFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(
    null,
  );
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(
    null,
  );

  const liveCount = useMemo(
    () => (promotions ?? []).filter((p) => p.isActive).length,
    [promotions],
  );
  const pausedCount = useMemo(
    () => (promotions ?? []).filter((p) => !p.isActive).length,
    [promotions],
  );

  const filteredPromotions = useMemo((): Promotion[] => {
    const data = (promotions as BackendPromotionShape[]) ?? [];
    return data.filter((p) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        p.name?.toLowerCase().includes(query) ||
        p.productName?.toLowerCase().includes(query);

      const resolvedType = p.type || p.promotionType || "";
      const matchesStrategy =
        selectedStrategy === "All" ||
        String(resolvedType).toLowerCase() === selectedStrategy.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "live" && p.isActive) ||
        (statusFilter === "paused" && !p.isActive);

      return matchesSearch && matchesStrategy && matchesStatus;
    });
  }, [promotions, searchQuery, selectedStrategy, statusFilter]);

  const isInitialLoading =
    isLoading && (!promotions || promotions.length === 0);

  const listData = useMemo((): PromotionListItem[] => {
    if (isInitialLoading) {
      return Array.from({ length: 4 }).map((_, i) => ({
        isSkeleton: true,
        id: `skeleton-${i}`,
      }));
    }
    return filteredPromotions;
  }, [isInitialLoading, filteredPromotions]);

  const pickStrategy = (strategy: StrategyFilter) => {
    setSelectedStrategy(strategy);
    void Haptics.selectionAsync();
  };

  const pickStatus = (status: StatusFilter) => {
    setStatusFilter((current) => (current === status ? "all" : status));
    void Haptics.selectionAsync();
  };

  const handleDeleteConfirm = () => {
    if (promotionToDelete) {
      removePromotion(promotionToDelete);
      setPromotionToDelete(null);
    }
  };

  const renderItem: ListRenderItem<PromotionListItem> = ({ item }) => {
    if ("isSkeleton" in item) return <PromotionCardSkeleton />;

    return (
      <PromotionCard
        promotion={item}
        onToggle={(id) => togglePromotion(id)}
        onDelete={(id) => setPromotionToDelete(id)}
        onEdit={() => setEditingPromotion(item)}
      />
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <DrawerMenuButton />
        <View style={styles.identity}>
          <Text style={[styles.title, typeface(font.bold, "700")]}>Promos</Text>
          <Text style={[styles.subtitle, typeface(font.medium, "500")]}>
            {isInitialLoading
              ? "Loading deals"
              : `${filteredPromotions.length} deal${filteredPromotions.length === 1 ? "" : "s"}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsCreateModalOpen(true)}
          style={styles.headerAdd}
          accessibilityLabel="Add promotion"
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.2} />
          <Text style={[styles.headerAddText, typeface(font.semibold, "600")]}>
            Add
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <Pressable
          onPress={() => pickStatus("live")}
          style={[
            styles.stat,
            liveCount > 0 && styles.statLive,
            statusFilter === "live" && styles.statOn,
          ]}
        >
          <Text
            style={[
              styles.statLabel,
              statusFilter === "live" && styles.statLabelOn,
              typeface(font.medium, "500"),
            ]}
          >
            Live
          </Text>
          <Text
            style={[
              styles.statValue,
              { color: liveCount > 0 ? "#15803D" : INK },
              typeface(font.semibold, "600"),
            ]}
          >
            {isInitialLoading ? "—" : String(liveCount)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => pickStatus("paused")}
          style={[
            styles.stat,
            statusFilter === "paused" && styles.statOn,
          ]}
        >
          <Text
            style={[
              styles.statLabel,
              statusFilter === "paused" && styles.statLabelOn,
              typeface(font.medium, "500"),
            ]}
          >
            Paused
          </Text>
          <Text
            style={[styles.statValue, typeface(font.semibold, "600")]}
          >
            {isInitialLoading ? "—" : String(pausedCount)}
          </Text>
        </Pressable>
      </View>

      <View style={styles.search}>
        <Search size={16} color="#94A3B8" strokeWidth={2} />
        <TextInput
          placeholder="Search deals"
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.searchInput, typeface(font.medium, "500")]}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <X size={14} color="#94A3B8" />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.chipBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {STRATEGIES.map((item) => {
            const active = selectedStrategy === item;
            return (
              <Pressable
                key={item}
                onPress={() => pickStrategy(item)}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active && styles.chipTextOn,
                    typeface(font.medium, "500"),
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={listData}
        extraData={promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={!isLoading ? <EmptyPromotions /> : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && (promotions?.length ?? 0) > 0}
            onRefresh={refresh}
            tintColor={TINT}
          />
        }
      />

      <CreatePromotionModal
        isVisible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {editingPromotion ? (
        <EditPromotionModal
          isVisible={!!editingPromotion}
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
        />
      ) : null}

      <ConfirmationModal
        visible={!!promotionToDelete}
        title="Remove promotion"
        description="Delete this deal? Checkout will stop applying it."
        confirmLabel="Remove"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPromotionToDelete(null)}
        variant="danger"
      />
    </View>
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
    paddingHorizontal: 22,
    marginBottom: 16,
  },
  identity: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
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
    gap: 8,
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  stat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statLive: {
    backgroundColor: "#E7F8EE",
  },
  statOn: {
    backgroundColor: "#DCEBFF",
  },
  statValue: {
    fontSize: 14,
    letterSpacing: -0.2,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
  },
  statLabelOn: {
    color: INK,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF1F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    marginHorizontal: 22,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: INK,
    paddingVertical: 0,
  },
  chipBar: {
    height: 40,
    marginTop: 12,
    marginBottom: 8,
  },
  chipRow: {
    paddingHorizontal: 22,
    alignItems: "center",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#EEF1F6",
    justifyContent: "center",
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
  listContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 28,
  },
});
