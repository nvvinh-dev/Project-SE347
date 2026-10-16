using FluentValidation;
using NhaTre.Application.DTOs.Incidents;

namespace NhaTre.Application.Validators.Incidents;

public class CreateIncidentRequestValidator : AbstractValidator<CreateIncidentRequest>
{
    // Đồng hồ máy giáo viên có thể nhanh hơn máy chủ một chút; ghi "vừa xảy ra" không nên bị từ chối
    private static readonly TimeSpan ClockSkew = TimeSpan.FromMinutes(5);

    public CreateIncidentRequestValidator()
    {
        // childId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.ChildId)
            .NotEmpty().WithMessage("Trẻ không được để trống.");

        // Thiếu trong JSON thì nhận 01/01/0001. Chuỗi không có múi giờ (Kind Unspecified) không biết là
        // giờ Việt Nam hay UTC, nên từ chối thay vì đoán. Sự cố ghi sau khi đã xảy ra (D39 mục 15), nên
        // không nhận thời điểm ở tương lai
        RuleFor(x => x.OccurredAtUtc)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Thời điểm xảy ra không được để trống.")
            .Must(occurredAt => occurredAt.Kind != DateTimeKind.Unspecified)
            .WithMessage("Thời điểm xảy ra phải ghi rõ múi giờ, ví dụ 2026-10-16T01:30:00Z.")
            .Must(occurredAt => occurredAt.ToUniversalTime() <= DateTime.UtcNow + ClockSkew)
            .WithMessage("Thời điểm xảy ra không được sau thời điểm hiện tại.");

        // Docs không giới hạn độ dài mô tả; 1000 ký tự bằng ghi chú sức khỏe nhanh để chặn chuỗi quá
        // dài từ client (D44 mục 1). Đo độ dài sau Trim vì IncidentService lưu bản đã trim
        RuleFor(x => x.Description)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mô tả sự cố không được để trống.")
            .Must(description => description.Trim().Length <= 1000)
            .WithMessage("Mô tả sự cố không được dài quá 1000 ký tự.");
    }
}
