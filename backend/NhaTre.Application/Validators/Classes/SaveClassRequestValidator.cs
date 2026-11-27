using FluentValidation;
using NhaTre.Application.DTOs.Classes;

namespace NhaTre.Application.Validators.Classes;

// Chỉ kiểm hình dạng dữ liệu. Khối không tồn tại (404), trùng tên, lớp còn trẻ hay sĩ số tối đa nhỏ hơn
// số trẻ đang có (409) do ClassService xét
public class SaveClassRequestValidator : AbstractValidator<SaveClassRequest>
{
    public SaveClassRequestValidator()
    {
        RuleFor(x => x.GradeLevelId)
            .GreaterThan((short)0).WithMessage("Mã khối không hợp lệ.");

        // Đo độ dài sau Trim vì ClassService lưu bản đã trim. JsonRequired chỉ bắt thiếu trường,
        // "name": null vẫn qua được model binding nên NotEmpty bắt cả null
        RuleFor(x => x.Name)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Tên lớp không được để trống.")
            .Must(name => name.Trim().Length <= 100)
            .WithMessage("Tên lớp không được dài quá 100 ký tự.");

        // D51: sĩ số nếu có thì từ 1 trở lên, tối thiểu không lớn hơn tối đa
        RuleFor(x => x.MinCapacity)
            .GreaterThanOrEqualTo(1).WithMessage("Sĩ số tối thiểu phải từ 1 trở lên.")
            .When(x => x.MinCapacity is not null);

        RuleFor(x => x.MaxCapacity)
            .GreaterThanOrEqualTo(1).WithMessage("Sĩ số tối đa phải từ 1 trở lên.")
            .When(x => x.MaxCapacity is not null);

        RuleFor(x => x)
            .Must(x => x.MinCapacity <= x.MaxCapacity)
            .WithMessage("Sĩ số tối thiểu không được lớn hơn sĩ số tối đa.")
            .When(x => x.MinCapacity is not null && x.MaxCapacity is not null);
    }
}
