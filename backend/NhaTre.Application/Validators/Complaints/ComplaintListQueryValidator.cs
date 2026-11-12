using FluentValidation;
using NhaTre.Application.DTOs.Complaints;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Complaints;

public class ComplaintListQueryValidator : AbstractValidator<ComplaintListQuery>
{
    public ComplaintListQueryValidator()
    {
        RuleFor(x => x.Status)
            .Must(ComplaintStatuses.IsValid)
            .When(x => x.Status is not null)
            .WithMessage("Trạng thái lọc phải là New, InProgress hoặc Resolved.");

        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải từ 1 trở lên.");

        // Phản ánh không bao giờ bị xóa, nên chặn trên để một yêu cầu không kéo cả lịch sử về
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Số phản ánh mỗi trang phải từ 1 đến 100.");
    }
}
