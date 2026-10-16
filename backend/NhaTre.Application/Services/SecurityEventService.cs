using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class SecurityEventService : ISecurityEventService
{
    private readonly ISecurityEventRepository _securityEventRepository;
    private readonly IRequestContext _requestContext;

    public SecurityEventService(
        ISecurityEventRepository securityEventRepository,
        IRequestContext requestContext)
    {
        _securityEventRepository = securityEventRepository;
        _requestContext = requestContext;
    }

    public Task RecordAsync(
        string eventType,
        Guid? actorUserId,
        Guid? targetUserId,
        string? targetReference = null,
        string? detail = null)
    {
        // OccurredAt để trống: database tự đặt now() theo giờ server (D50)
        var securityEvent = new SecurityEvent
        {
            Id = Guid.NewGuid(),
            EventType = eventType,
            ActorUserId = actorUserId,
            TargetUserId = targetUserId,
            TargetReference = targetReference,
            IpAddress = _requestContext.IpAddress,
            Detail = detail,
        };

        return _securityEventRepository.AddAsync(securityEvent);
    }
}
