using FluentValidation;
using NhaTre.Application.DTOs.Health;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Health;

public class QuickHealthStatusRequestValidator : AbstractValidator<QuickHealthStatusRequest>
{
    public QuickHealthStatusRequestValidator()
    {
        // childId thiếu trong JSON nhận Guid rỗng
        RuleFor(x => x.ChildId)
            .NotEmpty().WithMessage("Trẻ không được để trống.");

        // BR-HEALTH-05: chỉ 4 giá trị của D39 mục 1, phân biệt hoa thường như CHECK ở database
        RuleFor(x => x.Mood)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Tâm trạng không được để trống.")
            .Must(HealthMoods.IsValid)
            .WithMessage("Tâm trạng chỉ nhận 'Happy', 'Normal', 'Tired' hoặc 'Fussy'.");

        // Nhiệt độ tùy chọn; có thì nằm trong giới hạn an toàn 30–45 °C (BR-HEALTH-05, D51) và tối đa
        // 1 chữ số thập phân như cột numeric(4,1), để database không tự làm tròn giá trị giáo viên nhập
        RuleFor(x => x.TemperatureCelsius)
            .Cascade(CascadeMode.Stop)
            .InclusiveBetween(30, 45).WithMessage("Nhiệt độ phải từ 30 đến 45 °C.")
            .PrecisionScale(4, 1, true).WithMessage("Nhiệt độ chỉ được tối đa 1 chữ số thập phân.")
            .When(x => x.TemperatureCelsius is not null);

        // Docs không giới hạn độ dài ghi chú; 1000 ký tự bằng children.health_notes để chặn chuỗi quá
        // dài từ client (D44 mục 1). Đo độ dài sau Trim vì HealthService lưu bản đã trim
        RuleFor(x => x.Notes)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Ghi chú không được để trống.")
            .Must(notes => notes.Trim().Length <= 1000)
            .WithMessage("Ghi chú không được dài quá 1000 ký tự.");
    }
}
