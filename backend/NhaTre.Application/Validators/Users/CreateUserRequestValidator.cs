using FluentValidation;
using NhaTre.Application.DTOs.Users;

namespace NhaTre.Application.Validators.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FullName).UserFullName();
        RuleFor(x => x.Email).UserEmail();
        RuleFor(x => x.Password).UserPassword();
        RuleFor(x => x.Role).UserRole();
    }
}
