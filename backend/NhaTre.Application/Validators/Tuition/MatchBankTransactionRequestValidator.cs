using FluentValidation;
using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Validators.Tuition;

public class MatchBankTransactionRequestValidator : AbstractValidator<MatchBankTransactionRequest>
{
    public MatchBankTransactionRequestValidator()
    {
        // Body thiếu invoiceId thì model binding để Guid.Empty
        RuleFor(x => x.InvoiceId)
            .NotEmpty().WithMessage("Phải chọn hóa đơn để gán giao dịch.");
    }
}
