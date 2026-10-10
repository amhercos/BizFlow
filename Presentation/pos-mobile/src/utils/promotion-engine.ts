import type { Promotion, PromotionTier } from "../types/promotion";
import type { AppliedPromotion, BasketItem } from "../types/sale";
import { UnitType } from "../types/sale";

interface LineCalculation {
  discountedTotal: number;
  originalTotal: number;
  savings: number;
  appliedPromotionName: string | null;
}

/**
 * Rounds numbers to 2 decimal places to prevent floating point inaccuracies.
 */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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

export function toAppliedPromotion(
  promo: Promotion | AppliedPromotion | any,
): AppliedPromotion {
  return {
    id: String(promo.id ?? ""),
    name: promo.name ?? "",
    isActive: isPromoActive(promo),
    promotionType: resolvePromoType(promo),
    mainProductId: promo.mainProductId ?? null,
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
        (promo.mainProductId === productId ||
          promo.tieUpProductId === productId) &&
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
  const originalTotal = round2(item.unitPrice * item.quantity);

  if (
    item.unitType === UnitType.Pack ||
    !item.promotions ||
    item.promotions.length === 0
  ) {
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

  // --- DISCOUNT STRATEGY ---
  if (strategyType === "discount") {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const discountTier = sortedTiers[0];
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
    const discountedTotal = round2(item.quantity * targetUnitPrice);
    const savings = round2(Math.max(0, originalTotal - discountedTotal));

    return {
      discountedTotal,
      originalTotal,
      savings,
      appliedPromotionName: promo.name,
    };
  }

  // --- BUNDLE STRATEGY ---
  if (
    strategyType === "bundle" &&
    (promo.tieUpProductId || promo.mainProductId)
  ) {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const bundleTier = sortedTiers[0];
    if (!bundleTier) {
      return {
        discountedTotal: originalTotal,
        originalTotal,
        savings: 0,
        appliedPromotionName: null,
      };
    }

    const mainProductId = promo.mainProductId;
    const tieUpProductId = promo.tieUpProductId;

    const isMainProduct = item.productId === mainProductId;
    const isTieUpProduct = item.productId === tieUpProductId;

    if (!isMainProduct && !isTieUpProduct) {
      return {
        discountedTotal: originalTotal,
        originalTotal,
        savings: 0,
        appliedPromotionName: null,
      };
    }

    const mainRequiredQty = bundleTier.quantity > 0 ? bundleTier.quantity : 1;
    const tieUpRequiredQty = promo.tieUpQuantity || 1;

    const mainItem = isMainProduct
      ? item
      : fullBasket.find((entry) => entry.productId === mainProductId);

    const tieUpItem = isTieUpProduct
      ? item
      : fullBasket.find((entry) => entry.productId === tieUpProductId);

    if (!mainItem || !tieUpItem) {
      return {
        discountedTotal: originalTotal,
        originalTotal,
        savings: 0,
        appliedPromotionName: null,
      };
    }

    const possibleBundlesByMain = Math.floor(
      mainItem.quantity / mainRequiredQty,
    );
    const possibleBundlesByTieUp = Math.floor(
      tieUpItem.quantity / tieUpRequiredQty,
    );
    const applicableBundleCount = Math.min(
      possibleBundlesByMain,
      possibleBundlesByTieUp,
    );

    if (applicableBundleCount > 0) {
      const standardMainBundleCost = round2(
        mainRequiredQty * mainItem.unitPrice,
      );
      const standardTieUpBundleCost = round2(
        tieUpRequiredQty * tieUpItem.unitPrice,
      );
      const totalStandardCostForCombo = round2(
        standardMainBundleCost + standardTieUpBundleCost,
      );

      if (totalStandardCostForCombo > bundleTier.price) {
        const totalDiscountPerBundle = round2(
          totalStandardCostForCombo - bundleTier.price,
        );

        // Proportional discount allocation for current item line
        const currentItemSetCost = isMainProduct
          ? standardMainBundleCost
          : standardTieUpBundleCost;
        const discountShareRatio =
          currentItemSetCost / totalStandardCostForCombo;
        const currentItemDiscountPerBundle =
          totalDiscountPerBundle * discountShareRatio;

        const totalLineSavings = round2(
          currentItemDiscountPerBundle * applicableBundleCount,
        );
        const discountedTotal = round2(
          Math.max(0, originalTotal - totalLineSavings),
        );

        return {
          discountedTotal,
          originalTotal,
          savings: totalLineSavings,
          appliedPromotionName: promo.name,
        };
      }
    }

    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  // --- BULK STRATEGY ---
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
    const discountedTotal = round2(total);
    const savings = round2(Math.max(0, originalTotal - discountedTotal));

    return {
      discountedTotal,
      originalTotal,
      savings,
      appliedPromotionName: discountedTotal < originalTotal ? promo.name : null,
    };
  }

  return {
    discountedTotal: originalTotal,
    originalTotal,
    savings: 0,
    appliedPromotionName: null,
  };
}
