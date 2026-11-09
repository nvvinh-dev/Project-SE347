using NhaTre.Application.DTOs.Complaints;

namespace NhaTre.Application.Interfaces;

public interface IComplaintService
{
    // FR-COMPLAINT-01: null khi trẻ không liên kết với phụ huynh hoặc không tồn tại (→ 404)
    Task<ChildComplaintResponse?> CreateComplaintAsync(Guid childId, CreateComplaintRequest request, Guid parentUserId);
    Task<IReadOnlyList<ChildComplaintResponse>?> GetChildComplaintsForGuardianAsync(Guid childId, Guid parentUserId);

    // FR-COMPLAINT-02: Admin xem mọi phản ánh và xử lý
    Task<ComplaintPageResponse> GetComplaintsAsync(ComplaintListQuery query);
    Task<HandleComplaintResult> HandleComplaintAsync(Guid id, HandleComplaintRequest request, Guid adminUserId);
}
