using FluentValidation;
using NhaTre.Application.DTOs.Users;

namespace NhaTre.Application.Validators.Users;

public class ChangeRoleRequestValidator : AbstractValidator<ChangeRoleRequest>
{
    public ChangeRoleRequestValidator()
    {
        RuleFor(x => x.Role).UserRole();
    }
}
