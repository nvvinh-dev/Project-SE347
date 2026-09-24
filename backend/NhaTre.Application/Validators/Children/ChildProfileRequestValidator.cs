using FluentValidation;
using NhaTre.Application.DTOs.Children;

namespace NhaTre.Application.Validators.Children;

public class ChildProfileRequestValidator : AbstractValidator<ChildProfileRequest>
{
    public ChildProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên trẻ không được để trống.")
            .MaximumLength(100).WithMessage("Họ tên trẻ không được dài quá 100 ký tự.");

        // DateOnly thiếu trong JSON sẽ nhận giá trị mặc định 01/01/0001, nên NotEmpty
        // mới bắt được trường hợp client không gửi ngày.
        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Ngày sinh không được để trống.")
            .LessThanOrEqualTo(_ => DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("Ngày sinh không được sau ngày hôm nay.");

        RuleFor(x => x.EnrollmentDate)
            .NotEmpty().WithMessage("Ngày nhập học không được để trống.")
            .GreaterThanOrEqualTo(x => x.DateOfBirth)
            .WithMessage("Ngày nhập học không được trước ngày sinh.");
    }
}
