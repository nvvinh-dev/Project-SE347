using FluentValidation;
using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Validators.Tuition;

public class InvoiceRequestValidator : AbstractValidator<InvoiceRequest>
{
    public InvoiceRequestValidator()
    {
        // childId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.ChildId)
            .NotEmpty().WithMessage("Trẻ không được để trống.");

        // Mô tả chép từ biểu phí (tối đa 500 ký tự) rồi Kế toán ghi thêm kỳ thu, nên giới hạn
        // phải rộng hơn của biểu phí. Đo độ dài sau Trim vì TuitionService lưu bản đã trim
        RuleFor(x => x.Description)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mô tả hóa đơn không được để trống.")
            .Must(description => description.Trim().Length <= 1000)
            .WithMessage("Mô tả hóa đơn không được dài quá 1000 ký tự.");

        // Cùng quy tắc với số tiền biểu phí: cột numeric(12,2)
        RuleFor(x => x.Amount)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Số tiền phải lớn hơn 0.")
            .PrecisionScale(12, 2, true)
            .WithMessage("Số tiền chỉ được tối đa 10 chữ số phần nguyên và 2 chữ số phần thập phân.");
    }
}
