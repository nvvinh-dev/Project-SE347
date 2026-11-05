using FluentValidation;
using NhaTre.Application.DTOs.Classes;

namespace NhaTre.Application.Validators.Classes;

public class AssignAssistantTeachersRequestValidator : AbstractValidator<AssignAssistantTeachersRequest>
{
    public AssignAssistantTeachersRequestValidator()
    {
        // JsonRequired chỉ bắt thiếu trường; "teacherUserIds": null vẫn qua được model binding
        RuleFor(x => x.TeacherUserIds)
            .NotNull().WithMessage("Danh sách giáo viên phụ là bắt buộc.")
            .DependentRules(() =>
            {
                RuleFor(x => x.TeacherUserIds)
                    .Must(ids => ids.Distinct().Count() == ids.Count)
                    .WithMessage("Danh sách giáo viên phụ có giáo viên bị trùng.");

                RuleForEach(x => x.TeacherUserIds)
                    .NotEqual(Guid.Empty).WithMessage("Mã tài khoản giáo viên không hợp lệ.");
            });
    }
}
