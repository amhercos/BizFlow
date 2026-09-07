namespace Application.Dto;

public record BasketItemDto(
    Guid ProductId,
    int Quantity,
    bool IsPack,
    decimal UnitPrice,
    decimal SubTotal
);