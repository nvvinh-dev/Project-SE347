using NhaTre.Application.DTOs.Children;

namespace NhaTre.Application.Interfaces;

public interface IChildGuardianService
{
    Task<IReadOnlyList<GuardianResponse>> SearchParentAccountsAsync(string? search);

    // null khi trẻ không tồn tại
    Task<IReadOnlyList<GuardianResponse>?> GetGuardiansAsync(Guid childId);

    Task<GuardianLinkResult> LinkAsync(Guid childId, LinkGuardianRequest request, Guid actorUserId);
    Task<GuardianLinkResult> UnlinkAsync(Guid childId, Guid guardianUserId, Guid actorUserId);
}
