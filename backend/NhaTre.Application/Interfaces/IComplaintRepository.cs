using NhaTre.Application.DTOs.Complaints;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

// Các method đọc trả thẳng DTO: chỉ lấy đúng các cột mỗi vai trò được xem (D45)
public interface IComplaintRepository
{
    Task AddAsync(Complaint complaint);

    // Lọc child_guardians theo parentUserId ngay trong truy vấn; mới nhất trước rồi id tăng dần
    Task<IReadOnlyList<ChildComplaintResponse>> GetOfChildForGuardianAsync(Guid childId, Guid parentUserId);

    // status null thì đếm/lấy mọi trạng thái
    Task<int> CountAsync(string? status);
    Task<IReadOnlyList<ComplaintResponse>> GetPageAsync(string? status, int skip, int take);

    Task<ComplaintResponse?> FindAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<Guid?> FindSubmitterIdAsync(Guid id);

    // UPDATE có điều kiện status <> Resolved: false khi phản ánh không tồn tại hoặc đã Resolved, kể cả
    // khi request khác vừa xử lý xong trước. resolution và resolvedAtUtc chỉ ghi khi status là Resolved
    Task<bool> TryHandleAsync(Guid id, string status, string? resolution, Guid handledByUserId, DateTime nowUtc);
}
