using FluentValidation;
using NhaTre.Application.DTOs.Tuition;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Tuition;

public class BulkInvoiceRequestValidator : AbstractValidator<BulkInvoiceRequest>
{
    public BulkInvoiceRequestValidator()
    {
        // tuitionFeeId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.TuitionFeeId)
            .NotEmpty().WithMessage("Biểu phí không được để trống.");

        // Mô tả và số tiền theo đúng quy tắc của hóa đơn lập từng trẻ (InvoiceRequestValidator)
        RuleFor(x => x.Description)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mô tả hóa đơn không được để trống.")
            .Must(description => description.Trim().Length <= 1000)
            .WithMessage("Mô tả hóa đơn không được dài quá 1000 ký tự.");

        RuleFor(x => x.Amount)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Số tiền phải lớn hơn 0.")
            .PrecisionScale(12, 2, true)
            .WithMessage("Số tiền chỉ được tối đa 10 chữ số phần nguyên và 2 chữ số phần thập phân.");

        RuleFor(x => x.Scope)
            .NotNull().WithMessage("Phạm vi lập hóa đơn không được để trống.");

        When(x => x.Scope is not null, () =>
        {
            RuleFor(x => x.Scope.Type)
                .Must(InvoiceBulkScopeTypes.IsValid)
                .WithMessage("Phạm vi chỉ nhận 'class', 'gradeLevel' hoặc 'school'.");

            RuleFor(x => x.Scope.Id)
                .Must(id => Guid.TryParse(id, out var classId) && classId != Guid.Empty)
                .When(x => x.Scope.Type == InvoiceBulkScopeTypes.Class)
                .WithMessage("Mã lớp không hợp lệ.");

            RuleFor(x => x.Scope.Id)
                .Must(id => short.TryParse(id, out var gradeLevelId) && gradeLevelId > 0)
                .When(x => x.Scope.Type == InvoiceBulkScopeTypes.GradeLevel)
                .WithMessage("Mã khối không hợp lệ.");

            RuleFor(x => x.Scope.Id)
                .Null()
                .When(x => x.Scope.Type == InvoiceBulkScopeTypes.School)
                .WithMessage("Phạm vi toàn trường không kèm mã lớp hay mã khối.");
        });
    }
}
