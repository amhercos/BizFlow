using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Repositories
{
    public class ProductRepository(PosDbContext context) : IProductRepository
    {
        public async Task<(IEnumerable<Product> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken ct)
        {
            var query = context.Products
                .Include(p => p.Category)
                .Include(p => p.Promotions)
                    .ThenInclude(promo => promo.Tiers)
                .AsNoTracking()
                .Where(p => !p.IsDeleted);

            var totalCount = await query.CountAsync(ct);
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return (items, totalCount);
        }

        public async Task<IEnumerable<Product>> GetAllAsync(CancellationToken ct)
        {
            return await context.Products
                .Include(p => p.Category)
                .Include(p => p.Promotions)
                    .ThenInclude(promo => promo.Tiers)
                .Include(p => p.Batches)
                .AsNoTracking()
                .Where(p => !p.IsDeleted)
                .ToListAsync(ct);
        }

        public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct)
        {
            return await context.Products
                .Include(p => p.Category)
                .Include(p => p.Promotions)
                    .ThenInclude(promo => promo.Tiers)
                .Include(p => p.Batches)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
        }

        public void Add(Product product)
        {
            context.Products.Add(product);
        }

        public void Remove(Product product)
        {
            context.Products.Remove(product);
        }

        public void Update(Product product)
        {
            context.Products.Update(product);
        }

        public async Task<int> CountLowStockAsync(Guid storeId, CancellationToken ct)
        {
            return await context.Products
                .Where(p => p.StoreId == storeId && p.Stock <= p.LowStockThreshold && !p.IsDeleted)
                .CountAsync(ct);
        }

        public async Task<List<Product>> GetByIdsWithPromotionsAsync(IEnumerable<Guid> ids, Guid storeId, CancellationToken ct)
        {
            return await context.Products
                .Include(p => p.Promotions)
                    .ThenInclude(promo => promo.Tiers)
                .Where(p => ids.Contains(p.Id) && p.StoreId == storeId && !p.IsDeleted)
                .ToListAsync(ct);
        }

        public async Task<List<ProductBatch>> GetNearExpiryBatchesAsync(Guid storeId, int alertDays, CancellationToken ct)
        {
            var thresholdDate = DateOnly.FromDateTime(DateTime.Today.AddDays(alertDays));
            return await context.ProductBatches
                .Include(b => b.Product)
                .Where(b => b.StoreId == storeId && b.Quantity > 0 && b.ExpiryDate <= thresholdDate)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync(ct);
        }

        public async Task AddBatchAsync(ProductBatch batch, CancellationToken ct)
        {
            await context.ProductBatches.AddAsync(batch, ct);
        }
    }
}