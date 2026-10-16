using FluentValidation;
using NhaTre.Application.DTOs.Pickup;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Pickup;

public class CreatePickupPersonRequestValidator : AbstractValidator<CreatePickupPersonRequest>
{
    public CreatePickupPersonRequestValidator()
    {
        RuleFor(x => x.Priority)
            .Cascade(CascadeMode.Stop)
            .NotNull().WithMessage("Cần chọn người đón chính hay người đón dự phòng (priority).")
            .Must(PickupPersonPriorities.IsValid)
            .WithMessage("Thứ tự ưu tiên (priority) chỉ nhận 1 (người đón chính) hoặc 2 (người đón dự phòng).");

        // 4 thông tin và ô xác nhận đồng ý kiểm như khi sửa
        Include(new PickupPersonRequestValidator());
    }
}
