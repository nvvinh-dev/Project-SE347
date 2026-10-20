using System.Globalization;
using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Incidents;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly INotificationService _notificationService;

    public IncidentService(IIncidentRepository incidentRepository, INotificationService notificationService)
    {
        _incidentRepository = incidentRepository;
        _notificationService = notificationService;
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

        return ToResponse(incident, child.FullName);
    }

    public async Task<IncidentResponse?> GetIncidentByIdAsync(Guid id, Guid teacherUserId)
    {
        var incident = await _incidentRepository.FindIncidentInHomeroomClassAsync(id, teacherUserId);
        return incident is null ? null : ToResponse(incident, incident.Child.FullName);
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

    private static IncidentResponse ToResponse(Incident incident, string childFullName)
        => new(incident.Id, incident.ChildId, childFullName, incident.OccurredAt, incident.Description);
}
