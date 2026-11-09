using NhaTre.Application.DTOs.Complaints;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class ComplaintService : IComplaintService
{
    private readonly IComplaintRepository _complaintRepository;
    private readonly IChildGuardianRepository _childGuardianRepository;
    private readonly INotificationService _notificationService;

    public ComplaintService(IComplaintRepository complaintRepository,
        IChildGuardianRepository childGuardianRepository, INotificationService notificationService)
    {
        _complaintRepository = complaintRepository;
        _childGuardianRepository = childGuardianRepository;
        _notificationService = notificationService;
    }

    // Trạng thái luôn New, người gửi lấy từ sub, thời điểm là giờ server (D44). Lưu xong mới báo Admin
    public async Task<ChildComplaintResponse?> CreateComplaintAsync(Guid childId, CreateComplaintRequest request,
        Guid parentUserId)
    {
        if (!await _childGuardianRepository.LinkExistsAsync(childId, parentUserId))
            return null;

        var complaint = new Complaint
        {
            ChildId = childId,
            SubmittedByUserId = parentUserId,
            Content = request.Content.Trim(),
            Status = ComplaintStatuses.New,
            CreatedAt = DateTime.UtcNow
        };
        await _complaintRepository.AddAsync(complaint);

        // Đọc lại để có họ tên phụ huynh và trẻ; thông báo không chép nội dung phản ánh (D39 mục 6)
        var saved = await _complaintRepository.FindAsync(complaint.Id);
        if (saved is not null)
        {
            await _notificationService.NotifyActiveAdminsAsync(
                $"Phụ huynh {saved.SubmittedByFullName} vừa gửi phản ánh về bé {saved.ChildFullName}.");
        }

        return ToChildResponse(complaint);
    }

    // Kiểm liên kết trước để tách trẻ ngoài phạm vi (404) với con mình chưa có phản ánh (danh sách rỗng)
    public async Task<IReadOnlyList<ChildComplaintResponse>?> GetChildComplaintsForGuardianAsync(Guid childId,
        Guid parentUserId)
    {
        if (!await _childGuardianRepository.LinkExistsAsync(childId, parentUserId))
            return null;

        return await _complaintRepository.GetOfChildForGuardianAsync(childId, parentUserId);
    }

    public async Task<ComplaintPageResponse> GetComplaintsAsync(ComplaintListQuery query)
    {
        var totalCount = await _complaintRepository.CountAsync(query.Status);

        // Tính bằng long vì page rất lớn nhân pageSize vượt int. Trang nằm sau trang cuối thì không cần
        // truy vấn; còn lại skip nhỏ hơn totalCount nên ép về int an toàn
        var skip = (long)(query.Page - 1) * query.PageSize;
        IReadOnlyList<ComplaintResponse> items = [];
        if (skip < totalCount)
            items = await _complaintRepository.GetPageAsync(query.Status, (int)skip, query.PageSize);

        return new ComplaintPageResponse(items, query.Page, query.PageSize, totalCount);
    }

    // Người xử lý và thời điểm xử lý xong do server đặt (D44). Chỉ báo phụ huynh khi xử lý xong (D39 mục 6)
    public async Task<HandleComplaintResult> HandleComplaintAsync(Guid id, HandleComplaintRequest request,
        Guid adminUserId)
    {
        var isResolved = request.Status == ComplaintStatuses.Resolved;
        var resolution = isResolved ? request.Resolution!.Trim() : null;

        if (!await _complaintRepository.TryHandleAsync(id, request.Status, resolution, adminUserId, DateTime.UtcNow))
        {
            return await _complaintRepository.ExistsAsync(id)
                ? new HandleComplaintResult(HandleComplaintOutcome.AlreadyResolved)
                : new HandleComplaintResult(HandleComplaintOutcome.ComplaintNotFound);
        }

        var complaint = await _complaintRepository.FindAsync(id)
            ?? throw new InvalidOperationException("Phản ánh vừa xử lý không còn trong cơ sở dữ liệu.");

        if (isResolved)
        {
            var submitterId = await _complaintRepository.FindSubmitterIdAsync(id);
            if (submitterId is not null)
            {
                await _notificationService.NotifyParentAsync(submitterId.Value,
                    $"Phản ánh về bé {complaint.ChildFullName} đã được Ban giám hiệu xử lý xong. "
                    + "Phụ huynh xem kết quả trong mục phản ánh.");
            }
        }

        return new HandleComplaintResult(HandleComplaintOutcome.Success, complaint);
    }

    private static ChildComplaintResponse ToChildResponse(Complaint c)
        => new(c.Id, c.Content, c.Status, c.Resolution, c.CreatedAt, c.ResolvedAt);
}
