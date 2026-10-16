using FluentValidation;
using NhaTre.Application.DTOs.Users;

namespace NhaTre.Application.Validators.Users;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName).UserFullName();
        RuleFor(x => x.Email).UserEmail();
    }
}
