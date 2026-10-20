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

    // Phụ huynh xem hóa đơn: chỉ khớp khi trẻ có liên kết với parentUserId trong child_guardians
    Task<IReadOnlyList<Invoice>> GetInvoicesOfChildForGuardianAsync(Guid childId, Guid parentUserId);
    Task<Invoice?> FindInvoiceOfChildForGuardianAsync(Guid childId, Guid invoiceId, Guid parentUserId);

    // Sửa hóa đơn bằng một câu UPDATE chỉ khớp khi hóa đơn còn unpaid; false khi không dòng nào khớp
    Task<bool> UpdateUnpaidInvoiceAsync(Guid id, Guid childId, decimal amount, string description);

    // Chuyển hóa đơn unpaid sang paid và tạo bản ghi thanh toán trong cùng một transaction; số tiền
    // lấy từ chính câu chuyển paid. null khi không có hóa đơn unpaid nào mang id này
    Task<Payment?> RecordPaymentAsync(Guid invoiceId, string paymentMethod, string? externalReference,
        Guid recordedByUserId, DateTime paidAtUtc);
    Task<bool> InvoiceExistsAsync(Guid id);

    // Báo cáo doanh thu: tổng tiền các thanh toán có paid_at trong [fromUtc, toUtc), 0 khi không có
    Task<decimal> SumPaymentsAsync(DateTime fromUtc, DateTime toUtc);
    Task<int> CountUnpaidInvoicesAsync();

    Task SaveChangesAsync();
}
