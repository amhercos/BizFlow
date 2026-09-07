using Domain.Entities.Common;
using System.ComponentModel.DataAnnotations;

namespace Domain.Entities
{
    public class Product : BaseEntity, ITenantEntity
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public Guid? CategoryId { get; set; }
        public Category Category { get; set; } = null!;
        public Guid StoreId { get; set; }
        public Store Store { get; set; } = null!;

        // Piece Pricing & Stock (Base Unit)
        public decimal Price { get; set; } // Piece Price
        public int Stock { get; set; } // Total Pieces available

        // Pack Unit Configuration (Optional)
        public decimal? PackPrice { get; set; }
        public int? PiecesPerPack { get; set; }

        public int LowStockThreshold { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsDeleted { get; set; } = false;

        public ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
    }
}