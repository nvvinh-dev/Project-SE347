using FluentValidation;
using NhaTre.Application.DTOs.Classes;

namespace NhaTre.Application.Validators.Classes;

public class AssignClassRequestValidator : AbstractValidator<AssignClassRequest>
{
    public AssignClassRequestValidator()
    {
        // null hợp lệ (gỡ khỏi lớp); Guid rỗng thì chắc chắn không phải lớp nào
        RuleFor(x => x.ClassId)
            .NotEqual(Guid.Empty).WithMessage("Mã lớp không hợp lệ.");
    }
}
