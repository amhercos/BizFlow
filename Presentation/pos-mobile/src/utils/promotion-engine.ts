import type { Promotion } from "../types/promotion";
import type { AppliedPromotion, BasketItem } from "../types/sale";
import { UnitType } from "../types/sale";
import type { PromotionTier } from "../types/promotion";

interface LineCalculation {
  discountedTotal: number;
  originalTotal: number;
  savings: number;
  appliedPromotionName: string | null;
}

function resolvePromoType(promo: {
  promotionType?: string | number;
  type?: string | number;
}): string {
  const raw = promo.promotionType ?? promo.type ?? "";
  if (raw === 1 || raw === "1") return "bulk";
  if (raw === 2 || raw === "2") return "bundle";
  if (raw === 3 || raw === "3") return "discount";
  return String(raw).toLowerCase();
}

function isPromoActive(promo: { isActive?: boolean }): boolean {
  return promo.isActive === true;
}

export function toAppliedPromotion(promo: Promotion | AppliedPromotion | any): AppliedPromotion {
  return {
    id: String(promo.id ?? ""),
    name: promo.name ?? "",
    isActive: isPromoActive(promo),
    promotionType: resolvePromoType(promo),
    tiers: (promo.tiers ?? []).map((tier: PromotionTier) => ({
      quantity: Number(tier.quantity) || 0,
      price: Number(tier.price) || 0,
    })),
    tieUpProductId: promo.tieUpProductId ?? null,
    tieUpProductName: promo.tieUpProductName ?? null,
    tieUpQuantity: promo.tieUpQuantity ?? 1,
  };
}

export function promotionsForProduct(
  productId: string,
  catalog: Promotion[],
): AppliedPromotion[] {
  return catalog
    .filter(
      (promo) =>
        promo.mainProductId === productId &&
        promo.isDeleted !== true &&
        isPromoActive(promo),
    )
    .map(toAppliedPromotion);
}

export function withLivePromotions(
  item: BasketItem,
  catalog: Promotion[],
): BasketItem {
  if (item.unitType === UnitType.Pack) {
    return { ...item, promotions: [] };
  }

  if (catalog.length === 0) {
    return {
      ...item,
      promotions: (item.promotions ?? []).map(toAppliedPromotion),
    };
  }

  return {
    ...item,
    promotions: promotionsForProduct(item.productId, catalog),
  };
}

export function calculateLineTotal(
  item: BasketItem,
  fullBasket: BasketItem[],
): LineCalculation {
  const originalTotal = item.unitPrice * item.quantity;

  if (item.unitType === UnitType.Pack) {
    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  if (!item.promotions || item.promotions.length === 0) {
    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  const promo = item.promotions.find((entry) => isPromoActive(entry));
  if (!promo || !promo.tiers || promo.tiers.length === 0) {
    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  const strategyType = resolvePromoType(promo);

  if (strategyType === "discount") {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const discountTier: PromotionTier | undefined = sortedTiers[0];
    const minQty = discountTier?.quantity || 1;

    if (item.quantity < minQty) {
      return {
        discountedTotal: originalTotal,
        originalTotal,
        savings: 0,
        appliedPromotionName: null,
      };
    }

    const targetUnitPrice = discountTier ? discountTier.price : item.unitPrice;
    const discountedTotal = item.quantity * targetUnitPrice;
    return {
      discountedTotal,
      originalTotal,
      savings: Math.max(0, originalTotal - discountedTotal),
      appliedPromotionName: promo.name,
    };
  }

  if (strategyType === "bundle" && promo.tieUpProductId) {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const bundleTier = sortedTiers[0];

    const tieUpItem = fullBasket.find(
      (entry) => entry.productId === promo.tieUpProductId,
    );
    const tieUpInCart = tieUpItem ? tieUpItem.quantity : 0;

    const mainRequiredQty = bundleTier ? bundleTier.quantity : 1;
    const tieUpRequiredQty = promo.tieUpQuantity || 1;

    const possibleBundlesByMain = Math.floor(item.quantity / mainRequiredQty);
    const possibleBundlesByTieUp = Math.floor(tieUpInCart / tieUpRequiredQty);
    const applicableBundleCount = Math.min(
      possibleBundlesByMain,
      possibleBundlesByTieUp,
    );

    if (applicableBundleCount > 0 && bundleTier) {
      const tieUpUnitPrice = tieUpItem ? tieUpItem.unitPrice : 0;

      const standardMainBundleCost = mainRequiredQty * item.unitPrice;
      const standardTieUpBundleCost = tieUpRequiredQty * tieUpUnitPrice;
      const totalStandardCostForCombo =
        standardMainBundleCost + standardTieUpBundleCost;

      const packageDealSavings = Math.max(
        0,
        totalStandardCostForCombo - bundleTier.price,
      );
      const totalSavingsForLine = packageDealSavings * applicableBundleCount;
      const discountedTotal = Math.max(0, originalTotal - totalSavingsForLine);

      return {
        discountedTotal,
        originalTotal,
        savings: totalSavingsForLine,
        appliedPromotionName: promo.name,
      };
    }

    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  if (strategyType === "bulk") {
    let total = 0;
    let remainingQuantity = item.quantity;

    const sortedTiers = [...promo.tiers].sort(
      (a, b) => b.quantity - a.quantity,
    );

    for (const tier of sortedTiers) {
      if (remainingQuantity >= tier.quantity) {
        const numberOfPacks = Math.floor(remainingQuantity / tier.quantity);
        total += numberOfPacks * tier.price;
        remainingQuantity %= tier.quantity;
      }
    }

    total += remainingQuantity * item.unitPrice;

    return {
      discountedTotal: total,
      originalTotal,
      savings: Math.max(0, originalTotal - total),
      appliedPromotionName: total < originalTotal ? promo.name : null,
    };
  }

  return {
    discountedTotal: originalTotal,
    originalTotal,
    savings: 0,
    appliedPromotionName: null,
  };
}
