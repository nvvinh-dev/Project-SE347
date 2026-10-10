using FluentValidation;
using NhaTre.Application.DTOs.Pickup;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Pickup;

public class CreatePickupRequestValidator : AbstractValidator<CreatePickupRequest>
{
    public CreatePickupRequestValidator()
    {
        // childId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.ChildId)
            .NotEmpty().WithMessage("Trẻ không được để trống.");

        // Chỉ 3 giá trị của D24, phân biệt hoa thường như CHECK ở database
        RuleFor(x => x.PickupMethod)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Cách đón không được để trống.")
            .Must(PickupMethods.IsValid)
            .WithMessage("Cách đón chỉ nhận 'Primary', 'Backup' hoặc 'PhoneConfirmed'.");

        // pickupPersonId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.PickupPersonId)
            .NotEmpty().WithMessage("Người đón đã đăng ký không được để trống.");

        // AC-PICKUP-04: PhoneConfirmed thì bắt buộc họ tên người đến đón. Primary/Backup không kiểm
        // trường này vì giá trị client gửi bị bỏ qua (AC-PICKUP-01). Docs không giới hạn độ dài;
        // 100 ký tự bằng registered_pickup_persons.full_name. Đo sau Trim vì PickupService lưu bản đã trim
        RuleFor(x => x.PickerFullName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Họ tên người đến đón không được để trống khi xác nhận qua điện thoại.")
            .Must(name => name!.Trim().Length <= 100)
            .WithMessage("Họ tên người đến đón không được dài quá 100 ký tự.")
            .When(x => x.PickupMethod == PickupMethods.PhoneConfirmed);
    }
}
