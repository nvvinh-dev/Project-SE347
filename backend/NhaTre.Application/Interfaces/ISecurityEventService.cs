namespace NhaTre.Application.Interfaces;

// D50: service duy nhất ghi bảng security_events. Module gọi sau khi thay đổi nghiệp vụ đã
// lưu (và đã commit nếu có transaction), không gọi bên trong transaction. Service không bao
// giờ ném lỗi — ghi hỏng thì log rồi đi tiếp — nên nơi gọi không bọc try/catch.
// eventType lấy từ SecurityEventTypes, detail từ SecurityEventDetails; IP do service tự lấy.
// Gọi bằng tên tham số (actorUserId:, targetUserId:) để không truyền ngược hai Guid.
public interface ISecurityEventService
{
    Task RecordAsync(
        string eventType,
        Guid? actorUserId,
        Guid? targetUserId,
        string? targetReference = null,
        string? detail = null);
}
