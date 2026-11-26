namespace NhaTre.Application.DTOs.Tuition;

// D45: không kèm số tài khoản nhận (luôn là của trường) hay thông tin phụ huynh. Bốn trường hóa đơn chỉ có
// khi giao dịch đã khớp, còn lại null
public record BankTransactionResponse(
    Guid Id,
    string TransactionId,
    decimal Amount,
    string Content,
    DateTime TransactionAtUtc,
    string Status,
    string? UnmatchedReason,
    string? ResolutionNote,
    DateTime? ResolvedAtUtc,
    Guid? InvoiceId,
    string? InvoicePaymentCode,
    string? InvoiceDescription,
    string? InvoiceChildFullName);
