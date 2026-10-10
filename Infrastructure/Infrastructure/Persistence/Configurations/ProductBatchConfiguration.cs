using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ProductBatchConfiguration : IEntityTypeConfiguration<ProductBatch>
{
    public void Configure(EntityTypeBuilder<ProductBatch> builder)
    {
        builder.HasKey(e => e.Id);
        builder.HasQueryFilter(e => !e.IsDeleted);

        builder.HasOne(e => e.Product)
              .WithMany(p => p.Batches)
              .HasForeignKey(e => e.ProductId)
              .OnDelete(DeleteBehavior.Cascade);
    }
}