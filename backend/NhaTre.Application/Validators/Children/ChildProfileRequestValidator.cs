using FluentValidation;
using NhaTre.Application.DTOs.Children;

namespace NhaTre.Application.Validators.Children;

public class ChildProfileRequestValidator : AbstractValidator<ChildProfileRequest>
{
    public ChildProfileRequestValidator()
    {
        // Đo độ dài sau Trim vì ChildService lưu bản đã trim
        RuleFor(x => x.FullName)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Họ tên trẻ không được để trống.")
            .Must(fullName => fullName.Trim().Length <= 100)
            .WithMessage("Họ tên trẻ không được dài quá 100 ký tự.");

        // DateOnly thiếu trong JSON sẽ nhận giá trị mặc định 01/01/0001, nên NotEmpty
        // mới bắt được trường hợp client không gửi ngày. Cascade Stop để thiếu ngày thì
        // chỉ báo một lỗi "để trống", không kèm lỗi so sánh ngày gây hiểu nhầm.
        RuleFor(x => x.DateOfBirth)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Ngày sinh không được để trống.")
            .LessThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Ngày sinh không được sau ngày hôm nay.");

        RuleFor(x => x.EnrollmentDate)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Ngày nhập học không được để trống.")
            .GreaterThanOrEqualTo(x => x.DateOfBirth)
            .WithMessage("Ngày nhập học không được trước ngày sinh.");
    }
}
