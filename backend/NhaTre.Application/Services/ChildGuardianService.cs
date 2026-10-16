using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Services;

// FR-STU-02: Kế toán liên kết tài khoản Phụ huynh có sẵn với hồ sơ trẻ và gỡ liên kết (D39 mục 16).
// Gỡ liên kết là ngoại lệ Xóa của D40 mục 1. Mỗi lần tạo hay gỡ ghi guardian_link_changed (D50)
public class ChildGuardianService : IChildGuardianService
{
    private readonly IChildGuardianRepository _childGuardianRepository;
    private readonly ISecurityEventService _securityEventService;

    public ChildGuardianService(
        IChildGuardianRepository childGuardianRepository,
        ISecurityEventService securityEventService)
    {
        _childGuardianRepository = childGuardianRepository;
        _securityEventService = securityEventService;
    }

    public async Task<IReadOnlyList<GuardianResponse>> SearchParentAccountsAsync(string? search)
    {
        // Email đã lưu chữ thường (D20), nên đưa từ khóa về chữ thường một lần ở đây
        var keyword = search?.Trim().ToLowerInvariant();

        return await _childGuardianRepository.SearchActiveParentsAsync(
            string.IsNullOrEmpty(keyword) ? null : keyword);
    }

    public async Task<IReadOnlyList<GuardianResponse>?> GetGuardiansAsync(Guid childId)
    {
        if (!await _childGuardianRepository.ChildExistsAsync(childId))
            return null;

        return await _childGuardianRepository.GetGuardiansOfChildAsync(childId);
    }

    public async Task<GuardianLinkResult> LinkAsync(Guid childId, LinkGuardianRequest request, Guid actorUserId)
    {
        if (!await _childGuardianRepository.ChildExistsAsync(childId))
            return new GuardianLinkResult(GuardianLinkOutcome.ChildNotFound);

        // Không có tài khoản, sai vai trò hay đã bị vô hiệu hóa đều cùng một kết quả: tách riêng thì
        // Kế toán dò được vai trò và trạng thái của tài khoản khác qua API này (UC-STU-02 A2)
        var guardian = await _childGuardianRepository.FindActiveParentAsync(request.GuardianUserId);

        if (guardian is null)
            return new GuardianLinkResult(GuardianLinkOutcome.InvalidGuardian);

        if (await _childGuardianRepository.LinkExistsAsync(childId, guardian.UserId))
            return new GuardianLinkResult(GuardianLinkOutcome.AlreadyLinked);

        // Vai trò hay trạng thái tài khoản đổi sau lúc này cũng không mở thêm quyền: tài khoản bị vô
        // hiệu hóa không đăng nhập được, và mọi chức năng xét vai trò trước rồi mới xét liên kết (D39 mục 7)
        if (!await _childGuardianRepository.AddLinkAsync(childId, guardian.UserId))
            return new GuardianLinkResult(GuardianLinkOutcome.AlreadyLinked);

        await _securityEventService.RecordAsync(
            SecurityEventTypes.GuardianLinkChanged,
            actorUserId: actorUserId,
            targetUserId: guardian.UserId,
            targetReference: childId.ToString(),
            detail: SecurityEventDetails.Linked);

        return new GuardianLinkResult(GuardianLinkOutcome.Success, guardian);
    }

    // Gỡ không xét vai trò hay trạng thái tài khoản: liên kết sai phải gỡ được trong mọi trường hợp
    public async Task<GuardianLinkResult> UnlinkAsync(Guid childId, Guid guardianUserId, Guid actorUserId)
    {
        if (!await _childGuardianRepository.ChildExistsAsync(childId))
            return new GuardianLinkResult(GuardianLinkOutcome.ChildNotFound);

        var guardian = await _childGuardianRepository.FindGuardianOfChildAsync(childId, guardianUserId);

        if (guardian is null)
            return new GuardianLinkResult(GuardianLinkOutcome.LinkNotFound);

        // Phạm vi phụ huynh tính lại ở mỗi request từ child_guardians, nên xóa xong là phụ huynh mất
        // quyền xem trẻ ngay từ request kế tiếp; dữ liệu của trẻ giữ nguyên (BR-STUDENT-03)
        if (!await _childGuardianRepository.RemoveLinkAsync(childId, guardianUserId))
            return new GuardianLinkResult(GuardianLinkOutcome.LinkNotFound);

        await _securityEventService.RecordAsync(
            SecurityEventTypes.GuardianLinkChanged,
            actorUserId: actorUserId,
            targetUserId: guardianUserId,
            targetReference: childId.ToString(),
            detail: SecurityEventDetails.Unlinked);

        return new GuardianLinkResult(GuardianLinkOutcome.Success, guardian);
    }
}
