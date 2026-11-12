using FluentValidation;
using NhaTre.Application.DTOs.Complaints;

namespace NhaTre.Application.Validators.Complaints;

public class CreateComplaintRequestValidator : AbstractValidator<CreateComplaintRequest>
{
    public CreateComplaintRequestValidator()
    {
        // Đo độ dài sau Trim vì ComplaintService lưu bản đã trim (D39 mục 18)
        RuleFor(x => x.Content)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Nội dung phản ánh không được để trống.")
            .Must(content => content.Trim().Length <= 2000)
            .WithMessage("Nội dung phản ánh không được dài quá 2000 ký tự.");
    }
}
