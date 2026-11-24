namespace NhaTre.Application.DTOs.Tuition;

// Đối soát thủ công thất bại theo nhiều kiểu (404 giao dịch hay hóa đơn, 409 theo từng lý do), nên Service
// trả kết quả kèm lý do để Controller chọn status code và message
public enum BankTransactionOutcome
{
    Success,
    TransactionNotFound,
    TransactionResolved,   // giao dịch đã Matched hoặc Dismissed
    InvoiceNotFound,
    InvoicePaid,
    AmountMismatch,
    Conflict               // giao dịch hoặc hóa đơn vừa được xử lý bởi yêu cầu khác giữa lúc đọc và lúc ghi
}

public record BankTransactionResult(BankTransactionOutcome Outcome, BankTransactionResponse? Transaction = null);
