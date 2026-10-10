using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TransactionRepository(PosDbContext context, ICurrentUserService currentUserService) : ITransactionRepository
{
    public DateTime GetPhStartOfTodayUtc()
    {
        var phNow = DateTime.UtcNow.AddHours(8);
        var phTodayStart = new DateTime(phNow.Year, phNow.Month, phNow.Day, 0, 0, 0);
        return DateTime.SpecifyKind(phTodayStart.AddHours(-8), DateTimeKind.Utc);
    }

    public void Add(Transaction transaction) => context.Transactions.Add(transaction);

    public async Task<Transaction?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        return await context.Transactions
         .IgnoreQueryFilters()
         .AsNoTracking()
         .Include(t => t.Items)
             .ThenInclude(ti => ti.Product)
         .FirstOrDefaultAsync(t => t.Id == id && t.StoreId == currentUserService.StoreId, ct);
    }
    public async Task<IEnumerable<Transaction>> GetAllAsync(CancellationToken ct)
    {
        return await context.Transactions
            .Include(t => t.Items)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync(ct);
    }

    public async Task<decimal> GetTotalRevenueAsync(Guid storeId, DateTime startUtc, CancellationToken ct)
    {
        return await context.Transactions
            .AsNoTracking()
            .Where(t => t.StoreId == storeId && t.TransactionDate >= startUtc)
            .SumAsync(t => (decimal?)t.TotalAmount, ct) ?? 0;
    }

    public async Task<int> GetTotalTransactionsAsync(Guid storeId, DateTime startUtc, CancellationToken ct)
    {
        return await context.Transactions
            .AsNoTracking()
            .CountAsync(t => t.StoreId == storeId && t.TransactionDate >= startUtc && t.TotalAmount > 0, ct);
    }

    public async Task<(List<Transaction> Items, int TotalCount)> GetRecentTransactionsAsync(
     Guid storeId,
     int page,
     int pageSize,
     DateTime? startUtc,
     CancellationToken ct)
    {
        var query = context.Transactions
        .AsNoTracking()
        .Where(t => t.StoreId == storeId);

        if (startUtc.HasValue)
        {
            query = query.Where(t => t.TransactionDate >= startUtc.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Include(t => t.Items)
            .OrderByDescending(t => t.TransactionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<List<Transaction>> GetByCustomerIdAsync(Guid customerCreditId, CancellationToken ct)
    {
        return await context.Transactions
            .AsNoTracking()
            .IgnoreQueryFilters()
            .Include(t => t.Items)
                .ThenInclude(i => i.Product)
            .Where(t => t.CustomerCreditId == customerCreditId)
            .OrderByDescending(t => t.TransactionDate)
            .ToListAsync(ct);
    }
}