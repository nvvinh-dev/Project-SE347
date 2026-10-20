using FluentValidation;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Tuition;

public class RecordPaymentRequestValidator : AbstractValidator<RecordPaymentRequest>
{
    public RecordPaymentRequestValidator()
    {
        // Chỉ 2 giá trị của D21, phân biệt hoa thường như CHECK ở database
        RuleFor(x => x.PaymentMethod)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Hình thức thanh toán không được để trống.")
            .Must(PaymentMethods.IsValid)
            .WithMessage("Hình thức thanh toán chỉ nhận 'Cash' hoặc 'BankTransfer'.");

        // D21: chuyển khoản bắt buộc mã giao dịch ngân hàng, tối đa 100 ký tự như cột
        // external_reference. Đo sau Trim vì TuitionService lưu bản đã trim
        RuleFor(x => x.ExternalReference)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Chuyển khoản phải có mã giao dịch.")
            .Must(reference => reference!.Trim().Length <= 100)
            .WithMessage("Mã giao dịch không được dài quá 100 ký tự.")
            .When(x => x.PaymentMethod == PaymentMethods.BankTransfer);

        // Tiền mặt không có mã giao dịch. Gửi kèm thì từ chối chứ không bỏ qua, để một khoản chuyển
        // khoản chọn nhầm hình thức không bị lưu thành tiền mặt; ghi nhận rồi thì không sửa được
        RuleFor(x => x.ExternalReference)
            .Empty().WithMessage("Thanh toán tiền mặt không có mã giao dịch.")
            .When(x => x.PaymentMethod == PaymentMethods.Cash);
    }
}
