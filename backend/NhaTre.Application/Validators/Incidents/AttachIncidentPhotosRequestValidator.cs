using FluentValidation;
using NhaTre.Application.DTOs.Incidents;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Incidents;

// D39 mục 5, D44 mục 5: 1–5 ảnh mỗi lần, mỗi ảnh JPEG/PNG theo cả Content-Type lẫn phần mở rộng tên file,
// không rỗng, tối đa 5 MB. Chạy ở Controller trước khi file tới IFileStorageService: một ảnh sai là cả lần
// upload bị từ chối, không ảnh nào được lưu (AC-INCIDENT-06). Hệ thống không đọc chữ ký nội dung file
public class AttachIncidentPhotosRequestValidator : AbstractValidator<AttachIncidentPhotosRequest>
{
    public AttachIncidentPhotosRequestValidator()
    {
        RuleFor(x => x.Photos)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Cần ít nhất 1 ảnh sự cố.")
            .Must(photos => photos.Count <= ImageContentTypes.MaxPhotosPerUpload)
            .WithMessage($"Mỗi lần chỉ gửi tối đa {ImageContentTypes.MaxPhotosPerUpload} ảnh sự cố.");

        // Báo theo số thứ tự ảnh (đếm từ 1) để giáo viên biết ảnh nào cần chọn lại
        RuleFor(x => x.Photos).Custom((photos, context) =>
        {
            for (var i = 0; i < photos.Count; i++)
            {
                var photo = photos[i];
                var number = i + 1;

                if (!ImageContentTypes.IsValid(photo.ContentType))
                    context.AddFailure($"Ảnh thứ {number} chỉ nhận định dạng JPEG hoặc PNG.");

                if (!ImageContentTypes.HasValidExtension(photo.FileName))
                    context.AddFailure($"Tên file ảnh thứ {number} phải có đuôi .jpg, .jpeg hoặc .png.");

                if (photo.Length <= 0)
                    context.AddFailure($"Ảnh thứ {number} không được rỗng.");
                else if (photo.Length > ImageContentTypes.MaxFileSizeBytes)
                    context.AddFailure($"Ảnh thứ {number} không được lớn hơn 5 MB.");
            }
        });
    }
}
