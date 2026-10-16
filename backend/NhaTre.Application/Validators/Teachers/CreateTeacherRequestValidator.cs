using FluentValidation;
using NhaTre.Application.DTOs.Teachers;

namespace NhaTre.Application.Validators.Teachers;

public class CreateTeacherRequestValidator : AbstractValidator<CreateTeacherRequest>
{
    public CreateTeacherRequestValidator()
    {
        // Guid rỗng thì chắc chắn không phải tài khoản nào
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Mã tài khoản giáo viên không hợp lệ.");
    }
}
