using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations
{
    public class TransactionItemConfiguration : IEntityTypeConfiguration<TransactionItem>
    {
        public void Configure(EntityTypeBuilder<TransactionItem> builder)
        {
            builder.HasKey(ti => ti.Id);

            builder.Property(ti => ti.Quantity)
                .IsRequired();

            builder.Property(ti => ti.UnitPrice)
                .HasPrecision(18, 2);

            // Unit of Measurement Configurations
            builder.Property(ti => ti.UnitType)
                .IsRequired()
                .HasMaxLength(20)
                .HasDefaultValue("Piece");

            builder.Property(ti => ti.ConversionRatio)
                .IsRequired()
                .HasDefaultValue(1);

            builder.HasOne(ti => ti.Transaction)
                .WithMany(t => t.Items)
                .HasForeignKey(ti => ti.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ti => ti.Product)
                .WithMany()
                .HasForeignKey(ti => ti.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(ti => ti.Store)
                .WithMany()
                .HasForeignKey(ti => ti.StoreId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}