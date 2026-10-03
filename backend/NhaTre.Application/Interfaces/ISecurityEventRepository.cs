using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface ISecurityEventRepository
{
    // Lưu bằng DbContext riêng, tách khỏi DbContext và transaction của request. Lưu hỏng thì
    // log rồi nuốt lỗi, không ném ra ngoài (D50).
    Task AddAsync(SecurityEvent securityEvent);
}
