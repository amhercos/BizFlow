using Application.Dto;
using MediatR;

namespace Application.Features.Promotions.Queries;

public record GetCalculatedPriceQuery(
    Guid ProductId,
    int Quantity,
    List<BasketItemDto>? Basket = null
    ) : IRequest<decimal>;