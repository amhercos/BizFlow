using Domain.Entities;
using System;
using System.Collections.Generic;

namespace Application.Interfaces
{
    public interface IPromotionEngine
    {
        decimal CalculateLineTotal(Product product, int quantity, IEnumerable<TransactionItem> basket);

        // Pass store's active promotions list so tie-up products can be resolved
        decimal CalculateLineTotal(
            Product product,
            int quantity,
            IEnumerable<TransactionItem> basket,
            IEnumerable<Promotion> activePromotions);
    }
}