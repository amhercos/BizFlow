using Application.Features.Transactions.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.Transactions.Handlers;

public class CreateTransactionHandler(
    ITransactionRepository transactionRepository,
    IProductRepository productRepository,
    ICustomerCreditRepository creditRepository,
    IPromotionEngine promotionEngine,
    IPosDbContext context,
    ICurrentUserService currentUserService) : IRequestHandler<CreateTransactionCommand, Guid>
{
    public async Task<Guid> Handle(CreateTransactionCommand request, CancellationToken ct)
    {
        var storeId = currentUserService.StoreId;
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();

        var products = await productRepository.GetByIdsWithPromotionsAsync(productIds, storeId, ct);
        var productMap = products.ToDictionary(p => p.Id);

        var activePromotions = await context.Promotions
            .Include(p => p.Tiers)
            .Where(p => p.StoreId == storeId && p.IsActive && !p.IsDeleted)
            .ToListAsync(ct);

        using var dbTransaction = await context.Database.BeginTransactionAsync(ct);
        try
        {
            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                UserId = currentUserService.UserId ?? Guid.Empty,
                TransactionDate = DateTime.UtcNow,
                PaymentType = request.PaymentType,
                CashReceived = Math.Round(request.CashReceived, 2, MidpointRounding.AwayFromZero),
                Items = new List<TransactionItem>()
            };

            foreach (var itemReq in request.Items)
            {
                if (itemReq.Quantity <= 0)
                    throw new Exception($"Invalid quantity for product: {itemReq.ProductId}");

                if (!productMap.TryGetValue(itemReq.ProductId, out var product))
                    throw new Exception($"Product not found: {itemReq.ProductId}");

                var isPack = itemReq.IsPack;
                var ratio = isPack ? (product.PiecesPerPack ?? 1) : 1;
                var basePiecesDeducted = itemReq.Quantity * ratio;

                // --- FEFO BATCH STOCK DEDUCTION (free items are deducted exactly like sold items) ---
                var activeBatches = await context.ProductBatches
                    .Where(b => b.ProductId == product.Id && b.Quantity > 0 && !b.IsDeleted)
                    .OrderBy(b => b.ExpiryDate)
                    .ToListAsync(ct);

                int totalAvailableBatchStock = activeBatches.Sum(b => b.Quantity);
                int effectiveAvailableStock = Math.Max(totalAvailableBatchStock, product.Stock);

                if (effectiveAvailableStock < basePiecesDeducted)
                {
                    throw new Exception($"Insufficient stock for: {product.Name}. Required: {basePiecesDeducted} pcs, Available: {effectiveAvailableStock} pcs");
                }

                int remainingToDeduct = basePiecesDeducted;
                foreach (var batch in activeBatches)
                {
                    if (remainingToDeduct <= 0) break;

                    int deductFromBatch = Math.Min(batch.Quantity, remainingToDeduct);
                    batch.Quantity -= deductFromBatch;
                    remainingToDeduct -= deductFromBatch;

                    context.ProductBatches.Update(batch);
                }

                product.Stock = Math.Max(0, product.Stock - basePiecesDeducted);
                // ----------------------------------

                transaction.Items.Add(new TransactionItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Quantity = itemReq.Quantity,
                    UnitType = isPack ? "Pack" : "Piece",
                    ConversionRatio = ratio,
                    IsFree = itemReq.IsFree,
                    UnitPrice = itemReq.IsFree ? 0m : (isPack ? (product.PackPrice ?? product.Price) : product.Price),
                    StoreId = storeId
                });
            }

            // Promotions only consider PAID lines (free items never take part in a promo).
            var paidItems = transaction.Items.Where(i => !i.IsFree).ToList();

            var discountedLineTotals = new Dictionary<Guid, decimal>();
            if (request.PaymentType != PaymentType.Credit)
            {
                foreach (var item in paidItems.Where(i => i.UnitType == "Piece"))
                {
                    var product = productMap[item.ProductId];
                    discountedLineTotals[item.Id] = promotionEngine.CalculateLineTotal(
                        product,
                        item.Quantity,
                        paidItems,
                        activePromotions);
                }
            }

            // Exact line totals: the transaction total is the sum of these, so a bundle always costs
            // exactly its configured price (no re-rounding of per-unit prices).
            foreach (var item in transaction.Items)
            {
                if (item.IsFree)
                {
                    item.UnitPrice = 0m;
                    item.LineTotal = 0m;
                    continue;
                }

                if (item.Quantity > 0 && discountedLineTotals.TryGetValue(item.Id, out var promoLineTotal))
                {
                    item.LineTotal = Math.Round(promoLineTotal, 2, MidpointRounding.AwayFromZero);
                    item.UnitPrice = Math.Round(item.LineTotal / item.Quantity, 2, MidpointRounding.AwayFromZero);
                }
                else
                {
                    item.LineTotal = Math.Round(item.Quantity * item.UnitPrice, 2, MidpointRounding.AwayFromZero);
                }
            }

            transaction.TotalAmount = Math.Round(
                transaction.Items.Where(i => !i.IsFree).Sum(i => i.LineTotal),
                2,
                MidpointRounding.AwayFromZero);

            if (transaction.PaymentType == PaymentType.Credit)
            {
                var account = await ResolveCreditAccount(request, storeId, ct);
                transaction.CustomerCreditId = account.Id;

                account.CreditAmount += transaction.TotalAmount;
                account.Status = CreditStatus.Active;

                creditRepository.Update(account);
            }
            else
            {
                if (transaction.CashReceived < transaction.TotalAmount)
                    throw new Exception($"Insufficient cash. Required: ₱{transaction.TotalAmount:N2}, Received: ₱{transaction.CashReceived:N2}");

                transaction.ChangeAmount = transaction.CashReceived - transaction.TotalAmount;
            }

            transactionRepository.Add(transaction);

            await context.SaveChangesAsync(ct);
            await dbTransaction.CommitAsync(ct);

            return transaction.Id;
        }
        catch (DbUpdateConcurrencyException)
        {
            await dbTransaction.RollbackAsync(ct);
            throw new Exception("Stock was updated by another user. Please refresh and try again.");
        }
        catch (Exception)
        {
            await dbTransaction.RollbackAsync(ct);
            throw;
        }
    }

    private async Task<CustomerCredit> ResolveCreditAccount(CreateTransactionCommand request, Guid storeId, CancellationToken ct)
    {
        if (request.CustomerCreditId.HasValue && request.CustomerCreditId.Value != Guid.Empty)
        {
            return await creditRepository.GetByIdAsync(request.CustomerCreditId.Value, ct)
                   ?? throw new Exception("Customer credit account not found.");
        }

        if (string.IsNullOrWhiteSpace(request.NewCustomerName))
        {
            throw new Exception("Customer name is required for new credit accounts.");
        }

        var newAccount = new CustomerCredit
        {
            Id = Guid.NewGuid(),
            CustomerName = request.NewCustomerName,
            ContactInfo = request.NewCustomerContact ?? "",
            CreditAmount = 0,
            Status = CreditStatus.Active,
            StoreId = storeId
        };

        creditRepository.Add(newAccount);
        await context.SaveChangesAsync(ct);

        return newAccount;
    }
}