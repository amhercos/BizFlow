using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services.Pricing
{
    public class BundlePricingStrategy : IPricingStrategy
    {
        public PromotionType Type => PromotionType.Bundle;

        public decimal CalculateLineTotal(Product primaryProduct, Promotion promo, int primaryQuantity, IEnumerable<TransactionItem> basket)
        {
            decimal originalTotal = primaryQuantity * primaryProduct.Price;

            if (!promo.IsActive || promo.TieUpProductId == null || promo.Tiers == null || !promo.Tiers.Any())
            {
                return originalTotal;
            }

            var bundleTier = promo.Tiers.OrderBy(t => t.Quantity).FirstOrDefault();
            if (bundleTier == null) return originalTotal;

            // 1. Define required quantities (e.g., 2 Product A + 3 Product B)
            int primaryRequiredQty = bundleTier.Quantity > 0 ? bundleTier.Quantity : 1;
            int secondaryRequiredQty = promo.TieUpQuantity is > 0 ? promo.TieUpQuantity.Value : 1;
            decimal fixedBundlePrice = bundleTier.Price; // The complete bundle deal price

            // 2. Find secondary item in basket
            var secondaryItem = basket.FirstOrDefault(i => i.ProductId == promo.TieUpProductId);
            int secondaryInCart = secondaryItem?.Quantity ?? 0;
            decimal secondaryUnitPrice = secondaryItem?.UnitPrice ?? 0;

            // 3. Determine maximum complete bundle triggers
            int completeBundles = Math.Min(
                primaryQuantity / primaryRequiredQty,
                secondaryInCart / secondaryRequiredQty
            );

            if (completeBundles <= 0)
            {
                return originalTotal;
            }

            // 4. Calculate standard un-discounted cost of 1 bundle set
            decimal primarySetCost = primaryRequiredQty * primaryProduct.Price;
            decimal secondarySetCost = secondaryRequiredQty * secondaryUnitPrice;
            decimal standardBundleCost = primarySetCost + secondarySetCost;

            if (standardBundleCost <= fixedBundlePrice)
            {
                return originalTotal; // No discount if regular price is cheaper than bundle price
            }

            // 5. Total discount saved per bundle set
            decimal totalDiscountPerBundle = standardBundleCost - fixedBundlePrice;

            // 6. Calculate primary product's proportional share of the discount
            decimal primaryDiscountShareRatio = primarySetCost / standardBundleCost;
            decimal primaryDiscountPerBundle = totalDiscountPerBundle * primaryDiscountShareRatio;

            // 7. Apply discount for all completed bundle sets
            decimal totalPrimaryDiscount = primaryDiscountPerBundle * completeBundles;

            return Math.Max(0, originalTotal - totalPrimaryDiscount);
        }
    }
}