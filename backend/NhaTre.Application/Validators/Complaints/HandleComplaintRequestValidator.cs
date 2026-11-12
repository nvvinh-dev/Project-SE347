using FluentValidation;
using NhaTre.Application.DTOs.Complaints;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Complaints;

public class HandleComplaintRequestValidator : AbstractValidator<HandleComplaintRequest>
{
    public HandleComplaintRequestValidator()
    {
        // New chỉ do server đặt lúc tạo, Admin không chuyển ngược về được
        RuleFor(x => x.Status)
            .Must(ComplaintStatuses.IsHandlingTarget)
            .WithMessage("Trạng thái xử lý phải là đang xử lý (InProgress) hoặc đã xử lý xong (Resolved).");

        // Đo độ dài sau Trim vì ComplaintService lưu bản đã trim
        When(x => x.Status == ComplaintStatuses.Resolved, () =>
        {
            RuleFor(x => x.Resolution)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Phản ánh đã xử lý xong phải kèm kết quả xử lý.")
                .Must(resolution => resolution!.Trim().Length <= 2000)
                .WithMessage("Kết quả xử lý không được dài quá 2000 ký tự.");
        });
    }
}
