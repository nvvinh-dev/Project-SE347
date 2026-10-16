namespace NhaTre.Application.Interfaces;

// D50: service duy nhất ghi bảng security_events. Module gọi sau khi thay đổi nghiệp vụ đã
// lưu (và đã commit nếu có transaction), không gọi bên trong transaction. Sự kiện được ghi
// bằng kết nối riêng nên gọi trong transaction sẽ:
//   - vẫn để lại sự kiện dù transaction sau đó rollback;
//   - treo request nếu transaction đang giữ FOR UPDATE trên dòng users của actor hoặc target:
//     câu INSERT phải lấy khóa FOR KEY SHARE trên dòng đó để kiểm khóa ngoại, nên chờ
//     transaction, còn transaction thì chờ INSERT. Request treo tới hết command timeout
//     (mặc định 30 giây) rồi sự kiện bị bỏ. Luồng vô hiệu hóa khóa các Admin đang hoạt động,
//     mà actor là một Admin, nên rơi đúng trường hợp này.
// Service không bao giờ ném lỗi — ghi hỏng thì log rồi đi tiếp — nên nơi gọi không bọc
// try/catch.
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
