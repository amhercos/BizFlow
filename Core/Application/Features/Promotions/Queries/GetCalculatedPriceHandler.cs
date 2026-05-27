using Application.Interfaces;
using Application.Interfaces.Repositories;
using Domain.Entities;
using MediatR;

namespace Application.Features.Promotions.Queries;

public class GetCalculatedPriceHandler(
    IProductRepository productRepo,
    IPromotionEngine promotionEngine)
    : IRequestHandler<GetCalculatedPriceQuery, decimal>
{
    public async Task<decimal> Handle(GetCalculatedPriceQuery request, CancellationToken ct)
    {
        var product = await productRepo.GetByIdAsync(request.ProductId, ct);

        if (product == null) return 0;

        var transactionBasket = request.Basket?
            .Select(item => new TransactionItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity
            }) ?? Enumerable.Empty<TransactionItem>();

        return promotionEngine.CalculateLineTotal(
             product,
             request.Quantity,
             transactionBasket
         );
    }
}