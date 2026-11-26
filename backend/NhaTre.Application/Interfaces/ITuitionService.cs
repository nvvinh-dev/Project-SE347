using NhaTre.Application.DTOs.Tuition;

namespace NhaTre.Application.Interfaces;

public interface ITuitionService
{
    Task<IReadOnlyList<TuitionFeeResponse>> GetFeesAsync();
    Task<TuitionFeeResponse?> GetFeeByIdAsync(Guid id);
    Task<TuitionFeeResponse?> CreateFeeAsync(TuitionFeeRequest request);
    Task<TuitionFeeResponse?> UpdateFeeAsync(Guid id, TuitionFeeRequest request);

    Task<IReadOnlyList<InvoiceResponse>> GetInvoicesAsync(Guid? childId, string? status);
    Task<InvoiceResponse?> GetInvoiceByIdAsync(Guid id);
    Task<InvoiceResult> CreateInvoiceAsync(InvoiceRequest request);
    Task<InvoiceResult> UpdateInvoiceAsync(Guid id, InvoiceRequest request);
    Task<PaymentResult> RecordPaymentAsync(Guid invoiceId, RecordPaymentRequest request, Guid accountantUserId);

    // Lập hóa đơn hàng loạt (FR-TUITION-10): xem trước không ghi gì, lập trả số hóa đơn đã lập
    Task<BulkInvoicePreviewResult> PreviewBulkInvoicesAsync(BulkInvoiceRequest request);
    Task<BulkInvoiceResult> CreateBulkInvoicesAsync(BulkInvoiceRequest request);

    // Webhook ngân hàng gọi sau khi đã kiểm chữ ký và validator (FR-TUITION-08)
    Task<BankReconcileOutcome> ReconcileBankTransactionAsync(BankTransactionNotification notification);

    // Kế toán đối soát giao dịch chưa khớp (FR-TUITION-09)
    Task<IReadOnlyList<BankTransactionResponse>> GetBankTransactionsAsync(string? status);
    Task<BankTransactionResult> MatchBankTransactionAsync(Guid id, MatchBankTransactionRequest request, Guid accountantUserId);
    Task<BankTransactionResult> DismissBankTransactionAsync(Guid id, DismissBankTransactionRequest request, Guid accountantUserId);

    // null khi trẻ không tồn tại hoặc không liên kết với phụ huynh (Controller trả 404)
    Task<IReadOnlyList<ChildInvoiceResponse>?> GetChildInvoicesForGuardianAsync(Guid childId, Guid parentUserId);
    Task<ChildInvoiceResponse?> GetChildInvoiceForGuardianAsync(Guid childId, Guid invoiceId, Guid parentUserId);
    Task<PaymentInstructionResult> GetPaymentInstructionForGuardianAsync(Guid childId, Guid invoiceId, Guid parentUserId);

    Task<RevenueReportResponse> GetRevenueReportAsync();
}
