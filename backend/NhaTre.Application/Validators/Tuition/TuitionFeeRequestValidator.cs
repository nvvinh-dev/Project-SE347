using FluentValidation;
using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Validators.Tuition;

public class TuitionFeeRequestValidator : AbstractValidator<TuitionFeeRequest>
{
    public TuitionFeeRequestValidator()
    {
        // Đo độ dài sau Trim vì TuitionService lưu bản đã trim
        RuleFor(x => x.Description)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mô tả biểu phí không được để trống.")
            .Must(description => description.Trim().Length <= 500)
            .WithMessage("Mô tả biểu phí không được dài quá 500 ký tự.");

        // Amount thiếu trong JSON nhận giá trị mặc định 0, nên GreaterThan(0) bắt luôn trường
        // hợp client không gửi số tiền. PrecisionScale khớp cột numeric(12,2): không kiểm tra
        // thì DB tự làm tròn phần lẻ, còn số quá lớn thành lỗi 500.
        RuleFor(x => x.Amount)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Số tiền phải lớn hơn 0.")
            .PrecisionScale(12, 2, true)
            .WithMessage("Số tiền chỉ được tối đa 10 chữ số phần nguyên và 2 chữ số phần thập phân.");
    }
}
