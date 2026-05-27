import type { PromotionTier } from "../types/promotion";
import { type BasketItem } from "../types/sale";

interface LineCalculation {
  discountedTotal: number;
  originalTotal: number;
  savings: number;
  appliedPromotionName: string | null;
}

export function calculateLineTotal(
  item: BasketItem,
  fullBasket: BasketItem[],
): LineCalculation {
  const originalTotal = item.unitPrice * item.quantity;

  // Return standard totals if no valid strategies are defined
  if (!item.promotions || item.promotions.length === 0) {
    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  // Locate the running active campaign
  const promo = item.promotions.find((p) => p.isActive === true);
  if (!promo || !promo.tiers || promo.tiers.length === 0) {
    return {
      discountedTotal: originalTotal,
      originalTotal,
      savings: 0,
      appliedPromotionName: null,
    };
  }

  const strategyType = String(promo.promotionType).toLowerCase();

  // FLAT DISCOUNT MARKDOWN
  if (strategyType === "discount") {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const discountTier: PromotionTier | undefined = sortedTiers[0];
    const targetUnitPrice = discountTier ? discountTier.price : item.unitPrice;

    const discountedTotal = item.quantity * targetUnitPrice;
    return {
      discountedTotal,
      originalTotal,
      savings: Math.max(0, originalTotal - discountedTotal),
      appliedPromotionName: promo.name,
    };
  }

  // COMBO BUNDLE
  if (strategyType === "bundle" && promo.tieUpProductId) {
    const sortedTiers = [...promo.tiers].sort(
      (a, b) => a.quantity - b.quantity,
    );
    const bundleTier = sortedTiers[0];

    const tieUpItem = fullBasket.find(
      (i) => i.productId === promo.tieUpProductId,
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

  // BULK PACK WHOLESALE
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
