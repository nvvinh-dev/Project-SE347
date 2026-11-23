using FluentValidation;
using NhaTre.Application.DTOs.MockBank;

namespace NhaTre.Application.Validators.MockBank;

// D57: chỉ kiểm hình dạng dữ liệu, khớp form Ngân hàng giả lập của frontend. Giới hạn nằm trong giới hạn của
// BankTransactionNotificationValidator, nên giao dịch qua được đây thì webhook không trả 400 vì body
public class MockBankTransferRequestValidator : AbstractValidator<MockBankTransferRequest>
{
    // 10 chữ số phần nguyên như cột numeric(12,2) của bank_transactions và form của frontend
    private const decimal MaxAmount = 9_999_999_999m;

    public MockBankTransferRequestValidator()
    {
        // Tiền đồng không có phần lẻ, như ô số tiền của frontend
        RuleFor(x => x.Amount)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Số tiền phải lớn hơn 0.")
            .Must(amount => amount == decimal.Truncate(amount)).WithMessage("Số tiền phải là số nguyên, không có phần lẻ.")
            .LessThanOrEqualTo(MaxAmount).WithMessage("Số tiền không được vượt quá 9.999.999.999 đ.");

        RuleFor(x => x.Content)
            .Cascade(CascadeMode.Stop)
            .Must(content => !string.IsNullOrWhiteSpace(content)).WithMessage("Nội dung chuyển khoản không được để trống.")
            .MaximumLength(500).WithMessage("Nội dung chuyển khoản không được dài quá 500 ký tự.");
    }
}
