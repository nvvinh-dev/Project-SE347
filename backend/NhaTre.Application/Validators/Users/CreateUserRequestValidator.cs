using FluentValidation;
using NhaTre.Application.DTOs.Users;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Users;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FullName).UserFullName();
        RuleFor(x => x.Email).UserEmail();
        RuleFor(x => x.Password).UserPassword();

        // Thiếu hoặc sai vai trò thì từ chối, không gán vai trò mặc định (D43 mục 5)
        RuleFor(x => x.Role)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Vai trò không được để trống.")
            .Must(Roles.IsValid)
            .WithMessage($"Vai trò phải là một trong: {Roles.Admin}, {Roles.Teacher}, {Roles.Accountant}, {Roles.Medical}, {Roles.Parent}.");
    }
}
