using System.Globalization;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Incidents;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly INotificationService _notificationService;
    private readonly IFileStorageService _fileStorageService;

    public IncidentService(IIncidentRepository incidentRepository, INotificationService notificationService,
        IFileStorageService fileStorageService)
    {
        _incidentRepository = incidentRepository;
        _notificationService = notificationService;
        _fileStorageService = fileStorageService;
    }

    // FR-INCIDENT-01. Trẻ không tồn tại, chưa xếp lớp hay thuộc lớp khác đều ngoài phạm vi → 404
    // (BR-SCOPE-02, AC-INCIDENT-05). Người ghi nhận lấy từ phiên đăng nhập (D44 mục 2). Sự cố đã tạo
    // không sửa mô tả, không xóa (UC-INCIDENT-01)
    public async Task<IncidentResponse?> CreateIncidentAsync(CreateIncidentRequest request, Guid teacherUserId)
    {
        var child = await _incidentRepository.FindChildInHomeroomClassAsync(request.ChildId, teacherUserId);
        if (child is null)
            return null;

        var incident = new Incident
        {
            ChildId = child.Id,
            // Repository đã lọc lớp chủ nhiệm theo tài khoản đang đăng nhập, nên đây là hồ sơ teachers của chính người gọi
            RecordedByTeacherId = child.Class!.HomeroomTeacherId!.Value,
            // Validator đã chặn chuỗi không có múi giờ; chuỗi có độ lệch (+07:00) được đọc thành giờ máy
            // chủ, đổi lại về UTC để lưu vào timestamptz
            OccurredAt = request.OccurredAtUtc.ToUniversalTime(),
            Description = request.Description.Trim()
        };

        // Soạn thông báo trước khi lưu, như sức khỏe nhanh: lỗi lúc soạn thì chưa ghi gì vào database
        var message = IncidentMessage(child.FullName, incident);

        _incidentRepository.AddIncident(incident);
        await _incidentRepository.SaveChangesAsync();

        // D39 mục 6: lưu xong mới gửi, cho phụ huynh của đúng trẻ và mọi tài khoản Y tế đang hoạt động
        // (AC-INCIDENT-01, AC-NOTI-03). Nội dung không ghi lớp (D40 mục 3)
        await _notificationService.NotifyParentsOfChildAsync(child.Id, message);
        await _notificationService.NotifyActiveMedicalUsersAsync(message);

        // Sự cố vừa tạo chưa có ảnh nên không gọi Storage (AC-INCIDENT-03)
        return await ToResponseAsync(incident, child.FullName, incident.IncidentPhotos);
    }

    public async Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid teacherUserId)
    {
        var incident = await _incidentRepository.FindIncidentInHomeroomClassAsync(id, teacherUserId);
        return incident is null ? null : await ToResponseAsync(incident, incident.Child.FullName, incident.IncidentPhotos);
    }

    // FR-INCIDENT-02, AC-INCIDENT-02. Validator đã kiểm số lượng, định dạng và dung lượng ảnh. Sự cố không tồn
    // tại hay của trẻ lớp khác → 404 (AC-INCIDENT-05 b), kiểm trước khi upload nên không file nào lên Storage.
    // Đính thêm không sửa mô tả, không đụng ảnh cũ (UC-INCIDENT-01). Không sinh thông báo: đính ảnh không
    // thuộc 4 sự kiện của D39 mục 6
    public async Task<IncidentResponse?> AttachPhotosAsync(Guid incidentId, AttachIncidentPhotosRequest request,
        Guid teacherUserId)
    {
        var incident = await _incidentRepository.FindIncidentInHomeroomClassAsync(incidentId, teacherUserId);
        if (incident is null)
            return null;

        var newPhotos = new List<IncidentPhoto>(request.Photos.Count);
        var saved = false;
        try
        {
            foreach (var photo in request.Photos)
            {
                using var content = photo.OpenReadStream();
                var fileReference = await _fileStorageService.UploadAsync(content, StorageFolders.Incidents,
                    photo.ContentType);
                newPhotos.Add(new IncidentPhoto { IncidentId = incident.Id, FileReference = fileReference });
            }

            _incidentRepository.AddIncidentPhotos(newPhotos);

            // Ký URL trước khi ghi database, như người đón: bước này lỗi thì chưa lưu gì, giáo viên gửi lại
            // không bị trùng ảnh. Xếp theo Id như GET (repository ORDER BY id) để hai endpoint trả cùng thứ
            // tự; Guid.CompareTo so sánh theo đúng thứ tự byte của kiểu uuid trong PostgreSQL
            var response = await ToResponseAsync(incident, incident.Child.FullName,
                incident.IncidentPhotos.Concat(newPhotos).OrderBy(p => p.Id));

            await _incidentRepository.SaveChangesAsync();
            saved = true;
            return response;
        }
        finally
        {
            // Một ảnh upload lỗi, ký URL lỗi hay ghi database lỗi thì xóa mọi ảnh đã lên bucket trong lần này,
            // không để file mồ côi
            if (!saved)
            {
                foreach (var photo in newPhotos)
                    await _fileStorageService.DeleteAsync(photo.FileReference);
            }
        }
    }

    // Thông báo là câu tiếng Việt hoàn chỉnh do backend soạn (D25): họ tên trẻ, giờ xảy ra theo giờ
    // Việt Nam (D23) và mô tả; không ghi lớp vì Y tế không xem phân lớp (D40 mục 3)
    private static string IncidentMessage(string childFullName, Incident incident)
    {
        var occurredAt = VietnamTime.ToVietnamTime(incident.OccurredAt)
            .ToString("HH:mm 'ngày' dd/MM/yyyy", CultureInfo.InvariantCulture);

        return $"Giáo viên vừa ghi nhận sự cố của bé {childFullName}, xảy ra lúc {occurredAt}. " +
            $"Mô tả: {incident.Description}";
    }

    // D53: mỗi ảnh một URL ký hạn 60 phút. Chỉ gọi sau khi đã kiểm phạm vi sự cố
    private async Task<IncidentResponse> ToResponseAsync(Incident incident, string childFullName,
        IEnumerable<IncidentPhoto> photos)
    {
        var photoResponses = new List<IncidentPhotoResponse>();
        foreach (var photo in photos)
            photoResponses.Add(new IncidentPhotoResponse(photo.Id,
                await _fileStorageService.GetSignedUrlAsync(photo.FileReference)));

        return new IncidentResponse(incident.Id, incident.ChildId, childFullName, incident.OccurredAt,
            incident.Description, photoResponses);
    }
}
