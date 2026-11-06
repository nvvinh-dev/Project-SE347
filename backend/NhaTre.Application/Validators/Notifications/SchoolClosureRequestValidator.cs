using FluentValidation;
using NhaTre.Application.DTOs.Notifications;

namespace NhaTre.Application.Validators.Notifications;

public class SchoolClosureRequestValidator : AbstractValidator<SchoolClosureRequest>
{
    public SchoolClosureRequestValidator()
    {
        // Đo độ dài sau Trim vì NotificationService ghép bản đã trim; 500 ký tự không tính tiền tố
        RuleFor(x => x.Content)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Nội dung thông báo không được để trống.")
            .Must(content => content.Trim().Length <= 500)
            .WithMessage("Nội dung thông báo không được dài quá 500 ký tự.");
    }
}
