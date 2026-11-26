using FluentValidation;
using NhaTre.Application.DTOs.Attendance;

namespace NhaTre.Application.Validators.Attendance;

public class BatchCheckInRequestValidator : AbstractValidator<BatchCheckInRequest>
{
    public BatchCheckInRequestValidator()
    {
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Danh sách điểm danh không được để trống.")
            .Must(items => items.Count <= BatchRequests.MaxItems)
            .WithMessage($"Mỗi lần điểm danh tối đa {BatchRequests.MaxItems} trẻ.")
            // Mỗi trẻ chỉ có một bản điểm danh mỗi ngày (BR-ATTENDANCE-04), nên một trẻ hai dòng là lỗi của lô
            .Must(items => items.Where(i => i is not null).Select(i => i.ChildId).Distinct().Count()
                == items.Count(i => i is not null))
            .WithMessage("Danh sách điểm danh có trẻ bị trùng.")
            .DependentRules(() =>
            {
                // Mỗi dòng kiểm như route điểm danh từng trẻ
                RuleForEach(x => x.Items)
                    .NotNull().WithMessage("Dòng điểm danh không được để trống.")
                    .SetValidator(new CheckInRequestValidator());
            });
    }
}
