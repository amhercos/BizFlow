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

        public decimal CalculateLineTotal(Product product, Promotion promo, int quantity, IEnumerable<TransactionItem> basket)
        {
            decimal originalTotal = quantity * product.Price;

            if (!promo.IsActive || promo.TieUpProductId == null || promo.Tiers == null || !promo.Tiers.Any())
            {
                return originalTotal;
            }

            var bundleTier = promo.Tiers.OrderBy(t => t.Quantity).FirstOrDefault();
            if (bundleTier == null)
            {
                return originalTotal;
            }

            var tieUpItem = basket.FirstOrDefault(i => i.ProductId == promo.TieUpProductId);
            int tieUpInCart = tieUpItem?.Quantity ?? 0;

            int mainRequiredQty = bundleTier.Quantity > 0 ? bundleTier.Quantity : 1;
            int tieUpRequiredQty = promo.TieUpQuantity is > 0 ? promo.TieUpQuantity.Value : 1;

            int possibleBundlesByMain = quantity / mainRequiredQty;
            int possibleBundlesByTieUp = tieUpInCart / tieUpRequiredQty;
            int applicableBundleCount = Math.Min(possibleBundlesByMain, possibleBundlesByTieUp);

            if (applicableBundleCount <= 0)
            {
                return originalTotal;
            }

            decimal tieUpUnitPrice = tieUpItem?.UnitPrice ?? 0;
            decimal standardComboCost =
                (mainRequiredQty * product.Price) + (tieUpRequiredQty * tieUpUnitPrice);
            decimal packageDealSavings = Math.Max(0, standardComboCost - bundleTier.Price);
            decimal totalSavings = packageDealSavings * applicableBundleCount;

            return Math.Max(0, originalTotal - totalSavings);
        }
    }
}
