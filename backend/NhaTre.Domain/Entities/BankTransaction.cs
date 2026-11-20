namespace NhaTre.Domain.Entities;

/// Giao dịch vào tài khoản của trường, nhận qua webhook đã xác thực chữ ký (D21 mục 2).
/// Không sửa nội dung giao dịch, không xóa dòng.
public class BankTransaction
{
    public Guid Id { get; set; }
    public string TransactionId { get; set; } = null!; // mã giao dịch của ngân hàng, unique: gửi lại không xử lý lần hai
    public string AccountNumber { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Content { get; set; } = null!;       // nội dung chuyển khoản, nơi tìm payment_code
    public DateTime TransactionAt { get; set; }        // lúc tiền vào tài khoản, theo ngân hàng
    public DateTime ReceivedAt { get; set; }           // giờ server nhận webhook
    public string Status { get; set; } = null!;        // BankTransactionStatuses — check constraint ở DB (D51)
    public string? UnmatchedReason { get; set; }       // UnmatchedReasons; giữ lý do ban đầu kể cả khi Kế toán gán sau đó
    public Guid? InvoiceId { get; set; }               // có khi và chỉ khi Matched (D51)
    public string? ResolutionNote { get; set; }        // bắt buộc khi Dismissed (D51)
    public Guid? ResolvedByUserId { get; set; }        // Kế toán xử lý thủ công, lấy từ sub (D44)
    public DateTime? ResolvedAt { get; set; }

    public Invoice? Invoice { get; set; }
}
