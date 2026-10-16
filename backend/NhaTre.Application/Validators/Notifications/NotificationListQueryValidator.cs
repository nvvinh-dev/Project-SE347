using FluentValidation;
using NhaTre.Application.DTOs.Notifications;

namespace NhaTre.Application.Validators.Notifications;

public class NotificationListQueryValidator : AbstractValidator<NotificationListQuery>
{
    public NotificationListQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải từ 1 trở lên.");

        // Thông báo không bao giờ bị xóa, nên chặn trên để một yêu cầu không kéo cả lịch sử về
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Số thông báo mỗi trang phải từ 1 đến 100.");
    }
}
