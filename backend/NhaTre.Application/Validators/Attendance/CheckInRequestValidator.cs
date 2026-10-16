using FluentValidation;
using NhaTre.Application.DTOs.Attendance;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Attendance;

public class CheckInRequestValidator : AbstractValidator<CheckInRequest>
{
    public CheckInRequestValidator()
    {
        // childId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.ChildId)
            .NotEmpty().WithMessage("Trẻ không được để trống.");

        // BR-ATTENDANCE-05: chỉ 3 giá trị của D23, phân biệt hoa thường như CHECK ở database
        RuleFor(x => x.Status)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Trạng thái điểm danh không được để trống.")
            .Must(AttendanceStatuses.IsValid)
            .WithMessage("Trạng thái điểm danh chỉ nhận 'Present', 'AbsentExcused' hoặc 'AbsentUnexcused'.");
    }
}
