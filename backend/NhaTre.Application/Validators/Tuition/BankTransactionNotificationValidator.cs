using FluentValidation;
using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Validators.Tuition;

// D21 mục 2, bước 2: body sai thì webhook trả 400 và không lưu gì. Chỉ kiểm hình dạng dữ liệu; tài khoản
// nhận có phải của trường không do TuitionService kiểm. Độ dài khớp các cột của bank_transactions
public class BankTransactionNotificationValidator : AbstractValidator<BankTransactionNotification>
{
    // Đồng hồ của ngân hàng và của server có thể lệch nhau một chút
    private static readonly TimeSpan AllowedClockSkew = TimeSpan.FromMinutes(5);

    public BankTransactionNotificationValidator()
    {
        RuleFor(x => x.TransactionId)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mã giao dịch không được để trống.")
            .MaximumLength(100).WithMessage("Mã giao dịch không được dài quá 100 ký tự.");

        RuleFor(x => x.AccountNumber)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Số tài khoản nhận không được để trống.")
            .MaximumLength(30).WithMessage("Số tài khoản nhận không được dài quá 30 ký tự.");

        // Tối đa 2 chữ số thập phân như cột numeric(12,2), để database không tự làm tròn số tiền
        RuleFor(x => x.Amount)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Số tiền phải lớn hơn 0.")
            .PrecisionScale(12, 2, true).WithMessage("Số tiền tối đa 10 chữ số phần nguyên và 2 chữ số thập phân.");

        // Nội dung rỗng vẫn là giao dịch hợp lệ (người chuyển không ghi gì): lưu lại ở Unmatched để
        // Kế toán xử lý, nên chỉ bắt buộc có trường này chứ không bắt buộc có chữ
        RuleFor(x => x.Content)
            .Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Nội dung chuyển khoản không được để trống.")
            .MaximumLength(500).WithMessage("Nội dung chuyển khoản không được dài quá 500 ký tự.");

        // Thời điểm phải kèm múi giờ (Z hoặc +07:00): không có múi giờ thì không biết là giờ nào. Thiếu
        // trường thì giá trị mặc định cũng không có múi giờ nên rơi vào cùng lỗi này
        RuleFor(x => x.TransactionAtUtc)
            .Cascade(CascadeMode.Stop)
            .Must(at => at.Kind != DateTimeKind.Unspecified)
            .WithMessage("Thời điểm giao dịch không được để trống và phải kèm múi giờ.")
            .Must(at => at.ToUniversalTime() <= DateTime.UtcNow + AllowedClockSkew)
            .WithMessage("Thời điểm giao dịch không được muộn hơn hiện tại.");
    }
}
