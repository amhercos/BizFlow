using Application.Dto;
using Application.Features.CustomerCredits.Queries;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.CustomerCredits.Handlers;

public class GetCustomerCreditSummaryHandler(
    ICustomerCreditRepository creditRepository,
    ITransactionRepository transactionRepository) : IRequestHandler<GetCustomerCreditSummaryQuery, CustomerCreditSummaryDto>
{
    public async Task<CustomerCreditSummaryDto> Handle(GetCustomerCreditSummaryQuery request, CancellationToken ct)
    {
        var account = await creditRepository.GetByIdAsync(request.CustomerId, ct);
        if (account == null) throw new Exception("Customer record not found.");

        var transactions = await transactionRepository.GetByCustomerIdAsync(request.CustomerId, ct);
        var payments = await creditRepository.GetPaymentHistoryAsync(request.CustomerId, ct);
        var balance = await creditRepository.GetCalculatedBalanceAsync(request.CustomerId, ct);

        return new CustomerCreditSummaryDto(
            account.Id,
            account.CustomerName,
            account.ContactInfo,
            balance,
            transactions.Select(t => new RecentTransactionDto(
                t.Id,
                t.TransactionDate,
                t.TotalAmount,
                t.PaymentType.ToString(),
                t.Items.Count,
                t.Items.Select(item => new TransactionItemDto(
                    item.Product?.Name ?? "Deleted Product",
                    item.Quantity,
                    item.UnitPrice,
                    item.Quantity * item.UnitPrice
                )).ToList()
            )).ToList(),
            payments.Select(p => new PaymentHistoryDto(
                p.Id,
                p.AmountPaid,
                p.PaymentDate
            )).ToList()
        );
    }
}