namespace NhaTre.Application.Interfaces;

// D39 mục 6: service duy nhất ghi bảng notifications. Module gọi tự soạn message
// (câu tiếng Việt hoàn chỉnh — D25), lưu xong bản ghi của mình rồi gọi một trong
// bốn nhóm người nhận dưới đây. Chỉ Phụ huynh và Y tế nhận thông báo (BR-NOTIFICATION-01).
public interface INotificationService
{
    Task NotifyParentsOfChildAsync(Guid childId, string message);
    Task NotifyParentsOfClassAsync(Guid classId, string message);
    Task NotifyActiveMedicalUsersAsync(string message);
    Task NotifyActiveParentsAsync(string message);
}
