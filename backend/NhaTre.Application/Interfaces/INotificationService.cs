using NhaTre.Application.DTOs.Notifications;

namespace NhaTre.Application.Interfaces;

// D39 mục 6: service duy nhất ghi bảng notifications. Module gọi tự soạn message
// (câu tiếng Việt hoàn chỉnh — D25), lưu xong bản ghi của mình rồi gọi một trong
// bốn nhóm người nhận dưới đây. Chỉ Phụ huynh và Y tế nhận thông báo (BR-NOTIFICATION-01).
public interface INotificationService
{
    // Hóa đơn mới hoặc hóa đơn unpaid được sửa (FR-TUITION-02); sự cố (FR-INCIDENT-01) hoặc sức khỏe nhanh (FR-HEALTH-01) mới
    Task NotifyParentsOfChildAsync(Guid childId, string message);
    // Ảnh hoạt động mới của lớp (FR-MEDIA-01)
    Task NotifyParentsOfClassAsync(Guid classId, string message);
    // Chỉ sự cố mới (FR-INCIDENT-01, FR-NOTI-02); sức khỏe nhanh không gửi Y tế
    Task NotifyActiveMedicalUsersAsync(string message);
    // Kế toán phát thông báo nghỉ học (FR-NOTI-03)
    Task NotifyActiveParentsAsync(string message);

    // FR-NOTI-01, FR-NOTI-02: Phụ huynh và Y tế xem thông báo gửi cho chính mình (BR-NOTIFICATION-02)
    Task<NotificationPageResponse> GetMyNotificationsAsync(Guid recipientUserId, NotificationListQuery query);
}
