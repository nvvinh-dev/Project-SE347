using FluentValidation;
using NhaTre.Application.DTOs.Classes;

namespace NhaTre.Application.Validators.Classes;

public class AssignHomeroomTeacherRequestValidator : AbstractValidator<AssignHomeroomTeacherRequest>
{
    public AssignHomeroomTeacherRequestValidator()
    {
        // null hợp lệ (bỏ giáo viên chủ nhiệm); Guid rỗng thì chắc chắn không phải tài khoản nào
        RuleFor(x => x.TeacherUserId)
            .NotEqual(Guid.Empty).WithMessage("Mã tài khoản giáo viên không hợp lệ.");
    }
}
