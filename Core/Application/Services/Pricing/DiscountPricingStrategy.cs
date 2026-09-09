using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using System.Collections.Generic;
using System.Linq;

namespace Application.Services.Pricing
{
    public class DiscountPricingStrategy : IPricingStrategy
    {
        public PromotionType Type => PromotionType.Discount;

        public decimal CalculateLineTotal(Product product, Promotion promo, int quantity, IEnumerable<TransactionItem> basket)
        {
            decimal originalTotal = quantity * product.Price;

            if (!promo.IsActive || promo.Tiers == null || !promo.Tiers.Any())
            {
                return originalTotal;
            }

            var discountTier = promo.Tiers.OrderBy(t => t.Quantity).FirstOrDefault();
            if (discountTier == null)
            {
                return originalTotal;
            }

            int minQty = discountTier.Quantity > 0 ? discountTier.Quantity : 1;
            if (quantity < minQty)
            {
                return originalTotal;
            }

            return discountTier.Price * quantity;
        }
    }
}
