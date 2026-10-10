using Application.Interfaces;
using Domain.Entities;
using Domain.Entities.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using System.Linq.Expressions;

namespace Infrastructure.Persistence;

public abstract class PosDbContext : DbContext, IPosDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private IDbContextTransaction? _currentTransaction;

    protected PosDbContext(
        DbContextOptions options,
        ICurrentUserService currentUserService)
        : base(options)
    {
        _currentUserService = currentUserService;
    }
    public string? GetCurrentSchema()
    {
        return _currentUserService.SchemaName;
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductBatch> ProductBatches => Set<ProductBatch>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<TransactionItem> TransactionItems => Set<TransactionItem>();
    public DbSet<CustomerCredit> CustomerCredits => Set<CustomerCredit>();
    public DbSet<CreditPayment> CreditPayments => Set<CreditPayment>();
    public DbSet<StoreSettings> StoreSettings => Set<StoreSettings>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<PromotionTier> PromotionTiers => Set<PromotionTier>();

    public async Task BeginTransactionAsync(CancellationToken ct)
        => _currentTransaction = await Database.BeginTransactionAsync(ct);

    public async Task CommitTransactionAsync(CancellationToken ct)
    {
        try
        {
            await SaveChangesAsync(ct);
            if (_currentTransaction != null) await _currentTransaction.CommitAsync(ct);
        }
        finally
        {
            _currentTransaction?.Dispose();
            _currentTransaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken ct)
    {
        if (_currentTransaction != null)
        {
            await _currentTransaction.RollbackAsync(ct);
            _currentTransaction.Dispose();
            _currentTransaction = null;
        }
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {

        var schema = GetCurrentSchema();
        if (!string.IsNullOrWhiteSpace(schema))
        {
            builder.HasDefaultSchema(schema);
        }

        builder.ApplyConfigurationsFromAssembly(typeof(PosDbContext).Assembly);

        builder.Ignore<Store>();

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType).HasQueryFilter(CreateTenantFilter(entityType.ClrType));
                builder.Entity(entityType.ClrType).Ignore("Store");
            }
        }

        // decimal precision
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(2);
        }

        //global datetime converter
        var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc)
        );

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
            }
        }
    }
    private LambdaExpression CreateTenantFilter(Type type)
    {
        var parameter = Expression.Parameter(type, "e");

        var storeIdProperty = Expression.Property(parameter, nameof(ITenantEntity.StoreId));
        var serviceConstant = Expression.Constant(_currentUserService);
        var serviceStoreIdProperty = Expression.Property(serviceConstant, nameof(ICurrentUserService.StoreId));
        var tenantExpression = Expression.Equal(storeIdProperty, serviceStoreIdProperty);

        Expression finalBody = tenantExpression;

        var isDeletedProp = type.GetProperty("IsDeleted");
        if (isDeletedProp != null)
        {
            var isDeletedExpression = Expression.Equal(
                Expression.Property(parameter, isDeletedProp),
                Expression.Constant(false)
            );
            finalBody = Expression.AndAlso(finalBody, isDeletedExpression);
        }


        return Expression.Lambda(finalBody, parameter);
    }
}