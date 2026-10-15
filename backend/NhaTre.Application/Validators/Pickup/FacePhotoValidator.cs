using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Pickup;

// D39 mục 5, D44 mục 5: một ảnh khuôn mặt người đón, JPEG/PNG theo cả Content-Type lẫn phần mở rộng
// tên file, không rỗng, tối đa 5 MB. Số lượng (đúng 1 khi thêm, tối đa 1 khi sửa) Controller kiểm
// trước khi gọi validator này. Hệ thống không đọc chữ ký nội dung file
public class FacePhotoValidator : AbstractValidator<UploadedPhoto>
{
    public FacePhotoValidator()
    {
        RuleFor(x => x.ContentType)
            .Must(ImageContentTypes.IsValid)
            .WithMessage("Ảnh khuôn mặt chỉ nhận định dạng JPEG hoặc PNG.");

        RuleFor(x => x.FileName)
            .Must(ImageContentTypes.HasValidExtension)
            .WithMessage("Tên file ảnh khuôn mặt phải có đuôi .jpg, .jpeg hoặc .png.");

        RuleFor(x => x.Length)
            .Cascade(CascadeMode.Stop)
            .GreaterThan(0).WithMessage("Ảnh khuôn mặt không được rỗng.")
            .LessThanOrEqualTo(ImageContentTypes.MaxFileSizeBytes)
            .WithMessage("Ảnh khuôn mặt không được lớn hơn 5 MB.");
    }
}
