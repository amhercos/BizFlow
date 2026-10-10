using Domain.Entities.Common;
using System;

namespace Domain.Entities
{
    public class TransactionItem : BaseEntity, ITenantEntity
    {
        public Guid StoreId { get; set; }
        public Store Store { get; set; } = null!;
        public Guid TransactionId { get; set; }
        public Transaction Transaction { get; set; } = null!;
        public Guid ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public int Quantity { get; set; }
        public string UnitType { get; set; } = "Piece"; // "Piece" or "Pack"
        public int ConversionRatio { get; set; } = 1; // 1 for Piece, PiecesPerPack for Pack
        public decimal UnitPrice { get; set; }

        /// <summary>Given away for free: stock is deducted, but it is not part of the sale total.</summary>
        public bool IsFree { get; set; }

        /// <summary>Exact amount charged for this line (promo-aware, rounded to centavos).</summary>
        public decimal LineTotal { get; set; }

        public decimal TotalPrice => IsFree ? 0m : (LineTotal > 0 ? LineTotal : Quantity * UnitPrice);
    }
}