using NhaTre.Domain.Entities;

namespace NhaTre.Application.Interfaces;

public interface ITuitionRepository
{
    Task<IReadOnlyList<TuitionFee>> GetAllFeesAsync();
    Task<TuitionFee?> FindFeeByIdAsync(Guid id);
    Task<bool> AnyFeeAsync();
    void AddFee(TuitionFee fee);

    // Hóa đơn trả về kèm Child để lấy họ tên trẻ
    Task<IReadOnlyList<Invoice>> GetInvoicesAsync(Guid? childId, string? status);
    Task<Invoice?> FindInvoiceByIdAsync(Guid id);
    void AddInvoice(Invoice invoice);

    // Sửa hóa đơn bằng một câu UPDATE chỉ khớp khi hóa đơn còn unpaid; false khi không dòng nào khớp
    Task<bool> UpdateUnpaidInvoiceAsync(Guid id, Guid childId, decimal amount, string description);

    Task SaveChangesAsync();
}
