using FluentValidation;
using NhaTre.Application.DTOs.Children;

namespace NhaTre.Application.Validators.Children;

public class LinkGuardianRequestValidator : AbstractValidator<LinkGuardianRequest>
{
    public LinkGuardianRequestValidator()
    {
        // Guid rỗng thì chắc chắn không phải tài khoản nào
        RuleFor(x => x.GuardianUserId)
            .NotEmpty().WithMessage("Mã tài khoản phụ huynh không hợp lệ.");
    }
}
