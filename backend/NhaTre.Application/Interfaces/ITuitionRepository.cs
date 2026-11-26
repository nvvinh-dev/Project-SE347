using NhaTre.Application.DTOs.Tuition;
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

    // Lập hóa đơn hàng loạt (FR-TUITION-10). Lớp đã lưu trữ vẫn tính là tồn tại
    Task<bool> ClassExistsAsync(Guid classId);
    Task<bool> GradeLevelExistsAsync(short gradeLevelId);
    // Trẻ đang ở lớp chưa lưu trữ trong phạm vi; classId và gradeLevelId cùng null là toàn trường.
    // So mô tả sau khi bỏ khoảng trắng hai đầu; description truyền vào đã trim
    Task<IReadOnlyList<BulkInvoiceCandidate>> GetBulkInvoiceCandidatesAsync(
        Guid? classId, short? gradeLevelId, string description);
    // Thêm các hóa đơn trong một transaction, bỏ hóa đơn của trẻ đã có hóa đơn cùng mô tả (kiểm lại trong
    // transaction). Trả các hóa đơn đã lưu; rỗng thì không lưu gì
    Task<IReadOnlyList<Invoice>> AddBulkInvoicesAsync(Guid tuitionFeeId, IReadOnlyList<Invoice> invoices,
        string description);

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

    // Tự đối soát giao dịch ngân hàng (D21 mục 2). Repository đặt trạng thái, lý do không khớp và hóa đơn
    // của giao dịch theo các mã thanh toán tìm được trong nội dung; khớp thì chuyển hóa đơn sang paid và tạo
    // thanh toán, cùng một transaction với việc lưu giao dịch. null khi transaction_id đã có
    Task<bool> BankTransactionExistsAsync(string transactionId);
    Task<BankTransaction?> ReconcileBankTransactionAsync(BankTransaction transaction, IReadOnlyCollection<string> paymentCodes);

    // Đối soát thủ công (D21 mục 3). Giao dịch trả về kèm Invoice và Invoice.Child khi đã khớp
    Task<IReadOnlyList<BankTransaction>> GetBankTransactionsAsync(string? status);
    Task<BankTransaction?> FindBankTransactionByIdAsync(Guid id);

    // Chuyển hóa đơn unpaid cùng số tiền sang paid, chuyển giao dịch Unmatched sang Matched và tạo thanh toán
    // trong cùng một transaction. false khi một trong hai câu cập nhật không khớp dòng nào (không đổi gì)
    Task<bool> MatchBankTransactionAsync(BankTransaction transaction, Guid invoiceId,
        Guid accountantUserId, DateTime resolvedAtUtc);

    // Chuyển giao dịch Unmatched sang Dismissed; false khi giao dịch không còn Unmatched
    Task<bool> DismissBankTransactionAsync(Guid id, string note, Guid accountantUserId, DateTime resolvedAtUtc);

    // Báo cáo doanh thu: tổng tiền các thanh toán có paid_at trong [fromUtc, toUtc), 0 khi không có
    Task<decimal> SumPaymentsAsync(DateTime fromUtc, DateTime toUtc);
    Task<int> CountUnpaidInvoicesAsync();

    Task SaveChangesAsync();
}
