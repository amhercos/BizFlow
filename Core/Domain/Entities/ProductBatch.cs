using Domain.Entities.Common;
using System;

namespace Domain.Entities;

public class ProductBatch : BaseEntity, ITenantEntity
{
    public Guid StoreId { get; set; }
    public Store Store { get; set; } = null!;
    
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public DateOnly ExpiryDate { get; set; }
}