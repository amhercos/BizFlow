namespace Application.Dto;

public record TransactionDetailsDto(
    Guid Id,
    DateTime TransactionDate,
    decimal TotalAmount,
    decimal CashReceived,
    decimal ChangeAmount,
    string PaymentType,
    string UserName,
    List<TransactionItemDto> Items);

public record TransactionItemDto(
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal SubTotal,
    bool IsFree = false);