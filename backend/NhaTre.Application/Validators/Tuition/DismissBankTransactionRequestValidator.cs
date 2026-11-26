using FluentValidation;
using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Validators.Tuition;

public class DismissBankTransactionRequestValidator : AbstractValidator<DismissBankTransactionRequest>
{
    public DismissBankTransactionRequestValidator()
    {
        // D21 mục 3: ghi chú bắt buộc, tối đa 500 ký tự như cột resolution_note. Đo sau Trim vì
        // TuitionService lưu bản đã trim
        RuleFor(x => x.Note)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Ghi chú không được để trống.")
            .Must(note => note.Trim().Length <= 500)
            .WithMessage("Ghi chú không được dài quá 500 ký tự.");
    }
}
