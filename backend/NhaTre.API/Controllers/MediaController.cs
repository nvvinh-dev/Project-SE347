using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Media;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Ảnh hoạt động. Ảnh là tài nguyên con của lớp (classes/{classId}/activity-photos), nên route gốc của
// Controller là api/ và mỗi action tự ghi tên tài nguyên. [Authorize] ở mức class để action nào quên gắn
// Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-MEDIA-01: chỉ Giáo viên chia sẻ ảnh (BR-MEDIA-01), và chỉ cho lớp mình chủ nhiệm (BR-MEDIA-03, D40 mục 2).
// Ảnh đã chia sẻ không sửa, không xóa.
[ApiController]
[Route("api")]
[Authorize]
public class MediaController : ControllerBase
{
    // 5 ảnh, mỗi ảnh tối đa 5 MB, cùng mức với ảnh sự cố (IncidentsController). Đặt cao hơn 6 ảnh 5 MB để ảnh
    // thừa hay ảnh quá cỡ vẫn tới validator và nhận message riêng (AC-MEDIA-05). Quá mức này Kestrel dừng đọc
    // body, model binding báo lỗi và Program.cs trả 400 "Dữ liệu gửi lên không đọc được"
    private const long MultipartRequestSizeLimitBytes = 40 * 1024 * 1024;

    private readonly IMediaService _mediaService;
    private readonly IValidator<ShareActivityPhotosRequest> _shareActivityPhotosValidator;

    public MediaController(IMediaService mediaService,
        IValidator<ShareActivityPhotosRequest> shareActivityPhotosValidator)
    {
        _mediaService = mediaService;
        _shareActivityPhotosValidator = shareActivityPhotosValidator;
    }

    // Multipart: 1–5 ảnh ở trường photos (D39 mục 5). Trả các ảnh vừa chia sẻ kèm URL ký hạn 60 phút (D53).
    // Lớp không tồn tại và lớp giáo viên khác chủ nhiệm cùng trả 404, không ảnh nào được lưu (AC-MEDIA-03).
    // Chưa có route xem ảnh hoạt động để làm Location nên 201 không kèm Location
    [HttpPost("classes/{classId:guid}/activity-photos")]
    [Authorize(Roles = Roles.Teacher)]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MultipartRequestSizeLimitBytes)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ActivityPhotoResponse>>>> ShareActivityPhotos(
        Guid classId, List<IFormFile>? photos)
    {
        var request = new ShareActivityPhotosRequest(
            photos?.Select(f => new UploadedPhoto(f.FileName, f.ContentType, f.Length, f.OpenReadStream)).ToList()
                ?? new List<UploadedPhoto>());

        var validationResult = await _shareActivityPhotosValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<IReadOnlyList<ActivityPhotoResponse>>.Fail(errors));
        }

        var result = await _mediaService.ShareActivityPhotosAsync(classId, request, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<ActivityPhotoResponse>>.Fail("Không tìm thấy lớp học."));

        return StatusCode(StatusCodes.Status201Created, ApiResponse<IReadOnlyList<ActivityPhotoResponse>>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
