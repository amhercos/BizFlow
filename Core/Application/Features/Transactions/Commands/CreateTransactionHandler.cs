using Application.Features.Transactions.Commands;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using Domain.Entities.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

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
                if (!productMap.TryGetValue(itemReq.ProductId, out var product))
                    throw new Exception($"Product not found: {itemReq.ProductId}");

                var isPack = itemReq.IsPack;
                var ratio = isPack ? (product.PiecesPerPack ?? 1) : 1;
                var basePiecesDeducted = itemReq.Quantity * ratio;

                if (product.Stock < basePiecesDeducted)
                    throw new Exception($"Insufficient stock for: {product.Name}. Required: {basePiecesDeducted} pcs, Available: {product.Stock} pcs");

                product.Stock -= basePiecesDeducted;

                transaction.Items.Add(new TransactionItem
                {
                    Id = Guid.NewGuid(),
                    ProductId = product.Id,
                    Quantity = itemReq.Quantity,
                    UnitType = isPack ? "Pack" : "Piece",
                    ConversionRatio = ratio,
                    UnitPrice = isPack ? (product.PackPrice ?? product.Price) : product.Price,
                    StoreId = storeId
                });
            }

            // Price every line against the original retail basket so bundle tie-up
            // math is not affected by another line's already-discounted unit price.
            var discountedLineTotals = new Dictionary<Guid, decimal>();
            foreach (var item in transaction.Items)
            {
                var product = productMap[item.ProductId];

                if (request.PaymentType != PaymentType.Credit && item.UnitType == "Piece")
                {
                    discountedLineTotals[item.Id] = promotionEngine.CalculateLineTotal(
                        product,
                        item.Quantity,
                        transaction.Items);
                }
            }

            foreach (var item in transaction.Items)
            {
                if (!discountedLineTotals.TryGetValue(item.Id, out var lineTotal) || item.Quantity <= 0)
                    continue;

                item.UnitPrice = Math.Round(lineTotal / item.Quantity, 2, MidpointRounding.AwayFromZero);
            }

            transaction.TotalAmount = Math.Round(transaction.Items.Sum(x => x.Quantity * x.UnitPrice), 2, MidpointRounding.AwayFromZero);

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