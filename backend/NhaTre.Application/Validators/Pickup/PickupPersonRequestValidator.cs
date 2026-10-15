using FluentValidation;
using NhaTre.Application.DTOs.Pickup;

namespace NhaTre.Application.Validators.Pickup;

// D24, BR-PICKUP-08: đủ 4 thông tin bắt buộc; BR-PICKUP-10: phải xác nhận đồng ý ở mỗi lần lưu.
// Dùng cho cả sửa lẫn thêm mới (CreatePickupPersonRequestValidator gọi lại các quy tắc này)
public class PickupPersonRequestValidator : AbstractValidator<PickupPersonRequest>
{
    public PickupPersonRequestValidator()
    {
        // Đo độ dài sau Trim vì PickupService lưu bản đã trim
        RuleFor(x => x.FullName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Họ tên người đón không được để trống.")
            .Must(name => name!.Trim().Length <= 100)
            .WithMessage("Họ tên người đón không được dài quá 100 ký tự.");

        RuleFor(x => x.Relationship)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mối liên hệ với trẻ không được để trống.")
            .Must(relationship => relationship!.Trim().Length <= 50)
            .WithMessage("Mối liên hệ với trẻ không được dài quá 50 ký tự.");

        // [0-9] thay cho \d: trong .NET \d khớp cả chữ số Unicode khác (ví dụ chữ số Ả Rập).
        // Không trim: giá trị lưu đúng như giá trị đã kiểm
        RuleFor(x => x.PhoneNumber)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .Matches("^0[0-9]{9}$").WithMessage("Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0.");

        RuleFor(x => x.CitizenIdNumber)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Số CCCD không được để trống.")
            .Matches("^[0-9]{12}$").WithMessage("Số CCCD phải gồm đúng 12 chữ số.");

        // Thiếu trường hoặc false đều từ chối, không lưu gì kể cả ảnh (AC-PICKUP-15)
        RuleFor(x => x.ConsentConfirmed)
            .Equal(true)
            .WithMessage("Cần xác nhận người được đăng ký đồng ý cung cấp thông tin để nhà trường xác minh khi đón trẻ.");
    }
}
