using FluentValidation;
using NhaTre.Application.DTOs.Media;

namespace NhaTre.Application.Validators.Media;

public class ActivityPhotoListQueryValidator : AbstractValidator<ActivityPhotoListQuery>
{
    public ActivityPhotoListQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Số trang phải từ 1 trở lên.");

        // Mỗi ảnh trong trang là một lần xin URL ký từ Storage, nên chặn trên để một yêu cầu không ký cả kho ảnh
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Số ảnh mỗi trang phải từ 1 đến 100.");
    }
}
