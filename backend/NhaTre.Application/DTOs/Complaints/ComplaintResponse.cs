namespace NhaTre.Application.DTOs.Complaints;

// Phản ánh Admin xem: kèm họ tên trẻ, lớp hiện tại và họ tên phụ huynh gửi; không kèm điểm danh, sức
// khỏe, sự cố hay học phí của trẻ (D40 mục 3, D45). ClassName null khi trẻ chưa xếp lớp
public record ComplaintResponse(
    Guid Id,
    Guid ChildId,
    string ChildFullName,
    string? ClassName,
    string SubmittedByFullName,
    string Content,
    string Status,
    string? Resolution,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc);
