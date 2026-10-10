using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class InventoryDeductionService(PosDbContext context) : IInventoryDeductionService
    {
        public async Task DeductStockFefoAsync(Guid productId, Guid storeId, int quantityToDeduct, CancellationToken ct)
        {
            if (quantityToDeduct <= 0) return;

            // Fetch active batches sorted by ExpiryDate ascending (FEFO)
            var batches = await context.ProductBatches
                .Where(b => b.ProductId == productId && b.StoreId == storeId && b.Quantity > 0 && !b.IsDeleted)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync(ct);

            int remainingToDeduct = quantityToDeduct;

            foreach (var batch in batches)
            {
                if (remainingToDeduct <= 0) break;

                if (batch.Quantity >= remainingToDeduct)
                {
                    batch.Quantity -= remainingToDeduct;
                    remainingToDeduct = 0;
                }
                else
                {
                    remainingToDeduct -= batch.Quantity;
                    batch.Quantity = 0;
                }

                context.ProductBatches.Update(batch);
            }

            // Also update aggregate product stock
            var product = await context.Products.FirstOrDefaultAsync(p => p.Id == productId && p.StoreId == storeId, ct);
            if (product != null)
            {
                product.Stock = Math.Max(0, product.Stock - quantityToDeduct);
                context.Products.Update(product);
            }

            await context.SaveChangesAsync(ct);
        }
    }
}