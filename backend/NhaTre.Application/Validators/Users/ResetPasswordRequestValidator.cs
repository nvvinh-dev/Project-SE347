using FluentValidation;
using NhaTre.Application.DTOs.Users;

namespace NhaTre.Application.Validators.Users;

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.NewPassword).UserPassword();
    }
}
