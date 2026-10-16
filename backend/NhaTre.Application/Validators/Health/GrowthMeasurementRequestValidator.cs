using FluentValidation;
using NhaTre.Application.DTOs.Health;

namespace NhaTre.Application.Validators.Health;

public class GrowthMeasurementRequestValidator : AbstractValidator<GrowthMeasurementRequest>
{
    public GrowthMeasurementRequestValidator()
    {
        // BR-HEALTH-05: mỗi lần đo có ít nhất chiều cao hoặc cân nặng (AC-HEALTH-07). Gắn vào HeightCm
        // để request trống cả hai chỉ nhận một message
        RuleFor(x => x.HeightCm)
            .NotNull().WithMessage("Cần nhập ít nhất chiều cao hoặc cân nặng.")
            .When(x => x.WeightKg is null);

        // Miền giá trị là giới hạn chống nhập nhầm, không phải ngưỡng y tế (BR-HEALTH-05, D51). Tối đa
        // 2 chữ số thập phân như cột numeric(5,2), để database không tự làm tròn số Y tế nhập
        RuleFor(x => x.HeightCm)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Chiều cao phải lớn hơn 0 cm.")
            .LessThanOrEqualTo(200).WithMessage("Chiều cao không được quá 200 cm.")
            .PrecisionScale(5, 2, true).WithMessage("Chiều cao chỉ được tối đa 2 chữ số thập phân.")
            .When(x => x.HeightCm is not null);

        RuleFor(x => x.WeightKg)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Cân nặng phải lớn hơn 0 kg.")
            .LessThanOrEqualTo(100).WithMessage("Cân nặng không được quá 100 kg.")
            .PrecisionScale(5, 2, true).WithMessage("Cân nặng chỉ được tối đa 2 chữ số thập phân.")
            .When(x => x.WeightKg is not null);
    }
}
