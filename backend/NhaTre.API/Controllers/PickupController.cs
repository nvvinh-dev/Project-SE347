using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Pickup;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using System.IdentityModel.Tokens.Jwt;

namespace NhaTre.API.Controllers;

// Module Đón trả gồm bản ghi đón về của giáo viên và người đón đã đăng ký của phụ huynh, nên route
// gốc là api/ và Roles gắn theo từng action. [Authorize] ở mức class để action nào quên gắn Roles
// vẫn bắt đăng nhập: Program.cs không có fallback policy.
// FR-PICKUP-01: chỉ Giáo viên ghi nhận đón về (BR-PICKUP-01), và chỉ cho trẻ lớp mình chủ nhiệm
// (D40 mục 2). Bản ghi đã tạo không sửa, không xóa.
// FR-PICKUP-02: Giáo viên xem người đón đã đăng ký của trẻ lớp mình để xác minh, và xem bản ghi
// đón về của lớp mình trong một ngày; cùng phạm vi lớp chủ nhiệm.
// FR-PICKUP-03: chỉ Phụ huynh thêm, xem, sửa người đón của con mình (BR-PICKUP-03, BR-SCOPE-01) và
// xóa người đón dự phòng (D40 mục 1). Trẻ không phải con mình → 404 (AC-PICKUP-07).
[ApiController]
[Route("api")]
[Authorize]
public class PickupController : ControllerBase
{
    private readonly IPickupService _pickupService;
    private readonly IValidator<CreatePickupRequest> _createPickupValidator;
    private readonly IValidator<CreatePickupPersonRequest> _createPickupPersonValidator;
    private readonly IValidator<PickupPersonRequest> _updatePickupPersonValidator;
    private readonly IValidator<UploadedPhoto> _facePhotoValidator;

    public PickupController(
        IPickupService pickupService,
        IValidator<CreatePickupRequest> createPickupValidator,
        IValidator<CreatePickupPersonRequest> createPickupPersonValidator,
        IValidator<PickupPersonRequest> updatePickupPersonValidator,
        IValidator<UploadedPhoto> facePhotoValidator)
    {
        _pickupService = pickupService;
        _createPickupValidator = createPickupValidator;
        _createPickupPersonValidator = createPickupPersonValidator;
        _updatePickupPersonValidator = updatePickupPersonValidator;
        _facePhotoValidator = facePhotoValidator;
    }

    // Bắt buộc có ngày để không trả cả lịch sử đón về của lớp. Giáo viên chưa được gán lớp hoặc ngày
    // chưa có ai được đón thì danh sách rỗng
    [HttpGet("pickups")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PickupResponse>>>> GetByDate([FromQuery] DateOnly? date)
    {
        if (date is null)
            return BadRequest(ApiResponse<IReadOnlyList<PickupResponse>>.Fail(
                new[] { "Cần chọn ngày (date) để xem danh sách đón về." }));

        var result = await _pickupService.GetByDateAsync(date.Value, CurrentUserId());
        return Ok(ApiResponse<IReadOnlyList<PickupResponse>>.Ok(result));
    }

    // Người đón chính trước, người dự phòng sau (D24). Trẻ không tồn tại và trẻ lớp khác cùng trả 404
    // (AC-PICKUP-06); trẻ lớp mình chưa có người đón thì danh sách rỗng
    [HttpGet("homeroom-children/{childId:guid}/pickup-persons")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PickupPersonResponse>>>> GetPickupPersons(Guid childId)
    {
        var result = await _pickupService.GetPickupPersonsAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<PickupPersonResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<PickupPersonResponse>>.Ok(result));
    }

    [HttpGet("pickups/{id:guid}")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<PickupResponse>>> GetById(Guid id)
    {
        var result = await _pickupService.GetByIdAsync(id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<PickupResponse>.Fail("Không tìm thấy bản ghi đón về."));

        return Ok(ApiResponse<PickupResponse>.Ok(result));
    }

    [HttpPost("pickups")]
    [Authorize(Roles = Roles.Teacher)]
    public async Task<ActionResult<ApiResponse<PickupResponse>>> Create([FromBody] CreatePickupRequest request)
    {
        var validationResult = await _createPickupValidator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
            return BadRequest(ApiResponse<PickupResponse>.Fail(errors));
        }

        var result = await _pickupService.CreateAsync(request, CurrentUserId());

        return result.Outcome switch
        {
            PickupOutcome.Success => CreatedAtAction(nameof(GetById), new { id = result.Pickup!.Id },
                ApiResponse<PickupResponse>.Ok(result.Pickup)),
            PickupOutcome.ChildNotFound => NotFound(ApiResponse<PickupResponse>.Fail("Không tìm thấy trẻ.")),
            PickupOutcome.PickupPersonNotFound => NotFound(ApiResponse<PickupResponse>.Fail(
                "Không tìm thấy người đón đã đăng ký của trẻ.")),
            PickupOutcome.NotCheckedInToday => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ chưa được điểm danh hôm nay nên chưa ghi nhận đón về được.")),
            PickupOutcome.ChildAbsent => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ vắng hôm nay nên không ghi nhận đón về được.")),
            PickupOutcome.AlreadyPickedUp => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ đã được ghi nhận đón về hôm nay. Bản ghi đón về đã ghi không sửa được.")),
            PickupOutcome.NoPrimaryPerson => Conflict(ApiResponse<PickupResponse>.Fail(
                "Trẻ chưa có người đón chính nên chưa ghi nhận đón về được.")),
            PickupOutcome.MethodMismatch => Conflict(ApiResponse<PickupResponse>.Fail(
                "Cách đón không khớp với người đón được chọn.")),
            _ => throw new InvalidOperationException($"Kết quả ghi nhận đón về không xử lý: {result.Outcome}")
        };
    }

    // Người đón chính trước, người dự phòng sau (AC-PICKUP-03). Con mình chưa có người đón thì danh sách rỗng
    [HttpGet("children/{childId:guid}/pickup-persons")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PickupPersonResponse>>>> GetPickupPersonsOfChild(Guid childId)
    {
        var result = await _pickupService.GetPickupPersonsForGuardianAsync(childId, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<IReadOnlyList<PickupPersonResponse>>.Fail("Không tìm thấy trẻ."));

        return Ok(ApiResponse<IReadOnlyList<PickupPersonResponse>>.Ok(result));
    }

    [HttpGet("children/{childId:guid}/pickup-persons/{id:guid}")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<PickupPersonResponse>>> GetPickupPersonOfChild(Guid childId, Guid id)
    {
        var result = await _pickupService.GetPickupPersonForGuardianAsync(childId, id, CurrentUserId());

        if (result is null)
            return NotFound(ApiResponse<PickupPersonResponse>.Fail("Không tìm thấy người đón đã đăng ký của trẻ."));

        return Ok(ApiResponse<PickupPersonResponse>.Ok(result));
    }

    // Multipart: priority, 4 thông tin, consentConfirmed và đúng 1 ảnh ở trường facePhoto (D24)
    [HttpPost("children/{childId:guid}/pickup-persons")]
    [Authorize(Roles = Roles.Parent)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<PickupPersonResponse>>> CreatePickupPerson(
        Guid childId, [FromForm] CreatePickupPersonRequest request, List<IFormFile>? facePhoto)
    {
        var photos = ToUploadedPhotos(facePhoto);
        var errors = await ValidatePickupPersonAsync(_createPickupPersonValidator, request, photos, photoRequired: true);
        if (errors.Count > 0)
            return BadRequest(ApiResponse<PickupPersonResponse>.Fail(errors));

        var result = await _pickupService.CreatePickupPersonAsync(childId, request, photos[0], CurrentUserId());

        if (result.Outcome != PickupPersonOutcome.Success)
            return PickupPersonFailure<PickupPersonResponse>(result.Outcome);

        return CreatedAtAction(nameof(GetPickupPersonOfChild), new { childId, id = result.Person!.Id },
            ApiResponse<PickupPersonResponse>.Ok(result.Person));
    }

    // Như khi thêm nhưng không có priority; không gửi ảnh thì giữ ảnh cũ
    [HttpPut("children/{childId:guid}/pickup-persons/{id:guid}")]
    [Authorize(Roles = Roles.Parent)]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<PickupPersonResponse>>> UpdatePickupPerson(
        Guid childId, Guid id, [FromForm] PickupPersonRequest request, List<IFormFile>? facePhoto)
    {
        var photos = ToUploadedPhotos(facePhoto);
        var errors = await ValidatePickupPersonAsync(_updatePickupPersonValidator, request, photos, photoRequired: false);
        if (errors.Count > 0)
            return BadRequest(ApiResponse<PickupPersonResponse>.Fail(errors));

        var result = await _pickupService.UpdatePickupPersonAsync(childId, id, request, photos.FirstOrDefault(),
            CurrentUserId());

        if (result.Outcome != PickupPersonOutcome.Success)
            return PickupPersonFailure<PickupPersonResponse>(result.Outcome);

        return Ok(ApiResponse<PickupPersonResponse>.Ok(result.Person!));
    }

    // Một trong hai endpoint DELETE của hệ thống (D40 mục 1): chỉ xóa người đón dự phòng
    [HttpDelete("children/{childId:guid}/pickup-persons/{id:guid}")]
    [Authorize(Roles = Roles.Parent)]
    public async Task<ActionResult<ApiResponse<object?>>> DeletePickupPerson(Guid childId, Guid id)
    {
        var result = await _pickupService.DeletePickupPersonAsync(childId, id, CurrentUserId());

        if (result.Outcome != PickupPersonOutcome.Success)
            return PickupPersonFailure<object?>(result.Outcome);

        return Ok(ApiResponse<object?>.Ok(null, "Đã xóa người đón dự phòng."));
    }

    // D39 mục 5: ảnh khuôn mặt gửi ở trường facePhoto, đúng 1 ảnh khi thêm và tối đa 1 ảnh khi sửa. Kiểm ở
    // đây, trước khi file tới IFileStorageService; lỗi của 4 thông tin và của ảnh trả chung một lần
    private async Task<List<string>> ValidatePickupPersonAsync<TRequest>(IValidator<TRequest> validator,
        TRequest request, IReadOnlyList<UploadedPhoto> photos, bool photoRequired)
    {
        var errors = (await validator.ValidateAsync(request)).Errors.Select(e => e.ErrorMessage).ToList();

        if (photos.Count > 1)
            errors.Add("Chỉ gửi đúng 1 ảnh khuôn mặt cho mỗi người đón.");
        else if (photos.Count == 0 && photoRequired)
            errors.Add("Cần 1 ảnh khuôn mặt của người đón.");
        else if (photos.Count == 1)
            errors.AddRange((await _facePhotoValidator.ValidateAsync(photos[0])).Errors.Select(e => e.ErrorMessage));

        return errors;
    }

    private static IReadOnlyList<UploadedPhoto> ToUploadedPhotos(List<IFormFile>? files)
        => files?.Select(f => new UploadedPhoto(f.FileName, f.ContentType, f.Length, f.OpenReadStream)).ToList()
            ?? new List<UploadedPhoto>();

    // Thêm, sửa, xóa người đón dùng chung message cho từng kết quả thất bại
    private ActionResult PickupPersonFailure<T>(PickupPersonOutcome outcome) => outcome switch
    {
        PickupPersonOutcome.ChildNotFound => NotFound(ApiResponse<T>.Fail("Không tìm thấy trẻ.")),
        PickupPersonOutcome.PickupPersonNotFound => NotFound(ApiResponse<T>.Fail(
            "Không tìm thấy người đón đã đăng ký của trẻ.")),
        PickupPersonOutcome.PrimaryAlreadyExists => Conflict(ApiResponse<T>.Fail(
            "Trẻ đã có người đón chính. Muốn đổi người đón chính thì sửa thông tin người đó.")),
        PickupPersonOutcome.BackupAlreadyExists => Conflict(ApiResponse<T>.Fail(
            "Trẻ đã có người đón dự phòng. Muốn đổi người thì sửa hoặc xóa người dự phòng hiện tại.")),
        PickupPersonOutcome.NoPrimaryPerson => Conflict(ApiResponse<T>.Fail(
            "Cần đăng ký người đón chính trước khi thêm người đón dự phòng.")),
        PickupPersonOutcome.DuplicateCitizenId => Conflict(ApiResponse<T>.Fail(
            "Người đón chính và người đón dự phòng không được trùng số CCCD.")),
        PickupPersonOutcome.CannotDeletePrimary => Conflict(ApiResponse<T>.Fail(
            "Không xóa được người đón chính, chỉ sửa được thông tin.")),
        PickupPersonOutcome.ChangedConcurrently => Conflict(ApiResponse<T>.Fail(
            "Thông tin người đón vừa được thay đổi. Vui lòng tải lại rồi thử lại.")),
        _ => throw new InvalidOperationException($"Kết quả quản lý người đón không xử lý: {outcome}")
    };

    // ActiveUserMiddleware đã kiểm tra claim sub là Guid hợp lệ trước khi vào đây
    private Guid CurrentUserId() => Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)!.Value);
}
