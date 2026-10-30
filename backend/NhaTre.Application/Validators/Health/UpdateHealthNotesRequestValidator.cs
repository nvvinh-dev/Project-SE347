using FluentValidation;
using NhaTre.Application.DTOs.Health;

namespace NhaTre.Application.Validators.Health;

public class UpdateHealthNotesRequestValidator : AbstractValidator<UpdateHealthNotesRequest>
{
    public UpdateHealthNotesRequestValidator()
    {
        // D39 mục 14: cho phép rỗng, tối đa 1000 ký tự như cột children.health_notes. Đo độ dài sau Trim
        // vì HealthService lưu bản đã trim (AC-HEALTH-14)
        RuleFor(x => x.HealthNotes)
            .Must(healthNotes => healthNotes is null || healthNotes.Trim().Length <= 1000)
            .WithMessage("Lưu ý sức khỏe không được dài quá 1000 ký tự.");
    }
}
