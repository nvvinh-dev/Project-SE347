namespace NhaTre.Application.DTOs.Complaints;

// Phản ánh phụ huynh xem: không kèm người gửi, người xử lý, họ tên trẻ hay lớp (D45), vì phụ huynh đã
// chọn trẻ trước khi xem
public record ChildComplaintResponse(
    Guid Id,
    string Content,
    string Status,
    string? Resolution,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc);
