using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class SecurityEventRepository : ISecurityEventRepository
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SecurityEventRepository> _logger;

    public SecurityEventRepository(
        IServiceScopeFactory scopeFactory,
        ILogger<SecurityEventRepository> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task AddAsync(SecurityEvent securityEvent)
    {
        try
        {
            // Mở scope mới để có DbContext và kết nối riêng, không dùng DbContext của request:
            // lưu hỏng trên DbContext chung thì entity lỗi vẫn bị theo dõi và làm hỏng lần
            // SaveChanges sau của nghiệp vụ; lưu trong transaction đang mở thì một câu lệnh lỗi
            // làm Postgres hủy cả transaction đó. Kết nối riêng KHÔNG làm cho việc gọi bên trong
            // transaction trở nên an toàn — xem chú thích ở ISecurityEventService.
            await using var scope = _scopeFactory.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            dbContext.SecurityEvents.Add(securityEvent);
            await dbContext.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // D50: bảng này là bằng chứng, không phải kiểm soát truy cập — ghi hỏng thì log rồi
            // đi tiếp, không làm hỏng nghiệp vụ chính. Log không ghi target_reference vì có thể
            // là email người dùng gõ vào.
            _logger.LogError(
                ex,
                "Không ghi được security_events {EventType} (người thực hiện {ActorUserId}, tài khoản bị tác động {TargetUserId})",
                securityEvent.EventType,
                securityEvent.ActorUserId,
                securityEvent.TargetUserId);
        }
    }
}
