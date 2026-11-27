using FluentValidation;
using NhaTre.Application.DTOs.Health;

namespace NhaTre.Application.Validators.Health;

public class BatchQuickHealthStatusRequestValidator : AbstractValidator<BatchQuickHealthStatusRequest>
{
    public BatchQuickHealthStatusRequestValidator()
    {
        RuleFor(x => x.Items)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Danh sách ghi nhận sức khỏe không được để trống.")
            .Must(items => items.Count <= BatchRequests.MaxItems)
            .WithMessage($"Mỗi lần ghi nhận sức khỏe tối đa {BatchRequests.MaxItems} trẻ.")
            // Một lô là một lượt ghi cho từng trẻ; cùng trẻ hai dòng gần như chắc là chọn nhầm, ghi riêng
            // từng bản vẫn làm được qua route từng bản ghi
            .Must(items => items.Where(i => i is not null).Select(i => i.ChildId).Distinct().Count()
                == items.Count(i => i is not null))
            .WithMessage("Danh sách ghi nhận sức khỏe có trẻ bị trùng.")
            .DependentRules(() =>
            {
                // Mỗi dòng kiểm như route từng bản ghi; một dòng sai là 400 cho cả lô (D39 mục 21)
                RuleForEach(x => x.Items)
                    .NotNull().WithMessage("Dòng ghi nhận sức khỏe không được để trống.")
                    .SetValidator(new QuickHealthStatusRequestValidator());
            });
    }
}
