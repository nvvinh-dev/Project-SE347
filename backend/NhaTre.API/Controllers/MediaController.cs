using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Media;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Ảnh hoạt động gồm hai tài nguyên: ảnh của lớp (classes/{classId}/activity-photos, giáo viên chia sẻ)
// và ảnh theo con của phụ huynh (children/{childId}/activity-photos), nên route gốc của Controller là api/ và
// mỗi action tự ghi tên tài nguyên. Hai vai trò dùng chung nên Roles gắn theo từng action; [Authorize] ở mức
// class để action nào quên gắn Roles vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-MEDIA-01: chỉ Giáo viên chia sẻ ảnh (BR-MEDIA-01), và chỉ cho lớp mình chủ nhiệm (BR-MEDIA-03, D40 mục 2).
// Ảnh đã chia sẻ không sửa, không xóa.
// FR-MEDIA-02: Phụ huynh chỉ xem ảnh của lớp con mình đang học (child_guardians, BR-MEDIA-02, D39 mục 10).
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
    private readonly IValidator<ActivityPhotoListQuery> _activityPhotoListQueryValidator;

    public MediaController(IMediaService mediaService,
        IValidator<ShareActivityPhotosRequest> shareActivityPhotosValidator,
        IValidator<ActivityPhotoListQuery> activityPhotoListQueryValidator)
    {
        _mediaService = mediaService;
        _shareActivityPhotosValidator = shareActivityPhotosValidator;
        _activityPhotoListQueryValidator = activityPhotoListQueryValidator;
    }

    // Multipart: 1–5 ảnh ở trường photos (D39 mục 5). Trả các ảnh vừa chia sẻ kèm URL ký hạn 60 phút (D53).
    // Lớp không tồn tại và lớp giáo viên khác chủ nhiệm cùng trả 404, không ảnh nào được lưu (AC-MEDIA-03).
    // Route xem ảnh duy nhất là của phụ huynh theo con, giáo viên không gọi được, nên 201 không kèm Location
    // (api-conventions §4)
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

    // Route theo con như sự cố (FR-INCIDENT-03) và sức khỏe (FR-HEALTH-05): phụ huynh lấy childId từ
    // children/mine, không cần biết id lớp. Trẻ không tồn tại và trẻ không liên kết với mình cùng trả 404
    // (AC-MEDIA-04); con mình chưa xếp lớp hay lớp chưa có ảnh thì trang rỗng. Phân trang ?page=&pageSize=
    // (api-conventions §2.1), mới nhất trước. URL ký hạn 60 phút (D53), hết hạn thì gọi lại trang đó
    [HttpGet("children/{childId:guid}/activity-photos")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<ActivityPhotoPageResponse>>> GetChildActivityPhotos(Guid childId,
        [FromQuery] ActivityPhotoListQuery query)
    {
        var validationResult = await _activityPhotoListQueryValidator.ValidateAsync(query);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<ActivityPhotoPageResponse>.Fail(errors));
        }

        var result = await _mediaService.GetChildActivityPhotosForGuardianAsync(childId, query, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<ActivityPhotoPageResponse>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<ActivityPhotoPageResponse>.Ok(result));
    }

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
